import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Clock,
  ArrowRight,
  FileCheck2,
} from "lucide-react";
import { AppShell } from "../components/layout/AppShell";
import { Card, CardTitle, CardHint } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { useApp } from "../context/AppContext";
import { riskTone, riskLabel } from "../utils/formatters";
import { dashboardService } from "../services/dashboardService";
import { adaptRisk } from "../services/adapters";

import { MetricStrip } from "../components/common/MetricStrip";

export function IdaDashboard() {
  const { setSelectedVendorId, setDemoStep } = useApp();
  const navigate = useNavigate();
  const [districtData, setDistrictData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchDistrictData() {
      try {
        const data = await dashboardService.getDistrictDashboard({ district: "Pune" }); // Fetching for Pune since it's a real district in DB
        if (data && isMounted) {
          setDistrictData(data);
        }
      } catch (err) {
        console.warn("[MPLADS Sentinel] Backend unavailable.", err);
      }
    }
    fetchDistrictData();
    return () => {
      isMounted = false;
    };
  }, []);

  const districtName = districtData?.district || "Pune";
  const scPct = districtData?.sc_st?.sc_share_pct !== undefined ? districtData.sc_st.sc_share_pct : 0;
  const stPct = districtData?.sc_st?.st_share_pct !== undefined ? districtData.sc_st.st_share_pct : 0;

  const pendingList = districtData?.pending_sanctions?.length
    ? districtData.pending_sanctions.map((p, idx) => ({
        id: `sn-${p.project_id || idx}`,
        work: p.work_description || p.title || "Proposed Work",
        category: p.work_category || "Drinking Water",
        vendor: p.vendor_name || "Designated Contractor",
        amountCr: p.sanctioned_amount ? Number((p.sanctioned_amount / 10000000).toFixed(2)) : 0.24,
        daysRemaining: Math.max(1, 45 - Math.round((p.delay_probability || 0.15) * 45)),
        risk: adaptRisk(p.composite_risk_score),
        vendorId: p.vendor_id ? `v${p.vendor_id}` : "v1",
        stage: p.project_status || "Sanctioned",
        scStEarmarked: Boolean(p.sc_area || p.st_area),
      }))
    : [];

  const sortedSanctions = [...pendingList].sort((a, b) => a.daysRemaining - b.daysRemaining);
  const urgentCount = sortedSanctions.filter((s) => s.daysRemaining <= 10).length;
  const totalSanctionValue = sortedSanctions.reduce((sum, s) => sum + s.amountCr, 0).toFixed(2);

  const handleReviewVendor = (vendorId) => {
    setSelectedVendorId(vendorId);
    setDemoStep(2);
    navigate("/vendors");
  };

  return (
    <AppShell
      title={`Implementing District Authority (IDA) Portal · ${districtName} District`}
      subtitle="Tactical statutory triage: 45-day clearance window, spatial GIS validation, and contractor risk audits"
      actions={
        <div className="flex items-center gap-2">
          <Link to="/spatial">
            <Button variant="primary" size="sm">
              Spatial Clearance Canvas →
            </Button>
          </Link>
          <Link to="/alerts">
            <Button variant="critical" size="sm">
              Alert Triage Inbox
            </Button>
          </Link>
        </div>
      }
    >
      {/* 1. District Statutory Operations Metric Strip */}
      <MetricStrip
        items={[
          {
            label: "45-Day Statutory Clock",
            value: sortedSanctions.length > 0 ? `${sortedSanctions[0]?.daysRemaining} Days` : "All Cleared",
            subvalue: sortedSanctions.length > 0 ? `Urgent: ${sortedSanctions[0]?.work}` : "No pending works",
            trend: `${urgentCount} Critical`,
            tone: "critical",
            icon: Clock,
          },
          {
            label: "Pending Sanctions Queue",
            value: String(sortedSanctions.length),
            subvalue: `Total Value: ₹${totalSanctionValue} Cr`,
            trend: "Awaiting Clearance",
            tone: "elevated",
            icon: FileCheck2,
          },
          {
            label: "District SC Compliance",
            value: `${scPct}%`,
            subvalue: "Statutory Mandate: 15.0%",
            trend: scPct >= 15 ? "Compliant" : `Lag ${(15 - scPct).toFixed(1)}%`,
            tone: scPct >= 15 ? "normal" : "elevated",
          },
          {
            label: "District ST Compliance",
            value: `${stPct}%`,
            subvalue: "Statutory Mandate: 7.5%",
            trend: stPct >= 7.5 ? "Compliant" : `Lag ${(7.5 - stPct).toFixed(1)}%`,
            tone: stPct >= 7.5 ? "normal" : "elevated",
          },
        ]}
      />

      {/* 2. Operational Statutory Sanctions Queue Table */}
      <Card className="p-0 overflow-hidden flex flex-col">
        <div className="p-3 sm:px-4 border-b border-[#D9DDE3] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm">Statutory Sanctions & Verification Queue</CardTitle>
            <CardHint>
              Mandatory 45-day statutory approval clock. Sorted in ascending order of remaining statutory days before automatic escalation.
            </CardHint>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#7A838E]">
              {sortedSanctions.length} Proposals Pending Review
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#D9DDE3] bg-[#F0F2F5] text-[9px] font-bold uppercase tracking-wider text-[#7A838E]">
              <tr>
                <th className="py-2.5 px-3">Proposed Project</th>
                <th className="py-2.5 px-2.5">Category</th>
                <th className="py-2.5 px-2.5">Designated Contractor</th>
                <th className="py-2.5 px-2 text-right">Cost</th>
                <th className="py-2.5 px-2 text-center">45d Clock</th>
                <th className="py-2.5 px-2 text-center">ML Risk Score</th>
                <th className="py-2.5 px-3 text-right">Triage Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9DDE3] font-mono">
              {sortedSanctions.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-[#F0F2F5] transition-colors text-[#17202A]"
                >
                  <td className="py-2.5 px-3 font-sans">
                    <div className="font-semibold text-[#17202A]">{s.work}</div>
                    <div className="text-[10px] text-[#7A838E]">ID: {s.id}</div>
                  </td>
                  <td className="py-2.5 px-2.5 font-sans text-[11px] text-[#5B6470]">
                    {s.category}
                  </td>
                  <td className="py-2.5 px-2.5 font-sans">
                    <button
                      onClick={() => handleReviewVendor(s.vendorId)}
                      className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 group text-left"
                    >
                      {s.vendor}
                      <ArrowRight className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold text-[#17202A] tabular-nums">
                    ₹{s.amountCr.toFixed(2)} Cr
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        s.daysRemaining <= 10
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : s.daysRemaining <= 20
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-[#F0F2F5] text-[#5B6470] border border-[#D9DDE3]"
                      }`}
                    >
                      <Clock className="h-2.5 w-2.5" />
                      {s.daysRemaining}d left
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <Badge tone={riskTone(s.risk)} className="text-[9px] px-1 py-0">
                      {riskLabel(s.risk)} {s.risk}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-right font-sans space-x-1.5">
                    <Link
                      to="/spatial"
                      className="inline-block rounded border border-[#D9DDE3] bg-white hover:bg-[#F0F2F5] px-2 py-0.5 text-[10px] text-blue-700 font-semibold transition-colors shadow-xs"
                    >
                      Verify Geo
                    </Link>
                  </td>
                </tr>
              ))}
              {sortedSanctions.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-4 text-center text-[#7A838E]">
                    No pending statutory sanctions found in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
