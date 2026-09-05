import React from "react";
import { cn } from "../../utils/formatters";

export function Card({ children, className = "", hover = false, noPadding = false }) {
  return (
    <div
      className={cn(
        "rounded border border-[#D9DDE3] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        noPadding ? "p-0" : "p-4 sm:p-5",
        hover && "transition-colors duration-150 hover:border-slate-400 hover:bg-[#F8FAFC]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "", rightElement = null }) {
  return (
    <div className="flex items-center justify-between gap-2 pb-1">
      <h3 className={cn("text-sm sm:text-base font-semibold tracking-tight text-[#17202A]", className)}>
        {children}
      </h3>
      {rightElement}
    </div>
  );
}

export function CardHint({ children, className = "" }) {
  return (
    <p className={cn("text-xs text-[#5B6470] font-normal leading-relaxed", className)}>
      {children}
    </p>
  );
}
