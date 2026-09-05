import React from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;

  const icons = {
    critical: <XCircle className="h-5 w-5 text-red-600 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
    success: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
    info: <Info className="h-5 w-5 text-blue-600 shrink-0" />,
  };

  const borders = {
    critical: "border-red-200 bg-white text-red-900",
    warning: "border-amber-200 bg-white text-amber-900",
    success: "border-emerald-200 bg-white text-emerald-900",
    info: "border-blue-200 bg-white text-blue-900",
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-slide-up">
      <div
        className={`flex items-center gap-3 rounded border p-3.5 shadow-lg bg-white ${
          borders[toast.type] || borders.info
        }`}
      >
        {icons[toast.type] || icons.info}
        <p className="text-xs font-semibold leading-snug">{toast.message}</p>
      </div>
    </div>
  );
}
