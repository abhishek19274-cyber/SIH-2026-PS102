import React from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronRight, X } from "lucide-react";
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
    <div className="border-b border-[#D9DDE3] bg-[#F0F2F5] px-4 sm:px-6 py-1.5 text-xs text-[#17202A] shrink-0">
      <div className="w-full flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-white border border-[#D9DDE3] px-1.5 py-0.2 rounded-sm shadow-sm">
            EVALUATION RUNWAY
          </span>
          <span className="font-semibold text-[#17202A]">{current.title}</span>
          <span className="hidden text-[#5B6470] sm:inline">— {current.desc}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick step indicators */}
          <div className="hidden items-center gap-1 md:flex">
            {DEMO_STEPS.map((s) => (
              <button
                key={s.step}
                onClick={() => handleGoToStep(s)}
                title={`${s.title}: ${s.desc}`}
                className={`flex h-5 items-center rounded-sm px-2 text-[10px] font-mono transition-colors ${
                  demoStep === s.step
                    ? "bg-blue-600 text-white font-bold shadow-sm"
                    : s.step < demoStep
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold"
                    : "bg-white text-[#5B6470] border border-[#D9DDE3] hover:bg-gray-100 hover:text-[#17202A]"
                }`}
              >
                {s.step < demoStep && <CheckCircle2 className="mr-1 h-2.5 w-2.5 text-emerald-600" />}
                {s.step}
              </button>
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 rounded-sm bg-white px-2 py-0.5 text-blue-700 font-semibold text-[11px] hover:bg-gray-50 transition-colors border border-[#D9DDE3] shadow-sm"
          >
            Advance <ChevronRight className="h-3 w-3" />
          </button>

          <button
            onClick={() => setDemoTourActive(false)}
            className="rounded-sm p-0.5 text-[#7A838E] hover:bg-[#D9DDE3] hover:text-[#17202A]"
            title="Dismiss guide"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
