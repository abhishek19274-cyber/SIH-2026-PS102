import React from "react";
import { useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { DemoTourBar } from "./DemoTourBar";
import { Toast } from "../common/Toast";

const routeBreadcrumbMap = {
  "/ministry": "MoSPI Central Command",
  "/ida": "IDA District Sanctions (Bhopal)",
  "/mp": "MP Constituency Portfolio",
  "/state": "State Nodal Command (MP)",
  "/vendors": "Vendor Collusion Network",
  "/spatial": "Spatial Verification GIS",
  "/alerts": "Alert Triage Queue",
};

export function AppShell({ children, title, subtitle, actions, fullWidth = false }) {
  const location = useLocation();
  const breadcrumbName = routeBreadcrumbMap[location.pathname] || "Operational Module";

  return (
    <div className="h-screen bg-[#F5F6F8] text-[#17202A] flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
      <DemoTourBar />
      <Header />
      
      <div className="flex-1 flex overflow-hidden min-h-0">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className={`space-y-4 w-full p-4 sm:p-5 lg:p-6 ${
            fullWidth ? "max-w-full" : "max-w-7xl mx-auto"
          }`}>
            {(title || actions) && (
              <div className="space-y-1 pb-3.5 border-b border-[#D9DDE3]">
                {/* Contextual Breadcrumb */}
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#7A838E]">
                  <span>Home</span>
                  <span className="text-[#D9DDE3]">›</span>
                  <span className="text-[#17202A] font-semibold">{breadcrumbName}</span>
                </div>

                {/* Title & Actions Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#17202A]">
                      {title}
                    </h1>
                    {subtitle && (
                      <p className="mt-0.5 text-xs text-[#5B6470] font-normal leading-relaxed max-w-4xl">
                        {subtitle}
                      </p>
                    )}
                  </div>
                  {actions && (
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {actions}
                    </div>
                  )}
                </div>
              </div>
            )}

            {children}
          </div>
        </main>
      </div>

      <Toast />
    </div>
  );
}
