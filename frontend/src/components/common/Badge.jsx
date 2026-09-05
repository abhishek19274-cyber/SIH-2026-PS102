import React from "react";
import { cn } from "../../utils/formatters";

export function Badge({ children, tone = "info", className = "" }) {
  const tones = {
    critical: "bg-red-50 text-red-700 border-red-200",
    elevated: "bg-amber-50 text-amber-800 border-amber-200",
    normal: "bg-emerald-50 text-emerald-700 border-emerald-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    neutral: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
        tones[tone] || tones.info,
        className
      )}
    >
      {children}
    </span>
  );
}
