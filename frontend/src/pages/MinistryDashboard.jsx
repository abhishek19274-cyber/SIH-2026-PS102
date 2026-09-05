import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { AppShell } from "../components/layout/AppShell";
import { IndiaHexHeatmap } from "../components/maps/IndiaHexHeatmap";
import { VelocityChart } from "../components/charts/VelocityChart";
import { TrendChart } from "../components/charts/TrendCharts";
import { Card, CardTitle, CardHint } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import {
  capitalVelocity,
  utilisationTrend,
  constituencies,
  vendors,
  agencies,
  scstNational,
} from "../data/mockData";
import { useApp } from "../context/AppContext";
import { riskTone } from "../utils/formatters";
import { dashboardService } from "../services/dashboardService";
import { adaptRisk } from "../services/adapters";

import { MetricStrip } from "../components/common/MetricStrip";

export function MinistryDashboard() {
  const { setSelectedConstituencyId, setSelectedVendorId, setDemoStep } = useApp();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchMinistryData() {
      try {
        const data = await dashboardService.getMinistryDashboard();
        if (data && isMounted) {
          setDashboardData(data);
        }
      } catch (err) {
        console.warn("[MPLADS Sentinel] Backend unavailable — using demo fallback.", err);
      }
    }
    fetchMinistryData();
    return () => {
      isMounted = false;
    };
  }, []);

  const sortedConstituencies = [...constituencies].sort((a, b) => b.risk - a.risk).slice(0, 7);
  const sortedVendors = dashboardData?.top_risk_vendors?.length
    ? dashboardData.top_risk_vendors.slice(0, 6).map((v) => ({
        id: `v${v.vendor_id}`,
        vendorId: v.vendor_id,
        name: v.vendor_name,
        contractValueCr: Number((v.total_contract_value / 10000000).toFixed(1)),
        overrunRate: 0.35,
        risk: adaptRisk(v.composite_risk_score),
      }))
    : [...vendors].sort((a, b) => b.risk - a.risk).slice(0, 6);

  const kpis = dashboardData?.kpis;

  const handleSelectConstituency = (c) => {
    setSelectedConstituencyId(c.id);
  };

  const handleInspectVendor = (v) => {
    setSelectedVendorId(v.id);
    setDemoStep(2);
    navigate("/vendors");
  };

  return (
    <AppShell
      title="MoSPI & Central Nodal Agency (CNA) Command Centre"
      subtitle="National macroeconomic oversight, early multi-factor anomaly detection, and capital velocity tracking"
      actions={
        <div className="flex items-center gap-2">
          <Badge tone="critical" className="text-[10px] py-0.5">
            {kpis?.pending_alerts !== undefined ? `${kpis.pending_alerts} ALERTS ACTIVE` : "18 ALERTS ACTIVE"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/vendors")}
          >
            Vendor Network Graph →
          </Button>
        </div>
      }
    >
      {/* 1. Unified Institutional KPI Metric Strip */}
      <MetricStrip
        items={[
          {
            label: "Total Authorized (FY 25-26)",
            value: kpis?.sanctioned_cr ? `₹${Number(kpis.sanctioned_cr).toLocaleString("en-IN")} Cr` : "₹2,715 Cr",
            subvalue: kpis?.total_projects ? `${kpis.total_projects} Projects Tracked` : "543 Parliamentary Constituencies",
            trend: "+4.2% YoY",
            tone: "info",
          },
          {
            label: "National Fund Utilisation",
            value: kpis?.utilisation_pct !== undefined ? `${kpis.utilisation_pct}%` : "58.4%",
            subvalue: "Target 75% before Q4 close",
            trend: kpis?.utilisation_pct ? `Lag ${(75 - kpis.utilisation_pct).toFixed(1)}%` : "Lag 16.6%",
            tone: "elevated",
          },
          {
            label: "High-Risk Constituencies",
            value: kpis?.high_risk_projects !== undefined ? String(kpis.high_risk_projects) : "42",
            subvalue: "Multi-factor Risk Score ≥ 70",
            trend: "Flagged",
            tone: "critical",
          },
          {
            label: "Capital Velocity Index",
            value: "67 Days",
            subvalue: "Avg CNA-to-Vendor duration",
            trend: "Stall at SNA",
            tone: "neutral",
          },
        ]}
      />

      {/* 2. Dominant Centerpiece: India National Geographic Heatmap */}
      <IndiaHexHeatmap />

      {/* 3. Analytical Row: Capital Velocity Flow & National Trend Trajectory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="space-y-2 p-3.5 sm:p-4">
          <CardTitle
            rightElement={
              <Badge tone="elevated">Predicted Unspent: ₹18.4 Cr</Badge>
            }
          >
            Capital Velocity & Unspent Accumulation
          </CardTitle>
          <CardHint>
            Fund traversal speed across administrative layers: CNA → SNA → District → Vendor. Amber area models accumulation of unspent balances.
          </CardHint>
          <div className="pt-1">
            <VelocityChart data={capitalVelocity} height={220} />
          </div>
        </Card>

        <Card className="space-y-2 p-3.5 sm:p-4">
          <CardTitle
            rightElement={
              <Badge tone="info">FY 2024 - 2025 Multi-quarter</Badge>
            }
          >
            National Performance & Anomaly Trends
          </CardTitle>
          <CardHint>
            Multi-quarter trajectory: green (utilisation %), blue (physical completion %), and red dashed (flagged anomaly volume).
          </CardHint>
          <div className="pt-1">
            <TrendChart data={utilisationTrend} height={220} />
          </div>
        </Card>
      </div>

      {/* 4. High-Density Institutional Analytics Tables (Constituencies, Vendors, Agencies) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Table 1: High-Risk Constituencies Table */}
        <Card className="p-0 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-[#D9DDE3] flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Priority Constituencies</CardTitle>
              <CardHint>Prioritized by AI multi-factor anomaly index</CardHint>
            </div>
            <Badge tone="critical">{sortedConstituencies.length} Flagged</Badge>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#D9DDE3] bg-[#F0F2F5] text-[9px] font-bold uppercase tracking-wider text-[#7A838E]">
                <tr>
                  <th className="py-2 px-2.5">Constituency</th>
                  <th className="py-2 px-2 text-right">Util %</th>
                  <th className="py-2 px-2 text-right">Risk</th>
                  <th className="py-2 px-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DDE3] font-mono">
                {sortedConstituencies.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => handleSelectConstituency(c)}
                    className="hover:bg-[#F0F2F5] cursor-pointer transition-colors"
                  >
                    <td className="py-2 px-2.5 font-sans">
                      <div className="font-semibold text-[#17202A]">{c.name}</div>
                      <div className="text-[10px] text-[#7A838E]">{c.state}</div>
                    </td>
                    <td className="py-2 px-2 text-right text-emerald-700 font-bold tabular-nums">
                      {c.utilisation}%
                    </td>
                    <td className="py-2 px-2 text-right">
                      <Badge tone={riskTone(c.risk)} className="text-[9px] px-1 py-0">
                        {c.risk}
                      </Badge>
                    </td>
                    <td className="py-2 px-2.5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectConstituency(c);
                        }}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-sans font-medium"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Table 2: High-Risk Vendors Table */}
        <Card className="p-0 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-[#D9DDE3] flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">High-Risk Vendor Ring</CardTitle>
              <CardHint>Flagged for collusion, overruns, or co-bidding</CardHint>
            </div>
            <Link
              to="/vendors"
              className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium font-sans"
            >
              Graph <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#D9DDE3] bg-[#F0F2F5] text-[9px] font-bold uppercase tracking-wider text-[#7A838E]">
                <tr>
                  <th className="py-2 px-2.5">Vendor</th>
                  <th className="py-2 px-2 text-right">Value</th>
                  <th className="py-2 px-2 text-right">Risk</th>
                  <th className="py-2 px-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DDE3] font-mono">
                {sortedVendors.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => handleInspectVendor(v)}
                    className="hover:bg-[#F0F2F5] cursor-pointer transition-colors group"
                  >
                    <td className="py-2 px-2.5 font-sans">
                      <div className="font-semibold text-[#17202A] group-hover:text-blue-600 transition-colors">
                        {v.name}
                      </div>
                      <div className="text-[10px] text-[#7A838E]">
                        Overrun {(v.overrunRate * 100).toFixed(0)}%
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right text-[#17202A] tabular-nums font-semibold">
                      ₹{v.contractValueCr} Cr
                    </td>
                    <td className="py-2 px-2 text-right">
                      <Badge tone={riskTone(v.risk)} className="text-[9px] px-1 py-0">
                        {v.risk}
                      </Badge>
                    </td>
                    <td className="py-2 px-2.5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInspectVendor(v);
                        }}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-sans font-medium"
                      >
                        Topology
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Table 3: Implementing Agencies Table */}
        <Card className="p-0 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-[#D9DDE3] flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Implementing District Authorities</CardTitle>
              <CardHint>District & municipal execution bodies</CardHint>
            </div>
            <Badge tone="info">{agencies.length} Active</Badge>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#D9DDE3] bg-[#F0F2F5] text-[9px] font-bold uppercase tracking-wider text-[#7A838E]">
                <tr>
                  <th className="py-2 px-2.5">Authority / IDA</th>
                  <th className="py-2 px-2 text-right">Works</th>
                  <th className="py-2 px-2 text-right">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DDE3] font-mono">
                {agencies.map((a) => (
                  <tr key={a.id} className="hover:bg-[#F0F2F5] transition-colors">
                    <td className="py-2 px-2.5 font-sans">
                      <div className="font-semibold text-[#17202A]">{a.name}</div>
                      <div className="text-[10px] text-[#7A838E]">{a.state}</div>
                    </td>
                    <td className="py-2 px-2 text-right text-[#17202A] tabular-nums font-semibold">
                      {a.works} Active
                    </td>
                    <td className="py-2 px-2 text-right">
                      <Badge tone={riskTone(a.risk)} className="text-[9px] px-1 py-0">
                        {a.risk}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* 5. Institutional SC / ST Statutory Allocation Compliance Monitor */}
      <Card className="space-y-3 p-3.5 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm">SC / ST Allocation Compliance (Statutory Mandates)</CardTitle>
            <CardHint>
              Statutory mandate requires minimum 15.0% allocation for Scheduled Castes (SC) and 7.5% for Scheduled Tribes (ST).
            </CardHint>
          </div>
          <Badge tone="elevated">
            National Earmarking Shortfall: -3.9 pp
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* SC Bar */}
          <div className="rounded border border-[#D9DDE3] bg-[#F0F2F5] p-3 space-y-2">
            <div className="flex justify-between items-baseline text-xs">
              <span className="font-semibold text-[#17202A]">Scheduled Castes (SC) Allocation</span>
              <span className="font-mono font-bold text-amber-600 tabular-nums">
                {scstNational.scActual}% / {scstNational.scMandate}%
              </span>
            </div>
            <div className="h-2 w-full rounded bg-[#D9DDE3] overflow-hidden">
              <div
                className="h-full rounded bg-amber-500 transition-all duration-300"
                style={{ width: `${(scstNational.scActual / scstNational.scMandate) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-[#5B6470]">
              Shortfall of 2.6% nationally. 189 constituencies below statutory compliance threshold.
            </p>
          </div>

          {/* ST Bar */}
          <div className="rounded border border-[#D9DDE3] bg-[#F0F2F5] p-3 space-y-2">
            <div className="flex justify-between items-baseline text-xs">
              <span className="font-semibold text-[#17202A]">Scheduled Tribes (ST) Allocation</span>
              <span className="font-mono font-bold text-amber-600 tabular-nums">
                {scstNational.stActual}% / {scstNational.stMandate}%
              </span>
            </div>
            <div className="h-2 w-full rounded bg-[#D9DDE3] overflow-hidden">
              <div
                className="h-full rounded bg-amber-500 transition-all duration-300"
                style={{ width: `${(scstNational.stActual / scstNational.stMandate) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-[#5B6470]">
              Shortfall of 1.4% nationally. Priority tribal clusters under active review.
            </p>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
