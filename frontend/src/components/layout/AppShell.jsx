import React from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { DemoTourBar } from "./DemoTourBar";
import { Toast } from "../common/Toast";

export function AppShell({ children, title, subtitle, actions }) {
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans">
      <DemoTourBar />
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {(title || actions) && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-1 text-xs sm:text-sm text-slate-400">
                    {subtitle}
                  </p>
                )}
              </div>
              {actions && (
                <div className="flex flex-wrap items-center gap-2">
                  {actions}
                </div>
              )}
            </div>
          )}

          {children}
        </main>
      </div>

      <Toast />
    </div>
  );
}
