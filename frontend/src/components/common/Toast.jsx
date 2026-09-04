import React from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;

  const icons = {
    critical: <XCircle className="h-5 w-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />,
    success: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
    info: <Info className="h-5 w-5 text-sky-400 shrink-0" />,
  };

  const borders = {
    critical: "border-rose-500/50 bg-rose-950/90 text-rose-100",
    warning: "border-amber-500/50 bg-amber-950/90 text-amber-100",
    success: "border-emerald-500/50 bg-emerald-950/90 text-emerald-100",
    info: "border-sky-500/50 bg-sky-950/90 text-sky-100",
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-slide-up">
      <div
        className={`flex items-center gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-xl ${
          borders[toast.type] || borders.info
        }`}
      >
        {icons[toast.type] || icons.info}
        <p className="text-sm font-medium leading-snug">{toast.message}</p>
      </div>
    </div>
  );
}
