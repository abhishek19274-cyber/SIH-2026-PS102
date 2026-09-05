import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  GitGraph,
  Map,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { cn } from "../../utils/formatters";

export function Sidebar() {
  const { alerts } = useApp();
  const location = useLocation();

  const pendingAlertsCount = alerts.filter((a) => a.disposition === "pending").length;

  const operationalModules = [
    { to: "/ministry", label: "Command Centre", icon: LayoutDashboard },
    { to: "/vendors", label: "Vendor Network", icon: GitGraph },
    { to: "/spatial", label: "Spatial Verify", icon: Map },
    { to: "/alerts", label: "Alert Inbox", icon: Bell, count: pendingAlertsCount },
  ];

  const intelligenceWorkbenches = [
    { to: "/vendors", label: "Vendor Network Topology", icon: GitGraph },
    { to: "/spatial", label: "Spatial Verification GIS", icon: Map },
    { to: "/alerts", label: "Alert Triage Queue", icon: Bell, count: pendingAlertsCount },
  ];

  return (
    <aside className="w-[240px] shrink-0 border-r border-[#D9DDE3] bg-white hidden md:flex flex-col justify-between h-full overflow-y-auto select-none">
      <div className="p-3.5 space-y-4">
        {/* Section 1: Operational Modules */}
        <div className="space-y-0.5">
          <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-[#7A838E] mb-1.5">
            Operational Modules
          </p>
          {operationalModules.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to + item.label}
                to={item.to}
                className={cn(
                  "flex items-center justify-between rounded px-2.5 py-2 text-xs transition-colors",
                  active
                    ? "bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600"
                    : "text-[#5B6470] font-medium hover:bg-[#F0F2F5] hover:text-[#17202A]"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn("h-4 w-4", active ? "text-blue-600" : "text-[#7A838E]")} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className="flex h-4 min-w-[18px] items-center justify-center rounded bg-red-50 px-1 text-[9px] font-mono font-bold text-red-700 border border-red-200">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Section 2: Intelligence Workbenches */}
        <div className="pt-3 border-t border-[#D9DDE3] space-y-0.5">
          <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-[#7A838E] mb-1.5">
            Intelligence Workbenches
          </p>
          {intelligenceWorkbenches.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to + item.label + "-wb"}
                to={item.to}
                className={cn(
                  "flex items-center justify-between rounded px-2.5 py-2 text-xs transition-colors",
                  active
                    ? "bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600"
                    : "text-[#5B6470] font-medium hover:bg-[#F0F2F5] hover:text-[#17202A]"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn("h-4 w-4", active ? "text-blue-600" : "text-[#7A838E]")} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className="flex h-4 min-w-[18px] items-center justify-center rounded bg-red-50 px-1 text-[9px] font-mono font-bold text-red-700 border border-red-200">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Institutional System Status Footer */}
      <div className="p-3 border-t border-[#D9DDE3] bg-[#F0F2F5] text-[10px] text-[#7A838E] space-y-1 shrink-0">
        <div className="flex items-center justify-between font-mono">
          <span className="font-semibold text-[#17202A]">CNA ENGINE</span>
          <span className="flex items-center gap-1 text-emerald-700 font-bold">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> ONLINE
          </span>
        </div>
        <div className="flex items-center justify-between text-[#5B6470] font-mono text-[9px]">
          <span>MoSPI MPLADS-v1.0</span>
          <span>543 PCs SYNCED</span>
        </div>
      </div>
    </aside>
  );
}
