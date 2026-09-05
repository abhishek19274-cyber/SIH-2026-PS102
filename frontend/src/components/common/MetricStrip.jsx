import React from "react";
import { cn } from "../../utils/formatters";

/**
 * MetricStrip
 * An institutional, high-density metric banner that displays KPIs in a unified
 * single-container strip with subtle vertical dividers instead of separate floating cards.
 *
 * @param {Array<{
 *   label: string,
 *   value: string|number,
 *   subvalue?: string,
 *   trend?: string,
 *   tone?: "critical"|"elevated"|"normal"|"info"|"neutral",
 *   icon?: React.ComponentType
 * }>} items
 * @param {string} [className]
 */
export function MetricStrip({ items = [], className = "" }) {
  const toneText = {
    critical: "text-red-700",
    elevated: "text-amber-700",
    normal: "text-emerald-700",
    info: "text-blue-700",
    neutral: "text-[#17202A]",
  };

  const toneTag = {
    critical: "bg-red-50 text-red-700 border-red-200",
    elevated: "bg-amber-50 text-amber-800 border-amber-200",
    normal: "bg-emerald-50 text-emerald-700 border-emerald-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    neutral: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <div
      className={cn(
        "rounded border border-[#D9DDE3] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#D9DDE3]",
        className
      )}
    >
      {items.map((item, idx) => {
        const Icon = item.icon;
        const tone = item.tone || "neutral";
        return (
          <div
            key={item.label || idx}
            className="p-3.5 sm:p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A838E]">
                {item.label}
              </span>
              {Icon && <Icon className="h-3.5 w-3.5 opacity-60 text-[#7A838E] shrink-0" />}
            </div>

            <div className="mt-1.5 flex items-baseline justify-between gap-2">
              <span
                className={cn(
                  "text-xl sm:text-2xl font-bold font-mono tracking-tight tabular-nums",
                  toneText[tone] || "text-[#17202A]"
                )}
              >
                {item.value}
              </span>
              {item.trend && (
                <span
                  className={cn(
                    "text-[10px] font-semibold px-1.5 py-0.5 rounded-sm border shrink-0",
                    toneTag[tone] || toneTag.neutral
                  )}
                >
                  {item.trend}
                </span>
              )}
            </div>

            {item.subvalue && (
              <p className="mt-1 text-xs text-[#5B6470] font-normal leading-tight truncate">
                {item.subvalue}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
