import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  GitGraph,
  Map,
  Bell,
  Wallet,
  ShieldAlert,
  FileCheck,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { cn } from "../../utils/formatters";

export function Sidebar() {
  const { role, alerts } = useApp();
  const location = useLocation();

  const pendingAlertsCount = alerts.filter((a) => a.disposition === "pending").length;

  const roleNavItems = {
    ministry: [
      { to: "/ministry", label: "Command Centre", icon: LayoutDashboard, badge: "Macro" },
      { to: "/vendors", label: "Vendor Network", icon: GitGraph, badge: "D3 Force" },
      { to: "/spatial", label: "Spatial Verify", icon: Map, badge: "H3 Grid" },
      { to: "/alerts", label: "Alert Inbox", icon: Bell, count: pendingAlertsCount },
    ],
    ida: [
      { to: "/ida", label: "Sanctions Queue", icon: FileCheck, badge: "45d Clock" },
      { to: "/spatial", label: "Spatial Verify", icon: Map, badge: "Live Pin" },
      { to: "/alerts", label: "Alert Triage", icon: Bell, count: pendingAlertsCount },
      { to: "/vendors", label: "Vendor Risk", icon: GitGraph },
    ],
    mp: [
      { to: "/mp", label: "Portfolio Overview", icon: Wallet, badge: "₹5 Cr" },
      { to: "/spatial", label: "Field Verification", icon: Map },
      { to: "/vendors", label: "Registered Vendors", icon: GitGraph },
    ],
    sna: [
      { to: "/state", label: "State Overview", icon: ShieldAlert, badge: "MP State" },
      { to: "/alerts", label: "Escalated Feed", icon: Bell, count: pendingAlertsCount },
      { to: "/vendors", label: "State Cartel Graph", icon: GitGraph },
    ],
  };

  const navItems = roleNavItems[role] || roleNavItems.ministry;

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800/80 bg-[#090d18] flex-col justify-between hidden md:flex min-h-[calc(100vh-57px)]">
      <div className="p-4 space-y-6">
        {/* Active Role Card Badge */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Current Surface
          </p>
          <div className="mt-1 flex items-center justify-between">
            <span className="font-semibold text-sm text-sky-400 capitalize">
              {role === "ministry"
                ? "Ministry / MoSPI"
                : role === "ida"
                ? "IDA Bhopal Portal"
                : role === "mp"
                ? "MP Portfolio (Bhopal)"
                : "State Nodal Authority"}
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {role === "ministry"
              ? "National Macroeconomic Oversight"
              : role === "ida"
              ? "Tactical Statutory Sanctions & Triage"
              : role === "mp"
              ? "Transparent Local Work Delivery"
              : "Cross-District State Compliance"}
          </p>
        </div>

        {/* Primary Navigation */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Navigation Menu
          </p>
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to + item.label}
                to={item.to}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sky-500/15 text-sky-300 font-semibold border border-sky-500/30"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn("h-4 w-4", active ? "text-sky-400" : "text-slate-400")} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 font-mono">
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && item.count > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500/20 px-1.5 text-[10px] font-bold text-rose-300 border border-rose-500/30">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Quick Screen Jumpers */}
        <div className="pt-2 border-t border-slate-800/60">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            All Dedicated Views
          </p>
          <div className="space-y-1 text-xs">
            <Link
              to="/vendors"
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition",
                location.pathname === "/vendors" && "text-sky-400 font-medium"
              )}
            >
              <GitGraph className="h-3.5 w-3.5" />
              <span>Vendor Network Graph</span>
            </Link>
            <Link
              to="/spatial"
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition",
                location.pathname === "/spatial" && "text-sky-400 font-medium"
              )}
            >
              <Map className="h-3.5 w-3.5" />
              <span>Spatial Verification H3</span>
            </Link>
            <Link
              to="/alerts"
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition",
                location.pathname === "/alerts" && "text-sky-400 font-medium"
              )}
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Alert Triage Inbox</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-500">
        <div className="flex items-center justify-between">
          <span>AI Engines</span>
          <span className="text-emerald-400 font-medium">Ready (Mocked)</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span>H3 Grid / SHAP</span>
          <span className="text-slate-400">Res-9 · Active</span>
        </div>
      </div>
    </aside>
  );
}
