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
    <header className="sticky top-0 z-30 border-b border-[#D9DDE3] bg-white min-h-[78px] lg:h-[84px] shrink-0 flex flex-col justify-center">
      <div className="w-full flex items-center justify-between px-4 sm:px-6 gap-4">
        {/* Left: Government of India / MoSPI Institutional Identity + Main Navigation */}
        <div className="flex items-center gap-5 xl:gap-8 min-w-0">
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-50 border border-blue-200 text-blue-700 shadow-xs shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#17202A] group-hover:text-blue-700 transition-colors leading-none">
                  MPLADS <span className="text-blue-700">SENTINEL</span>
                </span>
                <span className="rounded bg-[#F0F2F5] px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#5B6470] border border-[#D9DDE3]">
                  CNA v1.0
                </span>
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#5B6470] mt-1 leading-tight">
                Ministry of Statistics & Programme Implementation
              </div>
              <div className="text-[9px] font-medium uppercase tracking-widest text-[#7A838E] leading-tight">
                Central Nodal Command
              </div>
            </div>
          </Link>

          {/* Main Application Navigation — Left-aligned immediately following branding */}
          <nav
            className="hidden lg:flex items-center rounded border border-[#D9DDE3] bg-[#F0F2F5] p-1 shadow-xs shrink-0"
            aria-label="Administrative Surfaces"
          >
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => handleRoleChange(r.id, r.path)}
                className={`flex items-center gap-1.5 rounded px-2.5 xl:px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  role === r.id
                    ? "bg-white text-blue-700 shadow-xs border border-[#D9DDE3]"
                    : "text-[#5B6470] hover:bg-white/60 hover:text-[#17202A]"
                }`}
              >
                {r.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right: Jurisdiction, Risk Indicator, Alerts, eSAKSHI */}
        <div className="flex items-center gap-2.5 shrink-0 ml-auto">
          {/* Active Jurisdiction Focus Indicator */}
          <div className="hidden sm:flex items-center gap-2 rounded border border-[#D9DDE3] bg-[#F0F2F5] px-3 py-1.5 text-xs text-[#17202A]">
            <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span className="text-[#5B6470] font-medium">Jurisdiction:</span>
            <span className="font-bold text-[#17202A] font-mono">{selectedConstituency.name}</span>
            <Badge tone="critical" className="text-[9px] px-1.5 py-0 font-mono">
              Risk {selectedConstituency.risk}
            </Badge>
          </div>

          {/* Quick Alert Bell button */}
          <Link
            to="/alerts"
            className="relative flex h-9 w-9 items-center justify-center rounded border border-[#D9DDE3] bg-white text-[#5B6470] hover:bg-[#F0F2F5] hover:text-[#17202A] transition-colors shadow-xs"
            title="View Alert Triage Inbox"
          >
            <Bell className="h-4 w-4" />
            {criticalAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-mono font-bold text-white shadow-xs">
                {criticalAlertsCount}
              </span>
            )}
          </Link>

          {/* Official eSAKSHI Reference Link */}
          <a
            href="https://mplads.mospi.gov.in/digigov/dashboard.html"
            target="_blank"
            rel="noreferrer"
            className="hidden xl:flex items-center gap-1.5 text-xs font-semibold text-[#5B6470] hover:text-blue-700 transition-colors border border-[#D9DDE3] bg-[#F0F2F5] px-2.5 py-1.5 rounded shadow-xs"
            title="Official MoSPI eSAKSHI Portal"
          >
            <span className="font-mono text-[10px]">eSAKSHI</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Mobile/Tablet Role Switcher Row */}
      <div className="flex lg:hidden overflow-x-auto border-t border-[#D9DDE3] px-4 py-1.5 gap-1.5 scrollbar-none bg-[#F0F2F5]">
        {roles.map((r) => (
          <button
            key={r.id}
            onClick={() => handleRoleChange(r.id, r.path)}
            className={`whitespace-nowrap rounded px-2.5 py-1 text-xs font-semibold transition ${
              role === r.id
                ? "bg-white text-blue-700 shadow-xs border border-[#D9DDE3]"
                : "text-[#5B6470] hover:bg-white hover:text-[#17202A]"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </header>
  );
}
