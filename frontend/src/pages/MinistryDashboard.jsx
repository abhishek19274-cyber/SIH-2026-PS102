import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { AppShell } from "../components/layout/AppShell";
import { IndiaHexHeatmap } from "../components/maps/IndiaHexHeatmap";
import { VelocityChart } from "../components/charts/VelocityChart";
import { TrendChart } from "../components/charts/TrendCharts";
import { Card, CardTitle, CardHint } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { StatMetric } from "../components/common/StatMetric";
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

  const sortedConstituencies = [...constituencies].sort((a, b) => b.risk - a.risk).slice(0, 8);
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
      subtitle="National-level macroeconomic oversight, early anomaly detection, and capital velocity tracking"
      actions={
        <div className="flex items-center gap-2">
          <Badge tone="critical" className="text-xs py-1">
            {kpis?.pending_alerts !== undefined ? `${kpis.pending_alerts} Alerts Active` : "18 National Alerts Pending"}
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
      {/* High-level National KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatMetric
          label="Total Authorized (FY 25-26)"
          value={kpis?.sanctioned_cr ? `₹${Number(kpis.sanctioned_cr).toLocaleString("en-IN")} Cr` : "₹2,715 Cr"}
          subvalue={kpis?.total_projects ? `${kpis.total_projects} Projects Tracked` : "543 Parliamentary Constituencies"}
          trend="+4.2% YoY"
          tone="info"
        />
        <StatMetric
          label="National Fund Utilisation"
          value={kpis?.utilisation_pct !== undefined ? `${kpis.utilisation_pct}%` : "58.4%"}
          subvalue="Target 75% before Q4 close"
          trend={kpis?.utilisation_pct ? `Lagging by ${(75 - kpis.utilisation_pct).toFixed(1)}%` : "Lagging by 16.6%"}
          tone="elevated"
        />
        <StatMetric
          label="High-Risk Constituencies"
          value={kpis?.high_risk_projects !== undefined ? String(kpis.high_risk_projects) : "42"}
          subvalue="Risk Index Score ≥ 70"
          trend="Flagged by Sentinel ML"
          tone="critical"
        />
        <StatMetric
          label="Capital Velocity Index"
          value="67 Days"
          subvalue="Avg CNA-to-Vendor duration"
          trend="Stall risk at SNA"
          tone="neutral"
        />
      </div>

      {/* Screen 1: National Risk Heatmap (Full Width) */}
      <Card className="p-0 overflow-hidden border-slate-800">
        <IndiaHexHeatmap />
      </Card>

      {/* Capital Velocity Tracker & National Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-3">
          <CardTitle
            rightElement={
              <Badge tone="elevated">Predicted Unspent: ₹18.4 Cr</Badge>
            }
          >
            Capital Velocity & Unspent Balances
          </CardTitle>
          <CardHint>
            Visualises fund traversal speed: CNA → SNA → District → Vendor. Amber area predicts accumulation of unspent funds due to administrative dwell.
          </CardHint>
          <VelocityChart data={capitalVelocity} height={230} />
        </Card>

        <Card className="space-y-3">
          <CardTitle
            rightElement={
              <Badge tone="info">FY 2024 - 2025 Multi-quarter</Badge>
            }
          >
            National Performance & Alert Trends
          </CardTitle>
          <CardHint>
            Quarterly trajectory: green (utilisation %), blue (physical completion %), and red dashed (flagged anomaly volume).
          </CardHint>
          <TrendChart data={utilisationTrend} height={230} />
        </Card>
      </div>

      {/* Top Risk Lists: Constituencies, Vendors, Implementing Agencies */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top High-Risk Constituencies */}
        <Card className="space-y-3">
          <CardTitle
            rightElement={
              <span className="text-[11px] text-slate-400">Click to focus</span>
            }
          >
            Highest-Risk Constituencies
          </CardTitle>
          <CardHint>Prioritized by AI multi-factor anomaly index</CardHint>
          <div className="space-y-2 mt-2">
            {sortedConstituencies.map((c) => (
              <div
                key={c.id}
                onClick={() => handleSelectConstituency(c)}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800/80 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/60 cursor-pointer transition"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-200">
                    {c.name}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {c.state} · Util {c.utilisation}%
                  </div>
                </div>
                <Badge tone={riskTone(c.risk)}>
                  Risk {c.risk}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Highest-Risk Vendors */}
        <Card className="space-y-3">
          <CardTitle
            rightElement={
              <Link
                to="/vendors"
                className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
              >
                Graph <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            Highest-Risk Vendors
          </CardTitle>
          <CardHint>Flagged for collusion, overruns, or cartel biddings</CardHint>
          <div className="space-y-2 mt-2">
            {sortedVendors.map((v) => (
              <div
                key={v.id}
                onClick={() => handleInspectVendor(v)}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800/80 bg-slate-900/50 hover:border-sky-500/40 hover:bg-slate-800/60 cursor-pointer transition group"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-200 group-hover:text-sky-300">
                    {v.name}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    ₹{v.contractValueCr} Cr · Overrun {(v.overrunRate * 100).toFixed(0)}%
                  </div>
                </div>
                <Badge tone={riskTone(v.risk)}>
                  Risk {v.risk}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Implementing Agencies */}
        <Card className="space-y-3">
          <CardTitle>Implementing Agencies</CardTitle>
          <CardHint>District & municipal execution authorities</CardHint>
          <div className="space-y-2 mt-2">
            {agencies.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800/80 bg-slate-900/50"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-200">
                    {a.name}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {a.works} Active Works · {a.state}
                  </div>
                </div>
                <Badge tone={riskTone(a.risk)}>
                  Risk {a.risk}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* SC/ST Allocation Monitor */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle>SC / ST Allocation Monitor (National Mandate Compliance)</CardTitle>
            <CardHint>
              Statutory mandate requires minimum 15.0% allocation for Scheduled Castes (SC) and 7.5% for Scheduled Tribes (ST).
            </CardHint>
          </div>
          <Badge tone="elevated">
            National Earmarking Shortfall: -3.9 pp
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* SC Bar */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
            <div className="flex justify-between items-baseline text-sm">
              <span className="font-semibold text-slate-300">Scheduled Castes (SC) Allocation</span>
              <span className="font-mono font-bold text-amber-300">
                {scstNational.scActual}% / {scstNational.scMandate}%
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${(scstNational.scActual / scstNational.scMandate) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Shortfall of 2.6% nationally. 189 constituencies below compliance threshold.
            </p>
          </div>

          {/* ST Bar */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
            <div className="flex justify-between items-baseline text-sm">
              <span className="font-semibold text-slate-300">Scheduled Tribes (ST) Allocation</span>
              <span className="font-mono font-bold text-amber-300">
                {scstNational.stActual}% / {scstNational.stMandate}%
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${(scstNational.stActual / scstNational.stMandate) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Shortfall of 1.4% nationally. Priority tribal clusters under active review.
            </p>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
