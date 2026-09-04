import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { AppShell } from "../components/layout/AppShell";
import { AllocationDonut } from "../components/charts/AllocationDonut";
import { ConstituencyMap } from "../components/maps/ConstituencyMap";
import { Card, CardTitle, CardHint } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { mpProjects } from "../data/mockData";
import { riskTone } from "../utils/formatters";
import { dashboardService } from "../services/dashboardService";
import { adaptProject } from "../services/adapters";

const stages = ["Recommended", "Sanctioned", "In Progress", "Completed"];

export function MpDashboard() {
  const [mpData, setMpData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchMpData() {
      try {
        const data = await dashboardService.getMpDashboard({ mp_name: "Nandini Murthy" });
        if (data && isMounted) {
          setMpData(data);
        }
      } catch (err) {
        console.warn("[MPLADS Sentinel] Backend unavailable — using demo fallback.", err);
      }
    }
    fetchMpData();
    return () => {
      isMounted = false;
    };
  }, []);

  const projectsList = mpData?.projects?.length
    ? mpData.projects.map(adaptProject)
    : mpProjects;

  const delayedWorks = projectsList.filter((p) => p.delayDays > 0);
  const criticalDelays = projectsList.filter(
    (p) => p.stage === "Recommended" && p.delayDays > 30
  );

  return (
    <AppShell
      title="Member of Parliament Interface · Bhopal Parliamentary Constituency"
      subtitle="Transparent portfolio monitoring: ₹5.00 Cr annual allocation, project pipeline, and XGBoost completion forecasts"
    >
      {/* Top Split: ₹5 Cr Allocation Donut & Bottleneck Identifier */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Card */}
        <Card className="space-y-2">
          <CardTitle rightElement={<Badge tone="normal">FY 2025-26 Budget</Badge>}>
            ₹5 Crore Budget Allocation
          </CardTitle>
          <CardHint>
            Breakdown of ₹5.00 Cr parliamentary entitlement: disbursed vs committed vs uncommitted balance.
          </CardHint>
          <div className="pt-2">
            <AllocationDonut budget={mpData?.budget} height={230} />
          </div>
        </Card>

        {/* Bottleneck Identifier Card */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle>Sanction Bottleneck Identifier</CardTitle>
            <Badge tone={criticalDelays.length > 0 ? "critical" : "normal"}>
              {delayedWorks.length} Total Delays
            </Badge>
          </div>
          <CardHint>
            Automated alerts highlighting administrative bottlenecks exceeding the 45-day statutory sanction window.
          </CardHint>

          {criticalDelays.length > 0 && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-rose-200">
                  {criticalDelays.length} Work(s) Waiting for DA Sanction &gt; 30 Days
                </h4>
                <p className="text-xs text-rose-300/80 mt-0.5">
                  District Authority clearance lagging statutory guidelines. Immediate escalation recommended.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
            {delayedWorks.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-200">{p.name}</div>
                  <div className="text-[11px] text-slate-400">
                    Stage: <span className="text-amber-300 font-medium">{p.stage}</span> · Target {p.expectedDate}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-rose-400">
                    +{p.delayDays}d overdue
                  </span>
                  <div className="text-[10px] text-slate-500 font-mono">₹{p.amountCr} Cr</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Project Lifecycle Pipeline (Kanban-Style) */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle>Project Lifecycle Pipeline (Bhopal Constituency)</CardTitle>
          <span className="text-xs text-slate-400 font-mono">
            {projectsList.length} Active Works in Constituency
          </span>
        </div>
        <CardHint>
          Visual workflow tracking: Recommended → Sanctioned → In Progress → Completed.
        </CardHint>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {stages.map((stage) => {
            const worksInStage = projectsList.filter((p) => p.stage === stage);
            const totalStageCr = worksInStage.reduce((acc, p) => acc + p.amountCr, 0);

            const stageBorder =
              stage === "Completed"
                ? "border-emerald-500/30"
                : stage === "In Progress"
                ? "border-sky-500/30"
                : stage === "Sanctioned"
                ? "border-indigo-500/30"
                : "border-amber-500/30";

            return (
              <div
                key={stage}
                className={`rounded-xl border ${stageBorder} bg-slate-900/40 p-3 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {stage}
                    </span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-300">
                      {worksInStage.length} (₹{totalStageCr.toFixed(2)} Cr)
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {worksInStage.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-lg border border-slate-800/80 bg-slate-950/70 p-2.5 text-xs space-y-1.5 hover:border-slate-700 transition"
                      >
                        <div className="font-semibold text-slate-200 leading-snug">
                          {p.name}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-mono text-sky-400">₹{p.amountCr} Cr</span>
                          <Badge tone={riskTone(p.risk)} className="text-[10px]">
                            Risk {p.risk}
                          </Badge>
                        </div>
                        {p.delayDays > 0 && (
                          <div className="text-[10px] font-bold text-rose-400">
                            Delayed {p.delayDays} days
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Bottom Split: Predicted Completion Timelines & Leaflet Constituency Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* XGBoost AFT Survival Curves & Timeline */}
        <Card className="space-y-3">
          <CardTitle rightElement={<Badge tone="info">XGBoost AFT Engine</Badge>}>
            Predicted Completion Timelines
          </CardTitle>
          <CardHint>
            Machine learning survival curves estimating project completion probability and delivery risk.
          </CardHint>

          <div className="space-y-3 mt-3 max-h-[300px] overflow-y-auto pr-1">
            {projectsList
              .filter((p) => p.stage !== "Completed")
              .map((p) => {
                const progressPct =
                  p.stage === "Recommended"
                    ? 18
                    : p.stage === "Sanctioned"
                    ? 45
                    : 74;

                return (
                  <div key={p.id} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-200">{p.name}</span>
                      <span className="text-[11px] font-mono text-slate-400">
                        Target: {p.expectedDate}
                      </span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          p.risk >= 70 ? "bg-rose-500" : "bg-sky-500"
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Phase: {p.stage} ({progressPct}%)</span>
                      <span className={p.risk >= 70 ? "text-rose-400 font-bold" : ""}>
                        Risk {p.risk}/100
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>

        {/* Leaflet Constituency Map */}
        <Card className="space-y-2 p-4">
          <CardTitle rightElement={<Badge tone="normal">Leaflet Geotagged</Badge>}>
            Constituency Geographic Map (Bhopal)
          </CardTitle>
          <CardHint>
            Pin-pointed interactive GPS locations of works across Bhopal, color-coded by lifecycle stage.
          </CardHint>
          <ConstituencyMap projects={projectsList} height={280} />
        </Card>
      </div>
    </AppShell>
  );
}
