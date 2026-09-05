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
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-[#7A838E]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A838E]">
            Severity Filter:
          </span>
          <div className="flex items-center gap-1">
            {["all", "critical", "elevated", "info"].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`rounded px-2.5 py-0.5 text-xs font-semibold capitalize transition-colors ${
                  filterSeverity === sev
                    ? "bg-blue-600 text-white shadow-xs"
                    : "border border-[#D9DDE3] bg-white text-[#5B6470] hover:bg-[#F0F2F5] hover:text-[#17202A]"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        <span className="text-[11px] text-[#5B6470] font-mono">
          Showing {filteredAlerts.length} of {alerts.length} total alerts
        </span>
      </div>

      {/* Split Inbox Layout: Left Structured Triage Queue / Right Investigation Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 min-h-[640px]">
        {/* Left: Prioritized Alerts Triage Queue */}
        <div className="rounded border border-[#D9DDE3] bg-white overflow-hidden flex flex-col shadow-subtle max-h-[740px]">
          <div className="p-2.5 border-b border-[#D9DDE3] bg-[#F0F2F5] flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A838E]">
              Operational Triage Stream
            </span>
            <span className="text-[10px] font-mono text-[#7A838E]">
              {filteredAlerts.length} Queued
            </span>
          </div>

          <div className="overflow-y-auto divide-y divide-[#D9DDE3] flex-1">
            {filteredAlerts.map((alert) => {
              const isSelected = selectedAlert?.id === alert.id;
              return (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlertId(alert.id)}
                  className={cn(
                    "p-3 transition-colors cursor-pointer text-left space-y-1",
                    isSelected
                      ? "bg-blue-50/70 border-l-2 border-blue-600"
                      : "hover:bg-[#F0F2F5] bg-white"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone={alert.severity} className="text-[9px] px-1 py-0">
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <span className="text-[9px] text-[#7A838E] font-mono">
                      {new Date(alert.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-[#17202A] leading-snug line-clamp-2">
                    {alert.title}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#5B6470] pt-0.5 font-mono">
                    <span className="truncate max-w-[150px]">{alert.type}</span>
                    <span className="font-semibold text-blue-700 truncate max-w-[140px]">
                      {alert.entity}
                    </span>
                  </div>

                  {alert.disposition !== "pending" && (
                    <div className="pt-0.5 flex justify-end">
                      <span
                        className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                          alert.disposition === "true_positive"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : alert.disposition === "escalated"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-[#F0F2F5] text-[#5B6470] border-[#D9DDE3]"
                        }`}
                      >
                        ✓ {alert.disposition.replace("_", " ")}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Alert Detail Investigation Dossier */}
        {selectedAlert ? (
          <Card className="space-y-4 p-4 sm:p-5 flex flex-col justify-between">
            <div className="space-y-3.5">
              {/* Alert Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#D9DDE3] pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge tone={selectedAlert.severity} className="text-[10px]">
                      {selectedAlert.severity.toUpperCase()} PRIORITY
                    </Badge>
                    <span className="text-xs text-[#7A838E] font-mono">
                      #{String(selectedAlert.id).toUpperCase()}
                    </span>
                    <span className="text-xs text-[#7A838E]">· {selectedAlert.type}</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#17202A] leading-snug">
                    {selectedAlert.title}
                  </h2>
                  <p className="text-xs text-[#5B6470] font-medium mt-0.5">
                    Target Entity: <span className="font-semibold text-[#17202A]">{selectedAlert.entity}</span>
                  </p>
                </div>

                {/* Disposition Status Indicator */}
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-[#7A838E] font-bold block">
                    Current Triage State
                  </span>
                  <span
                    className={`font-mono font-bold text-xs uppercase ${
                      selectedAlert.disposition === "true_positive"
                        ? "text-emerald-700"
                        : selectedAlert.disposition === "escalated"
                        ? "text-amber-700"
                        : "text-blue-700"
                    }`}
                  >
                    {selectedAlert.disposition.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Structured Metadata Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="rounded border border-[#D9DDE3] bg-[#F0F2F5] p-2.5">
                  <span className="text-[9px] uppercase tracking-wider text-[#7A838E] block">Location</span>
                  <span className="font-semibold text-[#17202A] font-sans">Bhopal, MP</span>
                </div>
                <div className="rounded border border-[#D9DDE3] bg-[#F0F2F5] p-2.5">
                  <span className="text-[9px] uppercase tracking-wider text-[#7A838E] block">Detected On</span>
                  <span className="font-semibold text-[#17202A]">
                    {new Date(selectedAlert.timestamp).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="rounded border border-[#D9DDE3] bg-[#F0F2F5] p-2.5">
                  <span className="text-[9px] uppercase tracking-wider text-[#7A838E] block">Alert Reference</span>
                  <span className="font-bold text-[#17202A]">ALT-{String(selectedAlert.id).padStart(4, "0")}</span>
                </div>
                <div className="rounded border border-[#D9DDE3] bg-[#F0F2F5] p-2.5">
                  <span className="text-[9px] uppercase tracking-wider text-[#7A838E] block">Classification</span>
                  <span className="font-semibold text-blue-700 font-sans truncate block">{selectedAlert.type}</span>
                </div>
              </div>

              {/* Structured Two-Column Findings & Required Action Block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="rounded border border-[#D9DDE3] bg-[#F0F2F5] p-3 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#17202A] block">
                    Key Audit Findings
                  </span>
                  <ul className="text-[11px] text-[#5B6470] space-y-1 list-disc list-inside">
                    <li>Multi-factor risk anomaly triggered by automated sentinel engine</li>
                    <li>Discrepancy registered against statutory guidelines</li>
                    <li>Physical or financial audit required prior to phase sign-off</li>
                  </ul>
                </div>

                <div className="rounded border border-[#D9DDE3] bg-[#F0F2F5] p-3 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#17202A] block">
                    Required Statutory Action
                  </span>
                  <p className="text-[11px] text-[#5B6470] leading-relaxed">
                    Mandatory verification by Implementing District Authority (IDA) within 45-day statutory window. Referral to State Nodal Authority if co-mingling or cross-district cartel is confirmed.
                  </p>
                </div>
              </div>

              {/* Natural Language Diagnostic Explanation */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A838E] block">
                  Diagnostic Root Cause Narrative
                </span>
                <p className="text-xs text-[#17202A] leading-relaxed p-3 rounded border border-[#D9DDE3] bg-white">
                  {selectedAlert.explanation}
                </p>
              </div>

              {/* SHAP Factor Waterfall */}
              {selectedAlert.shap && selectedAlert.shap.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A838E]">
                      Explainable AI (SHAP Waterfall) Attribution
                    </span>
                    <span className="text-[10px] text-[#5B6470] font-mono">
                      Red: Elevates Risk · Green: Lowers Risk
                    </span>
                  </div>
                  <div className="rounded border border-[#D9DDE3] bg-white p-2">
                    <ShapWaterfall data={selectedAlert.shap} height={180} />
                  </div>
                </div>
              )}

              {/* Supporting Cryptographic & Audit Evidence */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A838E]">
                  Cryptographic & Audit Evidence Artifacts
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {selectedAlert.evidence?.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded border border-[#D9DDE3] bg-[#F0F2F5] p-2 text-[11px] text-[#17202A] flex items-start gap-1.5"
                    >
                      <FileText className="h-3.5 w-3.5 text-blue-700 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 font-mono text-[10px]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviewer Note if present */}
              {selectedAlert.note && (
                <div className="rounded border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
                  <strong className="font-bold">Auditor Note:</strong> {selectedAlert.note}
                </div>
              )}
            </div>

            {/* Bottom Disposition Action Bar */}
            <div className="pt-3 border-t border-[#D9DDE3] flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleAction("true_positive")}
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  Confirm True Positive
                </Button>

                <Button
                  variant="critical"
                  size="sm"
                  onClick={() => handleAction("false_positive")}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  False Positive
                </Button>

                <Button
                  variant="elevated"
                  size="sm"
                  onClick={() => handleAction("escalated")}
                >
                  <ArrowUpCircle className="h-3.5 w-3.5 mr-1" />
                  Escalate to SNA
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction("noted")}
                >
                  Add Audit Note
                </Button>
              </div>

              {selectedAlert.disposition === "escalated" && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleJumpToState}
                >
                  State Nodal Feed →
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <Card className="flex items-center justify-center p-10 text-[#7A838E] text-xs">
            Select an alert from the left operational triage queue to inspect diagnostic factors.
          </Card>
        )}
      </div>
    </AppShell>
  );
}
