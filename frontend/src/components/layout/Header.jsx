import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  Bell,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../common/Badge";

export function Header() {
  const { role, setRole, alerts, selectedConstituency } = useApp();
  const navigate = useNavigate();

  const criticalAlertsCount = alerts.filter(
    (a) => a.severity === "critical" && a.disposition === "pending"
  ).length;

  const roles = [
    { id: "ministry", label: "1. Ministry (MoSPI)", path: "/ministry", desc: "Macro National Command" },
    { id: "ida", label: "2. IDA Portal (Bhopal)", path: "/ida", desc: "Tactical District Triage" },
    { id: "mp", label: "3. MP Portfolio", path: "/mp", desc: "Constituency Management" },
    { id: "sna", label: "4. State Nodal (MP)", path: "/state", desc: "Cross-District Compliance" },
  ];

  const handleRoleChange = (newRole, path) => {
    setRole(newRole);
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#090d18]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/25 to-blue-600/30 border border-sky-400/40 text-sky-400 shadow-sm transition group-hover:scale-105">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white group-hover:text-sky-300 transition">
                  MPLADS <span className="text-sky-400 font-extrabold">SENTINEL</span>
                </span>
                <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-sky-400 border border-sky-500/20">
                  PROTOTYPE
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">
                MoSPI · Central Nodal Command
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Interactive Role Switcher */}
        <div className="hidden lg:flex items-center rounded-xl border border-slate-800 bg-slate-950/80 p-1">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => handleRoleChange(r.id, r.path)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                role === r.id
                  ? "bg-sky-600 text-white shadow-md shadow-sky-950"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Right: Context badges & Navigation shortcuts */}
        <div className="flex items-center gap-3">
          {/* Active Constituency Focus Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-xs">
            <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-400">Focus:</span>
            <span className="font-semibold text-slate-200">{selectedConstituency.name}</span>
            <Badge tone="critical" className="text-[10px] px-1.5 py-0">
              Risk {selectedConstituency.risk}
            </Badge>
          </div>

          {/* Quick Alert Bell button */}
          <Link
            to="/alerts"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white transition"
            title="View Alert Triage Inbox"
          >
            <Bell className="h-4 w-4" />
            {criticalAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-[#090d18] animate-pulse">
                {criticalAlertsCount}
              </span>
            )}
          </Link>

          {/* Official eSAKSHI Reference Link */}
          <a
            href="https://mplads.mospi.gov.in/digigov/dashboard.html"
            target="_blank"
            rel="noreferrer"
            className="hidden xl:flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-sky-400 transition"
            title="Official MoSPI eSAKSHI Portal"
          >
            <span>eSAKSHI</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Mobile/Tablet Role Switcher Row */}
      <div className="flex lg:hidden overflow-x-auto border-t border-slate-800/80 px-4 py-2 gap-1 scrollbar-none bg-slate-950/60">
        {roles.map((r) => (
          <button
            key={r.id}
            onClick={() => handleRoleChange(r.id, r.path)}
            className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition ${
              role === r.id
                ? "bg-sky-600 text-white"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </header>
  );
}
