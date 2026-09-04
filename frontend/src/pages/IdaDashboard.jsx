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
import { sanctions, districts } from "../data/mockData";
import { useApp } from "../context/AppContext";
import { riskTone, riskLabel } from "../utils/formatters";
import { dashboardService } from "../services/dashboardService";
import { adaptRisk } from "../services/adapters";

export function IdaDashboard() {
  const { setSelectedVendorId, setDemoStep } = useApp();
  const navigate = useNavigate();
  const [districtData, setDistrictData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchDistrictData() {
      try {
        const data = await dashboardService.getDistrictDashboard({ district: "Bhopal" });
        if (data && isMounted) {
          setDistrictData(data);
        }
      } catch (err) {
        console.warn("[MPLADS Sentinel] Backend unavailable — using demo fallback.", err);
      }
    }
    fetchDistrictData();
    return () => {
      isMounted = false;
    };
  }, []);

  const bhopalDistrict = districts.find((d) => d.name === "Bhopal") || districts[0];
  const scPct = districtData?.sc_st?.sc_share_pct !== undefined ? districtData.sc_st.sc_share_pct : bhopalDistrict.scPct;
  const stPct = districtData?.sc_st?.st_share_pct !== undefined ? districtData.sc_st.st_share_pct : bhopalDistrict.stPct;

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
    : sanctions;

  const sortedSanctions = [...pendingList].sort((a, b) => a.daysRemaining - b.daysRemaining);
  const urgentCount = sortedSanctions.filter((s) => s.daysRemaining <= 10).length;

  const handleReviewVendor = (vendorId) => {
    setSelectedVendorId(vendorId);
    setDemoStep(2);
    navigate("/vendors");
  };

  return (
    <AppShell
      title="Implementing District Authority (IDA) Portal · Bhopal"
      subtitle="Tactical operational triage: statutory sanction deadlines, spatial clearances, and vendor verification"
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
      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-rose-500/20 bg-rose-500/5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-rose-300">
            <span>45-Day Statutory Clock</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-rose-300 font-mono">
            {sortedSanctions[0]?.daysRemaining || 8} Days
          </div>
          <p className="mt-1 text-xs text-slate-300">
            Nearest statutory deadline: <span className="font-semibold">{sortedSanctions[0]?.work || "Work in review"}</span>
          </p>
          <div className="mt-2 text-[11px] text-rose-400 font-medium">
            ⚠️ {urgentCount} works within critical 10-day sanction window
          </div>
        </Card>

        <Card className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>District SC / ST Compliance</span>
            <Badge tone={scPct >= 15 && stPct >= 7.5 ? "normal" : "elevated"}>
              {scPct >= 15 && stPct >= 7.5 ? "Compliant" : "Lagging"}
            </Badge>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-300">SC Earmarking</span>
              <span className="font-mono font-bold text-amber-300">
                {scPct}% / 15.0%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400"
                style={{ width: `${Math.min(100, (scPct / 15) * 100)}%` }}
              />
            </div>
          </div>
          <div className="space-y-1 text-xs pt-1">
            <div className="flex justify-between">
              <span className="text-slate-300">ST Earmarking</span>
              <span className="font-mono font-bold text-amber-300">
                {stPct}% / 7.5%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400"
                style={{ width: `${Math.min(100, (stPct / 7.5) * 100)}%` }}
              />
            </div>
          </div>
        </Card>

        <Card className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Operational Triage Shortcuts</span>
            <FileCheck2 className="h-4 w-4 text-sky-400" />
          </div>
          <p className="text-xs text-slate-300">
            High-risk proposals require spatial conflict check & vendor background inspection before sanction approval.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              to="/spatial"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-center text-xs font-medium text-sky-300 hover:bg-slate-700 transition"
            >
              Verify Coordinates
            </Link>
            <Link
              to="/alerts"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-center text-xs font-medium text-rose-300 hover:bg-slate-700 transition"
            >
              Review Flagged Works
            </Link>
          </div>
        </Card>
      </div>

      {/* Pending Sanctions Queue Table */}
      <Card className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle>Pending Sanctions Queue</CardTitle>
            <CardHint>
              Mandatory 45-day statutory approval clock. Works sorted by days remaining before statutory expiry.
            </CardHint>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {sortedSanctions.length} Total Pending Actions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-2.5 px-3">Proposed Work</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Designated Vendor</th>
                <th className="py-2.5 px-3 text-right">Cost (₹ Cr)</th>
                <th className="py-2.5 px-3 text-center">Days Remaining</th>
                <th className="py-2.5 px-3 text-center">ML Risk Score</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedSanctions.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-slate-800/30 transition text-slate-200"
                >
                  <td className="py-3 px-3 font-semibold text-white">
                    {s.work}
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-400">
                    {s.category}
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => handleReviewVendor(s.vendorId)}
                      className="text-xs font-medium text-sky-400 hover:underline flex items-center gap-1 group"
                    >
                      {s.vendor}
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition" />
                    </button>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold">
                    ₹{s.amountCr.toFixed(2)} Cr
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold font-mono ${
                        s.daysRemaining <= 10
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : s.daysRemaining <= 20
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      {s.daysRemaining}d left
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Badge tone={riskTone(s.risk)}>
                      {riskLabel(s.risk)} {s.risk}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-right space-x-1">
                    <Link
                      to="/spatial"
                      className="inline-block rounded-md bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs text-sky-300 font-medium transition"
                    >
                      Verify Spatial
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
