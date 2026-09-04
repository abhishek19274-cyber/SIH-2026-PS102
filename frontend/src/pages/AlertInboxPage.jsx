import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  ArrowUpCircle,
  FileText,
  Filter,
} from "lucide-react";
import { AppShell } from "../components/layout/AppShell";
import { ShapWaterfall } from "../components/charts/ShapWaterfall";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { useApp } from "../context/AppContext";
import { cn } from "../utils/formatters";

export function AlertInboxPage() {
  const {
    alerts,
    setSelectedAlertId,
    selectedAlert,
    disposeAlert,
    setDemoStep,
    setRole,
  } = useApp();

  const navigate = useNavigate();
  const [filterSeverity, setFilterSeverity] = useState("all");

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === "all") return true;
    return a.severity === filterSeverity;
  });

  const handleAction = (disposition) => {
    let note = "";
    if (disposition === "noted") {
      note = prompt("Enter remark or field audit note for this alert:") || "Auditor note added.";
    }
    disposeAlert(selectedAlert.id, disposition, note);

    if (disposition === "escalated") {
      // Advance to demo step 5 (State Nodal view)
      setDemoStep(5);
      setRole("sna");
    }
  };

  const handleJumpToState = () => {
    setRole("sna");
    setDemoStep(5);
    navigate("/state");
  };

  return (
    <AppShell
      title="Alert Triage & Verification Inbox"
      subtitle="Prioritized operational triage queue for AI-flagged anomalies: spatial duplicate detection, vendor cartels, and compliance deviations"
      actions={
        <div className="flex items-center gap-2">
          <Badge tone="critical">
            {alerts.filter((a) => a.disposition === "pending").length} Pending Review
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleJumpToState}
          >
            State Nodal Feed →
          </Button>
        </div>
      }
    >
      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Filter by Severity:
          </span>
          <div className="flex items-center gap-1">
            {["all", "critical", "elevated", "info"].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`rounded-full px-3 py-0.5 text-xs font-medium capitalize transition ${
                  filterSeverity === sev
                    ? "bg-sky-500 text-slate-950 font-bold"
                    : "border border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredAlerts.length} of {alerts.length} total alerts
        </span>
      </div>

      {/* Split Inbox Layout: Left List / Right Details */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 min-h-[640px]">
        {/* Left: Prioritized Alerts List */}
        <Card className="p-2 space-y-2 overflow-y-auto max-h-[720px]">
          {filteredAlerts.map((alert) => {
            const isSelected = selectedAlert?.id === alert.id;
            return (
              <div
                key={alert.id}
                onClick={() => setSelectedAlertId(alert.id)}
                className={cn(
                  "p-3 rounded-xl border transition cursor-pointer text-left space-y-1.5",
                  isSelected
                    ? "border-sky-500/50 bg-sky-500/10 shadow-md"
                    : "border-slate-800/80 bg-slate-900/40 hover:bg-slate-850 hover:border-slate-700"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={alert.severity}>
                    {alert.severity.toUpperCase()}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(alert.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="text-sm font-semibold text-slate-100 leading-snug line-clamp-2">
                  {alert.title}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>{alert.type}</span>
                  <span className="font-semibold text-sky-400 truncate max-w-[140px]">
                    {alert.entity}
                  </span>
                </div>

                {alert.disposition !== "pending" && (
                  <div className="pt-1 flex justify-end">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        alert.disposition === "true_positive"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : alert.disposition === "escalated"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      ✓ {alert.disposition.replace("_", " ")}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </Card>

        {/* Right: Selected Alert Detail Dossier */}
        {selectedAlert ? (
          <Card className="space-y-5 p-6 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Alert Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge tone={selectedAlert.severity}>
                      {selectedAlert.severity.toUpperCase()} PRIORITY
                    </Badge>
                    <span className="text-xs text-slate-400 font-mono">
                      ID: #{String(selectedAlert.id).toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500">· {selectedAlert.type}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                    {selectedAlert.title}
                  </h2>
                  <p className="text-xs text-sky-400 font-medium mt-1">
                    Entity: {selectedAlert.entity}
                  </p>
                </div>

                {/* Disposition Status Indicator */}
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                    Current Status
                  </span>
                  <span
                    className={`font-mono font-bold text-sm uppercase ${
                      selectedAlert.disposition === "true_positive"
                        ? "text-emerald-400"
                        : selectedAlert.disposition === "escalated"
                        ? "text-amber-400"
                        : "text-sky-400"
                    }`}
                  >
                    {selectedAlert.disposition.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Natural Language Explanation */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Diagnostic Root Cause Narrative
                </span>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {selectedAlert.explanation}
                </p>
              </div>

              {/* SHAP Factor Waterfall */}
              {selectedAlert.shap && selectedAlert.shap.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Explainable AI (SHAP Waterfall) Attribution
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Red = Raises risk · Green = Lowers risk
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2">
                    <ShapWaterfall data={selectedAlert.shap} height={200} />
                  </div>
                </div>
              )}

              {/* Supporting Evidence Documents */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Supporting Cryptographic & Audit Evidence
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {selectedAlert.evidence?.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-slate-800 bg-slate-900/50 p-2.5 text-xs text-slate-300 flex items-start gap-2"
                    >
                      <FileText className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviewer Note if present */}
              {selectedAlert.note && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                  <strong>Auditor Note:</strong> {selectedAlert.note}
                </div>
              )}
            </div>

            {/* Bottom Disposition Action Bar */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="success"
                  size="md"
                  onClick={() => handleAction("true_positive")}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Confirm True Positive
                </Button>

                <Button
                  variant="critical"
                  size="md"
                  onClick={() => handleAction("false_positive")}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Mark False Positive
                </Button>

                <Button
                  variant="elevated"
                  size="md"
                  onClick={() => handleAction("escalated")}
                >
                  <ArrowUpCircle className="h-4 w-4 mr-1" />
                  Escalate to State Authority (SNA)
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  onClick={() => handleAction("noted")}
                >
                  Add Audit Note
                </Button>
              </div>

              {selectedAlert.disposition === "escalated" && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleJumpToState}
                >
                  View in State Nodal Feed →
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <Card className="flex items-center justify-center p-10 text-slate-500 text-sm">
            Select an alert from the left inbox queue to inspect diagnostic factors.
          </Card>
        )}
      </div>
    </AppShell>
  );
}
