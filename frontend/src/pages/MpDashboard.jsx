import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { AppShell } from "../components/layout/AppShell";
import { AllocationDonut } from "../components/charts/AllocationDonut";
import { ConstituencyMap } from "../components/maps/ConstituencyMap";
import { Card, CardTitle, CardHint } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
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
        const data = await dashboardService.getMpDashboard();
        if (data && isMounted) {
          setMpData(data);
        }
      } catch (err) {
        console.warn("[MPLADS Sentinel] Backend unavailable.", err);
      }
    }
    fetchMpData();
    return () => {
      isMounted = false;
    };
  }, []);

  const projectsList = mpData?.projects?.length
    ? mpData.projects.map(adaptProject)
    : [];

  const delayedWorks = projectsList.filter((p) => p.delayDays > 0);
  const criticalDelays = projectsList.filter(
    (p) => p.stage === "Recommended" && p.delayDays > 30
  );

  const mpName = mpData?.mp_name || "Hon'ble MP";
  const constituency = mpData?.constituency || "Unknown";

  return (
    <AppShell
      title={`Member of Parliament Interface · ${constituency} Parliamentary Constituency`}
      subtitle={`Transparent portfolio monitoring for ${mpName}: ₹5.00 Cr annual allocation, project pipeline, and XGBoost completion forecasts`}
    >
      {/* Top Split: ₹5 Cr Allocation Donut & Bottleneck Identifier */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut Card */}
        <Card className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 font-semibold">
                  ENTITLEMENT LEDGER
                </span>
                <h3 className="text-sm font-semibold text-[#17202A]">
                  ₹5.00 Crore Annual Parliamentary Allocation
                </h3>
              </div>
              <p className="text-xs text-[#5B6470] mt-1">
                FY 2025-26 statutory entitlement: disbursed funds vs sanctioned commitments vs available unallocated balance.
              </p>
            </div>
            <Badge tone="normal" className="font-mono text-[10px]">FY 2025-26</Badge>
          </div>
          <div className="pt-2">
            <AllocationDonut budget={mpData?.budget} height={230} />
          </div>
        </Card>

        {/* Bottleneck Identifier Card */}
        <Card noPadding className="border-[#D9DDE3] flex flex-col">
          <div className="p-3.5 border-b border-[#D9DDE3] flex items-center justify-between bg-[#F0F2F5]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 font-semibold">
                  ADMIN BOTTLENECKS
                </span>
                <h3 className="text-sm font-semibold text-[#17202A]">
                  Sanction Bottleneck Identifier
                </h3>
              </div>
              <p className="text-[11px] text-[#5B6470] mt-0.5">
                Automated detection of proposals exceeding the 45-day statutory clearance window.
              </p>
            </div>
            <Badge tone={criticalDelays.length > 0 ? "critical" : "normal"} className="font-mono text-[10px]">
              {delayedWorks.length} DELAYED WORKS
            </Badge>
          </div>

          <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
            {criticalDelays.length > 0 && (
              <div className="rounded border border-red-200 bg-red-50 p-2.5 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-red-900">
                    {criticalDelays.length} Work(s) Exceeding 30 Days in Recommended Stage
                  </h4>
                  <p className="text-[11px] text-red-700 mt-0.5 leading-tight">
                    District Authority sanction overdue. Formal MP expedited clarification advised under MPLADS Rule 3.2.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-1.5 max-h-[165px] overflow-y-auto pr-1">
              {delayedWorks.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded border border-[#D9DDE3] bg-[#F0F2F5] text-xs hover:border-slate-400 transition"
                >
                  <div className="space-y-0.5">
                    <div className="font-medium text-[#17202A] text-xs">{p.name}</div>
                    <div className="text-[10px] text-[#5B6470] font-mono">
                      Phase: <span className="text-amber-700 font-semibold">{p.stage}</span> · Target: {p.expectedDate}
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-red-600 text-xs tabular-nums">
                      +{p.delayDays}d overdue
                    </span>
                    <div className="text-[10px] text-[#5B6470] tabular-nums font-semibold">₹{p.amountCr} Cr</div>
                  </div>
                </div>
              ))}
              {delayedWorks.length === 0 && (
                <div className="text-center text-[#7A838E] text-xs py-4">
                  No delayed works identified.
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Project Lifecycle Pipeline (Kanban-Style) */}
      <Card noPadding className="border-[#D9DDE3]">
        <div className="p-4 border-b border-[#D9DDE3] flex items-center justify-between bg-[#F0F2F5]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 font-semibold">
                PORTFOLIO WORKFLOW
              </span>
              <h2 className="text-sm font-semibold text-[#17202A]">
                Project Lifecycle Pipeline ({constituency} Constituency)
              </h2>
            </div>
            <p className="text-xs text-[#5B6470] mt-1">
              End-to-end statutory execution: Recommended → Sanctioned → In Progress → Asset Commissioned.
            </p>
          </div>
          <span className="text-xs text-[#5B6470] font-mono bg-white px-2.5 py-1 rounded border border-[#D9DDE3] font-semibold">
            {projectsList.length} Active Works
          </span>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stages.map((stage) => {
            const worksInStage = projectsList.filter((p) => p.stage === stage);
            const totalStageCr = worksInStage.reduce((acc, p) => acc + p.amountCr, 0);

            return (
              <div
                key={stage}
                className="rounded border border-[#D9DDE3] bg-[#F0F2F5] p-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[#D9DDE3] pb-2 mb-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#17202A] font-mono">
                      {stage}
                    </span>
                    <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#17202A] border border-[#D9DDE3]">
                      {worksInStage.length} · ₹{totalStageCr.toFixed(2)} Cr
                    </span>
                  </div>

                  <div className="space-y-2">
                    {worksInStage.map((p) => (
                      <div
                        key={p.id}
                        className="rounded border border-[#D9DDE3] bg-white p-2.5 text-xs space-y-1.5 hover:border-slate-400 transition shadow-xs"
                      >
                        <div className="font-medium text-[#17202A] leading-snug">
                          {p.name}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#5B6470] font-mono">
                          <span className="text-blue-700 font-semibold tabular-nums">₹{p.amountCr} Cr</span>
                          <Badge tone={riskTone(p.risk)} className="text-[9px] font-mono">
                            Risk {p.risk}/100
                          </Badge>
                        </div>
                        {p.delayDays > 0 && (
                          <div className="text-[10px] font-mono font-semibold text-red-600">
                            Overdue {p.delayDays} days
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* XGBoost AFT Survival Curves & Timeline */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle>Predicted Completion Timelines (XGBoost AFT Engine)</CardTitle>
            <Badge tone="info" className="font-mono text-[10px]">Survival Model</Badge>
          </div>
          <CardHint>
            Accelerated Failure Time (AFT) survival regression estimating delivery probability and completion milestones.
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
                      <span className="font-medium text-[#17202A]">{p.name}</span>
                      <span className="text-[10px] font-mono text-[#7A838E]">
                        Target: {p.expectedDate}
                      </span>
                    </div>

                    <div className="h-1.5 w-full rounded bg-[#E5E7EB] overflow-hidden">
                      <div
                        className={`h-full rounded transition-all duration-700 ${
                          p.risk >= 70 ? "bg-red-600" : "bg-blue-600"
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-[#5B6470] font-mono">
                      <span>Phase: {p.stage} ({progressPct}%)</span>
                      <span className={p.risk >= 70 ? "text-red-600 font-bold" : ""}>
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
          <div className="flex items-center justify-between">
            <CardTitle>Constituency Spatial Distribution ({constituency})</CardTitle>
            <Badge tone="normal" className="font-mono text-[10px]">Geotagged GPS</Badge>
          </div>
          <CardHint>
            Interactive GIS coordinates of sanctioned and ongoing works across {constituency} Parliamentary Constituency.
          </CardHint>
          <ConstituencyMap projects={projectsList} height={280} />
        </Card>
      </div>
    </AppShell>
  );
}
