import React from "react";
import { cn } from "../../utils/formatters";

export function Badge({ children, tone = "info", className = "" }) {
  const tones = {
    critical: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    elevated: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    normal: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    info: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    neutral: "bg-slate-800 text-slate-300 border-slate-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        tones[tone] || tones.info,
        className
      )}
    >
      {children}
    </span>
  );
}
