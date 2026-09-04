import React from "react";
import { cn } from "../../utils/formatters";

export function Card({ children, className = "", hover = false }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-800/80 bg-[#0e1524]/90 p-4 sm:p-5 backdrop-blur-sm",
        hover && "transition-all duration-200 hover:border-slate-700 hover:bg-[#121b2f]",
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
      <h3 className={cn("text-base font-semibold tracking-tight text-slate-100", className)}>
        {children}
      </h3>
      {rightElement}
    </div>
  );
}

export function CardHint({ children, className = "" }) {
  return (
    <p className={cn("text-xs text-slate-400 font-normal leading-relaxed", className)}>
      {children}
    </p>
  );
}
