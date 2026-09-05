import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ShieldAlert, BarChart3, Clock, Layers } from "lucide-react";
import { AppShell } from "../components/layout/AppShell";
import { TrendChart } from "../components/charts/TrendCharts";
import { Card, CardTitle, CardHint } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { MetricStrip } from "../components/common/MetricStrip";
import { districts, stateTrend } from "../data/mockData";
import { useApp } from "../context/AppContext";
import { dashboardService } from "../services/dashboardService";

export function StateDashboard() {
  const { alerts, setSelectedAlertId } = useApp();
  const [ministryData, setMinistryData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await dashboardService.getMinistryDashboard();
        if (data && isMounted) {
          setMinistryData(data);
        }
      } catch (err) {
        console.warn("[MPLADS Sentinel] Backend unavailable — using demo fallback.", err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const mpHeatmap = ministryData?.state_risk_heatmap?.find(
    (s) => s.state === "Madhya Pradesh"
  );

  const sortedDistricts = [...districts].sort((a, b) => b.anomalies - a.anomalies);

  // Escalated alerts: those with disposition === 'escalated' OR critical alerts
  const escalatedAlerts = alerts.filter(
    (a) => a.disposition === "escalated" || a.severity === "critical"
  );

  const stateKpis = [
    {
      label: "State Fund Allocation",
      value: "₹320.0 Cr",
      subvalue: mpHeatmap?.project_count
        ? `${mpHeatmap.project_count} Tracked Works across MP`
        : "Across 52 MP Districts",
      tone: "info",
      icon: Layers,
    },
    {
      label: "Average Utilisation",
      value: "54.6%",
      subvalue: "Madhya Pradesh Aggregated",
      tone: "elevated",
      icon: BarChart3,
    },
    {
      label: "Escalated DA Alerts",
      value: escalatedAlerts.length.toString(),
      subvalue: "Requires State Nodal Action",
      tone: "critical",
      icon: ShieldAlert,
    },
    {
      label: "Avg Sanction Turnaround",
      value: "28.5 Days",
      subvalue: "Statutory Ceiling: 45 Days",
      tone: "normal",
      icon: Clock,
    },
  ];

  return (
    <AppShell
      title="State Nodal Authority (SNA) Command · Madhya Pradesh"
      subtitle="Cross-district performance benchmarking, statutory guideline adherence, and escalated alert triage queue"
    >
      {/* State High-Level Unified KPI Strip */}
      <MetricStrip metrics={stateKpis} />

      {/* District Comparison Table */}
      <Card noPadding className="border-[#D9DDE3]">
        <div className="p-4 border-b border-[#D9DDE3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F0F2F5]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 font-semibold">
                BENCHMARK MATRIX
              </span>
              <h2 className="text-sm font-semibold text-[#17202A]">
                Cross-District Performance & Risk Evaluation Matrix (Madhya Pradesh)
              </h2>
            </div>
            <p className="text-xs text-[#5B6470] mt-1">
              Ranked by flagged anomaly density. Evaluates fund absorption, sanction turnaround compliance (45-day ceiling), and SC/ST statutory earmarking.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="info" className="font-mono text-[10px]">
              {districts.length} Demonstration Districts
            </Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="border-b border-[#D9DDE3] bg-[#F0F2F5] text-[10px] font-semibold uppercase tracking-wider text-[#7A838E]">
              <tr>
                <th className="py-2.5 px-3">District Authority</th>
                <th className="py-2.5 px-3 text-center">Fund Utilisation %</th>
                <th className="py-2.5 px-3 text-center">Avg Sanction Days</th>
                <th className="py-2.5 px-3 text-center">Completion Rate</th>
                <th className="py-2.5 px-3 text-center">Flagged Anomalies</th>
                <th className="py-2.5 px-3 text-center">SC / ST Statutory Earmark</th>
                <th className="py-2.5 px-3 text-right">Unspent Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9DDE3]">
              {sortedDistricts.map((d) => (
                <tr
                  key={d.id}
                  className={`hover:bg-[#F0F2F5] transition text-[#17202A] ${
                    d.name === "Bhopal" ? "bg-blue-50/60" : ""
                  }`}
                >
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#17202A]">{d.name}</span>
                      {d.name === "Bhopal" && (
                        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] text-blue-700 border border-blue-200 font-mono font-semibold">
                          Active Focus
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono tabular-nums">
                    <span
                      className={`font-semibold ${
                        d.utilisation >= 60 ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {d.utilisation}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono tabular-nums">
                    <span
                      className={
                        d.sanctionDays > 30 ? "text-red-600 font-semibold" : "text-[#5B6470]"
                      }
                    >
                      {d.sanctionDays} days
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono tabular-nums text-[#5B6470]">
                    {d.completion}%
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <Badge
                      tone={
                        d.anomalies >= 10
                          ? "critical"
                          : d.anomalies >= 6
                          ? "elevated"
                          : "normal"
                      }
                      className="font-mono text-[10px]"
                    >
                      {d.anomalies} Flagged
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-center text-[11px] font-mono">
                    <span className={d.scPct < 15 ? "text-amber-700 font-semibold" : "text-emerald-700"}>
                      SC {d.scPct}%
                    </span>
                    <span className="text-[#D9DDE3] mx-1.5">|</span>
                    <span className={d.stPct < 7.5 ? "text-amber-700 font-semibold" : "text-emerald-700"}>
                      ST {d.stPct}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[#17202A]">
                    ₹{d.unspentCr.toFixed(1)} Cr
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bottom Split: State-Level Trend & Real-Time Escalated Alert Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4">
        {/* State Trend Analysis */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle>State-Level Expenditure & Anomaly Trend (FY 2025)</CardTitle>
            <Badge tone="info" className="font-mono text-[10px]">Monthly MP Aggregates</Badge>
          </div>
          <CardHint>
            Monthly trajectory of fund absorption, physical completion, and automated anomaly detection across Madhya Pradesh.
          </CardHint>
          <TrendChart data={stateTrend} height={250} />
        </Card>

        {/* Real-time Escalated Alert Feed */}
        <Card noPadding className="border-[#D9DDE3] flex flex-col">
          <div className="p-3.5 border-b border-[#D9DDE3] flex items-center justify-between bg-[#F0F2F5]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-red-700 bg-red-100 px-1.5 py-0.5 rounded border border-red-200 font-semibold">
                  ESCALATION FEED
                </span>
                <h3 className="text-sm font-semibold text-[#17202A]">
                  District Authority Escalations
                </h3>
              </div>
              <p className="text-[11px] text-[#5B6470] mt-0.5">
                Alerts requiring State Nodal Authority intervention or statutory audit referral.
              </p>
            </div>
            <Badge tone="critical" className="font-mono text-[10px]">
              {escalatedAlerts.length} PENDING
            </Badge>
          </div>

          <div className="p-3 space-y-2.5 max-h-[300px] overflow-y-auto pr-1 flex-1">
            {escalatedAlerts.map((a) => (
              <div
                key={a.id}
                className="p-3 rounded border border-[#D9DDE3] bg-white hover:border-slate-400 transition space-y-1.5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <Badge tone={a.severity} className="text-[10px]">
                    {a.severity.toUpperCase()} · {a.type}
                  </Badge>
                  <span className="text-[10px] text-[#7A838E] font-mono">
                    {a.disposition === "escalated" ? "Escalated by IDA" : "Critical Flag"}
                  </span>
                </div>
                <div className="text-xs font-semibold text-[#17202A]">
                  {a.title}
                </div>
                <p className="text-[11px] text-[#5B6470] line-clamp-2 leading-relaxed">
                  {a.explanation}
                </p>
                <div className="flex justify-between items-center pt-1 border-t border-[#D9DDE3] text-[11px]">
                  <span className="text-blue-700 font-mono text-[10px] font-semibold">{a.entity}</span>
                  <Link
                    to="/alerts"
                    onClick={() => setSelectedAlertId(a.id)}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold transition"
                  >
                    Investigate Dossier <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
