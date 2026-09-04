import React from "react";
import { cn } from "../../utils/formatters";

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  onClick,
  ...props
}) {
  const variants = {
    primary: "bg-sky-600 text-white hover:bg-sky-500 border border-sky-400/30 shadow-sm",
    success: "bg-emerald-600/90 text-white hover:bg-emerald-500 border border-emerald-400/30",
    critical: "bg-rose-600/90 text-white hover:bg-rose-500 border border-rose-400/30",
    elevated: "bg-amber-600/90 text-white hover:bg-amber-500 border border-amber-400/30",
    outline: "bg-transparent text-slate-200 border border-slate-700 hover:bg-slate-800/60 hover:text-white",
    ghost: "bg-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-100",
    subtle: "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700/60",
  };

  const sizes = {
    xs: "px-2 py-1 text-xs rounded-md",
    sm: "px-3 py-1.5 text-xs rounded-lg font-medium",
    md: "px-4 py-2 text-sm rounded-lg font-medium",
    lg: "px-5 py-2.5 text-base rounded-xl font-medium",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
