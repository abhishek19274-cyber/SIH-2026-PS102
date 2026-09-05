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
    critical: "border-red-200 bg-red-50/50",
    elevated: "border-amber-200 bg-amber-50/50",
    normal: "border-emerald-200 bg-emerald-50/50",
    info: "border-blue-200 bg-blue-50/50",
    neutral: "border-[#D9DDE3] bg-white",
  };

  const valTones = {
    critical: "text-red-700",
    elevated: "text-amber-700",
    normal: "text-emerald-700",
    info: "text-blue-700",
    neutral: "text-[#17202A]",
  };

  return (
    <div className={cn("rounded border p-3 sm:p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors", tones[tone], className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A838E]">
          {label}
        </span>
        {Icon && <Icon className="h-3.5 w-3.5 opacity-60 text-[#7A838E]" />}
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className={cn("text-xl sm:text-2xl font-bold font-mono tracking-tight tabular-nums", valTones[tone] || "text-[#17202A]")}>
          {value}
        </span>
        {trend && (
          <span className="text-xs font-semibold tracking-tight text-[#5B6470]">
            {trend}
          </span>
        )}
      </div>
      {subvalue && (
        <p className="mt-1 text-xs text-[#5B6470] font-normal leading-tight">{subvalue}</p>
      )}
    </div>
  );
}
