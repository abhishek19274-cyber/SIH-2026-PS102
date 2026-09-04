import React from "react";
import { cn } from "../../utils/formatters";

export function StatMetric({
  label,
  value,
  subvalue,
  icon: Icon,
  trend,
  tone = "neutral",
  className = "",
}) {
  const tones = {
    critical: "text-rose-400 border-rose-500/20 bg-rose-500/5",
    elevated: "text-amber-400 border-amber-500/20 bg-amber-500/5",
    normal: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    info: "text-sky-400 border-sky-500/20 bg-sky-500/5",
    neutral: "text-slate-100 border-slate-800 bg-slate-900/40",
  };

  return (
    <div className={cn("rounded-xl border p-3 sm:p-4 transition", tones[tone], className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {label}
        </span>
        {Icon && <Icon className="h-4 w-4 opacity-70" />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight">{value}</span>
        {trend && (
          <span className="text-xs font-semibold">
            {trend}
          </span>
        )}
      </div>
      {subvalue && (
        <p className="mt-1 text-xs text-slate-400">{subvalue}</p>
      )}
    </div>
  );
}
