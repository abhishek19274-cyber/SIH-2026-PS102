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
    primary: "bg-blue-600 text-white hover:bg-blue-700 border border-blue-700 shadow-sm",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-700 shadow-sm",
    critical: "bg-red-600 text-white hover:bg-red-700 border border-red-700 shadow-sm",
    elevated: "bg-amber-600 text-white hover:bg-amber-700 border border-amber-700 shadow-sm",
    outline: "bg-white text-[#17202A] border border-[#D9DDE3] hover:bg-[#F0F2F5] hover:border-slate-400 shadow-sm",
    ghost: "bg-transparent text-[#5B6470] hover:bg-[#F0F2F5] hover:text-[#17202A]",
    subtle: "bg-[#F0F2F5] text-[#17202A] hover:bg-[#E5E7EB] border border-[#D9DDE3]",
  };

  const sizes = {
    xs: "px-2 py-0.5 text-xs rounded-sm font-medium",
    sm: "px-2.5 py-1 text-xs rounded font-medium",
    md: "px-3.5 py-1.5 text-xs font-semibold rounded",
    lg: "px-4 py-2 text-sm font-semibold rounded",
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
