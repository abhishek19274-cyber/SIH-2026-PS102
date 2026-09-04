import React from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronRight, Sparkles, X } from "lucide-react";
import { useApp } from "../../context/AppContext";

export const DEMO_STEPS = [
  {
    step: 1,
    title: "1. MoSPI Command Centre",
    desc: "Inspect National Risk Map & Click 'Bhopal' (Risk: 82)",
    path: "/ministry",
    role: "ministry",
  },
  {
    step: 2,
    title: "2. Vendor Network Graph",
    desc: "Expose Aarav Infra collusion ring & SHAP waterfall",
    path: "/vendors",
    role: "ministry",
  },
  {
    step: 3,
    title: "3. Spatial Verification",
    desc: "Drop proposed work pin at Berasia [3,2] to trigger duplicate conflict",
    path: "/spatial",
    role: "ida",
  },
  {
    step: 4,
    title: "4. IDA Alert Inbox",
    desc: "Triage generated alert: review SHAP factors & click 'Escalate'",
    path: "/alerts",
    role: "ida",
  },
  {
    step: 5,
    title: "5. State Nodal (SNA)",
    desc: "Observe real-time escalated alert arrival & district risk ranking",
    path: "/state",
    role: "sna",
  },
  {
    step: 6,
    title: "6. MP Portfolio (Bhopal)",
    desc: "Review ₹5 Cr allocation donut, Kanban pipeline & Leaflet map pins",
    path: "/mp",
    role: "mp",
  },
];

export function DemoTourBar() {
  const { demoTourActive, setDemoTourActive, demoStep, setDemoStep, setRole } = useApp();
  const navigate = useNavigate();

  if (!demoTourActive) return null;

  const current = DEMO_STEPS.find((s) => s.step === demoStep) || DEMO_STEPS[0];

  const handleGoToStep = (targetStep) => {
    setDemoStep(targetStep.step);
    setRole(targetStep.role);
    navigate(targetStep.path);
  };

  const handleNext = () => {
    const nextIndex = (demoStep % DEMO_STEPS.length) + 1;
    const target = DEMO_STEPS.find((s) => s.step === nextIndex);
    if (target) handleGoToStep(target);
  };

  return (
    <div className="border-b border-sky-500/20 bg-gradient-to-r from-sky-950/40 via-slate-900/90 to-slate-950/90 px-4 py-2.5 text-xs">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/20 text-sky-400">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold uppercase tracking-wider text-sky-400">
              Demo Walkthrough:
            </span>
            <span className="font-medium text-slate-200">{current.title}</span>
            <span className="hidden text-slate-400 sm:inline">— {current.desc}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick step bubbles */}
          <div className="hidden items-center gap-1 md:flex">
            {DEMO_STEPS.map((s) => (
              <button
                key={s.step}
                onClick={() => handleGoToStep(s)}
                title={`${s.title}: ${s.desc}`}
                className={`flex h-6 items-center rounded px-2 text-[11px] font-medium transition ${
                  demoStep === s.step
                    ? "bg-sky-500 text-slate-950 font-bold shadow-sm"
                    : s.step < demoStep
                    ? "bg-slate-800 text-emerald-400 hover:bg-slate-700"
                    : "bg-slate-800/60 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {s.step < demoStep && <CheckCircle2 className="mr-1 h-3 w-3" />}
                Step {s.step}
              </button>
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 rounded-md bg-sky-500/20 px-2.5 py-1 text-sky-300 font-semibold hover:bg-sky-500/30 transition border border-sky-500/30"
          >
            Next Step <ChevronRight className="h-3 w-3" />
          </button>

          <button
            onClick={() => setDemoTourActive(false)}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            title="Dismiss guide"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
