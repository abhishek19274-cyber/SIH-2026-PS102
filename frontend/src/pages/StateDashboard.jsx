import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "../components/layout/AppShell";
import { TrendChart } from "../components/charts/TrendCharts";
import { Card, CardTitle, CardHint } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { StatMetric } from "../components/common/StatMetric";
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

  return (
    <AppShell
      title="State Nodal Authority (SNA) Command · Madhya Pradesh"
      subtitle="Statewide cross-district benchmarking, compliance oversight, and escalated alert triage feed"
    >
      {/* State High-Level Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatMetric
          label="State Fund Allocation"
          value="₹320 Cr"
          subvalue={mpHeatmap?.project_count ? `${mpHeatmap.project_count} Tracked Works across MP` : "Across 52 MP Districts"}
          tone="info"
        />
        <StatMetric
          label="Average Utilisation"
          value="54.6%"
          subvalue="Madhya Pradesh Aggregated"
          tone="elevated"
        />
        <StatMetric
          label="Escalated DA Alerts"
          value={escalatedAlerts.length.toString()}
          subvalue="Requires State Intervention"
          tone="critical"
        />
        <StatMetric
          label="Avg Sanction Turnaround"
          value="28.5 Days"
          subvalue="Statutory Limit: 45 Days"
          tone="normal"
        />
      </div>

      {/* District Comparison Table */}
      <Card className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle>Cross-District Benchmarking Matrix (Madhya Pradesh)</CardTitle>
            <CardHint>
              Ranked by total flagged anomalies. Compare utilisation rate, sanction turnaround, completion percentage, and SC/ST allocation.
            </CardHint>
          </div>
          <Badge tone="info">{districts.length} Demonstration Districts</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-2.5 px-3">District</th>
                <th className="py-2.5 px-3 text-center">Fund Utilisation %</th>
                <th className="py-2.5 px-3 text-center">Avg Sanction Days</th>
                <th className="py-2.5 px-3 text-center">Completion Rate %</th>
                <th className="py-2.5 px-3 text-center">Flagged Anomalies</th>
                <th className="py-2.5 px-3 text-center">SC / ST Earmarking</th>
                <th className="py-2.5 px-3 text-right">Unspent Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedDistricts.map((d) => (
                <tr
                  key={d.id}
                  className={`hover:bg-slate-800/30 transition text-slate-200 ${
                    d.name === "Bhopal" ? "bg-sky-500/5 font-semibold" : ""
                  }`}
                >
                  <td className="py-3 px-3 flex items-center gap-2">
                    <span className="font-bold text-white">{d.name}</span>
                    {d.name === "Bhopal" && (
                      <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] text-sky-400 border border-sky-500/30 font-mono">
                        Active Focus
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center font-mono">
                    <span
                      className={`font-semibold ${
                        d.utilisation >= 60 ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {d.utilisation}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono">
                    <span
                      className={
                        d.sanctionDays > 30 ? "text-rose-400 font-bold" : "text-slate-300"
                      }
                    >
                      {d.sanctionDays} days
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono">
                    {d.completion}%
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Badge
                      tone={
                        d.anomalies >= 10
                          ? "critical"
                          : d.anomalies >= 6
                          ? "elevated"
                          : "normal"
                      }
                    >
                      {d.anomalies} Flagged
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-center text-xs font-mono text-slate-400">
                    <span className={d.scPct < 15 ? "text-amber-400" : "text-emerald-400"}>
                      SC {d.scPct}%
                    </span>{" "}
                    /{" "}
                    <span className={d.stPct < 7.5 ? "text-amber-400" : "text-emerald-400"}>
                      ST {d.stPct}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-slate-300">
                    ₹{d.unspentCr.toFixed(1)} Cr
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bottom Split: State-Level Trend & Real-Time Escalated Alert Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        {/* State Trend Analysis */}
        <Card className="space-y-3">
          <CardTitle rightElement={<Badge tone="info">Monthly MP Aggregates</Badge>}>
            State-Level Trend Analysis (FY 2025)
          </CardTitle>
          <CardHint>
            Monthly progression of fund release, physical asset completion, and alert volume across MP.
          </CardHint>
          <TrendChart data={stateTrend} height={250} />
        </Card>

        {/* Real-time Escalated Alert Feed */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle>Escalated Alert Feed (From IDAs)</CardTitle>
            <Badge tone="critical" className="animate-pulse">
              LIVE ESCALATIONS
            </Badge>
          </div>
          <CardHint>
            Alerts escalated up from District Authority review requiring State Nodal intervention.
          </CardHint>

          <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
            {escalatedAlerts.map((a) => (
              <div
                key={a.id}
                className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <Badge tone={a.severity}>
                    {a.severity.toUpperCase()} · {a.type}
                  </Badge>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {a.disposition === "escalated" ? "Escalated by IDA" : "Critical Flag"}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-100">
                  {a.title}
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {a.explanation}
                </p>
                <div className="flex justify-between items-center pt-1 text-[11px]">
                  <span className="text-sky-400 font-medium">{a.entity}</span>
                  <Link
                    to="/alerts"
                    onClick={() => setSelectedAlertId(a.id)}
                    className="text-sky-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Investigate <ArrowUpRight className="h-3 w-3" />
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
