import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { VendorNetworkGraph } from "../components/graph/VendorNetworkGraph";
import { ShapWaterfall } from "../components/charts/ShapWaterfall";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { useApp } from "../context/AppContext";
import { riskTone, riskLabel } from "../utils/formatters";
import { vendorService } from "../services/vendorService";
import { adaptVendorNetwork, adaptVendor } from "../services/adapters";

export function VendorNetworkPage() {
  const { selectedVendor, selectedVendorId, setSelectedVendorId, setDemoStep } = useApp();
  const navigate = useNavigate();
  const [networkData, setNetworkData] = useState(null);
  const [vendorDetail, setVendorDetail] = useState(null);

  // 1. Fetch complete vendor network topology
  useEffect(() => {
    let isMounted = true;
    async function fetchNetwork() {
      try {
        const rawNet = await vendorService.getVendorNetwork();
        if (rawNet && isMounted) {
          setNetworkData(adaptVendorNetwork(rawNet));
        }
      } catch (err) {
        console.warn("[MPLADS Sentinel] Backend network unavailable.", err);
      }
    }
    fetchNetwork();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch and synchronize selected vendor details accurately
  useEffect(() => {
    let isMounted = true;
    async function fetchVendorInfo() {
      const rawId = selectedVendorId || selectedVendor?.id || "v1";
      const numId = parseInt(String(rawId).replace(/\D/g, ""), 10) || 1;
      const idStr = `v${numId}`;

      const netNode = networkData?.nodes?.find((n) => String(n.id) === idStr);
      const netLinks = networkData?.links || [];
      const netScore = networkData?.scores?.[numId] || networkData?.scores?.[idStr];

      // Immediately set preliminary data from network so UI updates without lag
      if (netNode && isMounted) {
        setVendorDetail(adaptVendor(null, netNode, netLinks, netScore));
      }

      try {
        const detail = await vendorService.getVendor(numId);
        if (detail && isMounted) {
          setVendorDetail(adaptVendor(detail, netNode, netLinks, netScore));
          return;
        }
      } catch (err) {
        console.warn("[MPLADS Sentinel] Backend getVendor unavailable.", err);
      }

      // If backend call failed or networkData loaded, synthesize from node or fallback
      if (isMounted && netNode) {
        setVendorDetail(adaptVendor(null, netNode, netLinks, netScore));
      }
    }

    fetchVendorInfo();
    return () => {
      isMounted = false;
    };
  }, [selectedVendorId, selectedVendor, networkData]);

  // Derive active vendor safely
  const fallbackVendor = { id: selectedVendorId || "v1", risk: 0, name: "Loading Contractor Data..." };
  const activeVendor =
    vendorDetail ||
    adaptVendor(
      fallbackVendor,
      networkData?.nodes?.find((n) => String(n.id) === String(selectedVendorId)),
      networkData?.links || [],
      networkData?.scores?.[parseInt(String(selectedVendorId).replace(/\D/g, ""), 10)]
    ) || fallbackVendor;

  const handleTestLinkedProject = () => {
    setDemoStep(3);
    navigate("/spatial");
  };

  // SHAP data: Ensure baseline or actual attributions are rendered
  const shapData =
    activeVendor.shap && activeVendor.shap.length > 0
      ? activeVendor.shap
      : [
          {
            feature: "Baseline Procurement Risk",
            value: activeVendor.risk <= 5 ? 0.05 : Number((activeVendor.risk / 100).toFixed(2)),
          },
        ];

  return (
    <AppShell
      title="Vendor Collusion Network & Risk Intelligence"
      subtitle="D3.js force-directed topology tracking shared bank accounts, registered addresses, co-bidding cartels, and SHAP feature attributions"
      actions={
        <div className="flex items-center gap-2">
          <Badge tone={riskTone(activeVendor.risk)}>
            {activeVendor.name} (Risk: {activeVendor.risk}/100)
          </Badge>
          <Button
            variant="critical"
            size="sm"
            onClick={handleTestLinkedProject}
          >
            Verify Linked Project →
          </Button>
        </div>
      }
    >
      {/* 1. Network Macro KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#D9DDE3] rounded border border-[#D9DDE3] bg-white shadow-xs">
        <div className="p-3 sm:px-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A838E]">
            Tracked Contractors
          </span>
          <div className="text-xl font-bold font-mono text-[#17202A] mt-0.5">
            {networkData?.nodes?.filter((n) => n.kind === "vendor" || String(n.id).startsWith("v"))?.length || 0} Entities
          </div>
          <span className="text-[11px] text-[#5B6470]">100% PFMS mapped</span>
        </div>

        <div className="p-3 sm:px-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A838E]">
            High-Risk Contractors
          </span>
          <div className="text-xl font-bold font-mono text-red-600 mt-0.5">
            {networkData?.nodes?.filter((n) => n.risk >= 70 && (n.kind === "vendor" || String(n.id).startsWith("v")))?.length || 0} Flagged
          </div>
          <span className="text-[11px] text-[#5B6470]">Multi-factor score ≥ 70</span>
        </div>

        <div className="p-3 sm:px-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A838E]">
            Cartel & Co-Bidding Links
          </span>
          <div className="text-xl font-bold font-mono text-amber-600 mt-0.5">
            {networkData?.links?.length || 0} Relationships
          </div>
          <span className="text-[11px] text-[#5B6470]">Shared banking & addresses</span>
        </div>

        <div className="p-3 sm:px-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A838E]">
            Active Cartel Ring
          </span>
          <div className="text-xl font-bold font-mono text-[#17202A] mt-0.5">
            DB Analytics
          </div>
          <span className="text-[11px] text-red-600 font-semibold">Convex Hull Isolated</span>
        </div>
      </div>

      {/* 2. Side-by-Side Large Analytical Workspace: D3 Topology (Left) + Selected Vendor Dossier (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_390px] gap-4 items-start">
        {/* Left: Dominant D3 Force Directed Network Graph Workspace */}
        <div className="rounded border border-[#D9DDE3] bg-white overflow-hidden shadow-xs">
          <div className="p-3.5 border-b border-[#D9DDE3] bg-[#F0F2F5] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 font-semibold">
                  TOPOLOGY WORKBENCH
                </span>
                <h3 className="text-sm font-semibold tracking-tight text-[#17202A]">
                  Inter-Vendor Relationship & Cartel Topology
                </h3>
              </div>
              <p className="text-[11px] text-[#5B6470] mt-0.5">
                Click any contractor node to inspect its XAI SHAP attribution waterfall, risk profile, and linked projects.
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#5B6470] hidden sm:inline">
              Selected: <strong className="text-blue-700 font-bold">{activeVendor.name}</strong>
            </span>
          </div>
          <VendorNetworkGraph
            networkData={networkData}
            onSelectVendor={(node) => setSelectedVendorId(node.id)}
          />
        </div>

        {/* Right: Selected Vendor Professional Enterprise Dossier */}
        <div className="rounded border border-[#D9DDE3] bg-white p-4 shadow-xs space-y-4">
          {/* Header */}
          <div className="border-b border-[#D9DDE3] pb-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7A838E]">
              Selected Vendor Dossier
            </span>
            <div className="flex items-start justify-between gap-2 mt-1">
              <h2 className="text-lg font-bold text-[#17202A] leading-tight">
                {activeVendor.name}
              </h2>
              <Badge tone={riskTone(activeVendor.risk)} className="shrink-0 font-mono text-[10px]">
                {riskLabel(activeVendor.risk)} {activeVendor.risk}
              </Badge>
            </div>
          </div>

          {/* Basic Information Section */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A838E]">
              Basic Information
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="rounded border border-[#D9DDE3] bg-[#F0F2F5] p-2">
                <span className="text-[9px] uppercase tracking-wider text-[#7A838E] block">Entity Type</span>
                <span className="font-semibold text-[#17202A] font-sans truncate block" title={activeVendor.gstin || "Primary Contractor"}>
                  {activeVendor.gstin ? `GST: ${activeVendor.gstin}` : "Primary Contractor"}
                </span>
              </div>
              <div className="rounded border border-[#D9DDE3] bg-[#F0F2F5] p-2">
                <span className="text-[9px] uppercase tracking-wider text-[#7A838E] block">Jurisdiction</span>
                <span className="font-semibold text-[#17202A] font-sans truncate block" title={activeVendor.state || (activeVendor.constituencies?.length ? activeVendor.constituencies.join(", ") : "—")}>
                  {activeVendor.state || (activeVendor.constituencies?.length ? activeVendor.constituencies.join(", ") : "—")}
                </span>
              </div>
              <div className="rounded border border-[#D9DDE3] bg-[#F0F2F5] p-2">
                <span className="text-[9px] uppercase tracking-wider text-[#7A838E] block">Contracts Value</span>
                <span className="font-bold text-[#17202A]">
                  {activeVendor.contractValueCr !== null && activeVendor.contractValueCr !== undefined
                    ? activeVendor.contractValueCr < 0.01 && activeVendor.contractValueCr > 0
                      ? "< ₹0.01 Cr"
                      : `₹${Number(activeVendor.contractValueCr).toFixed(2)} Cr`
                    : "—"}
                </span>
              </div>
              <div className="rounded border border-[#D9DDE3] bg-[#F0F2F5] p-2">
                <span className="text-[9px] uppercase tracking-wider text-[#7A838E] block">Active Works</span>
                <span className="font-bold text-blue-700">
                  {activeVendor.activeWorksCount !== null && activeVendor.activeWorksCount !== undefined
                    ? `${activeVendor.activeWorksCount} Work${activeVendor.activeWorksCount === 1 ? "" : "s"}`
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Key Risk Indicators Section */}
          <div className="space-y-2 pt-1 border-t border-[#D9DDE3]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A838E]">
              Key Risk Indicators
            </span>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded border border-[#D9DDE3] bg-[#F0F2F5]">
                <span className="text-[#5B6470]">Cost Overrun Rate</span>
                <span className={`font-mono font-bold ${activeVendor.overrunRate ? "text-red-600" : "text-[#17202A]"}`}>
                  {activeVendor.overrunRate !== null && activeVendor.overrunRate !== undefined
                    ? activeVendor.overrunRate > 0
                      ? `${(activeVendor.overrunRate * 100).toFixed(0)}% (Flagged)`
                      : "0% (Nominal)"
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded border border-[#D9DDE3] bg-[#F0F2F5]">
                <span className="text-[#5B6470]">Physical Completion</span>
                <span className="font-mono font-bold text-emerald-700">
                  {activeVendor.completionRate !== null && activeVendor.completionRate !== undefined
                    ? `${(activeVendor.completionRate * 100).toFixed(0)}%`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded border border-[#D9DDE3] bg-[#F0F2F5]">
                <span className="text-[#5B6470]">Shared Banking Link</span>
                <span className={`font-mono font-bold ${activeVendor.linkedBankCount > 0 ? "text-blue-700" : "text-[#5B6470]"}`}>
                  {activeVendor.linkedBankCount !== null && activeVendor.linkedBankCount !== undefined
                    ? activeVendor.linkedBankCount > 0
                      ? `${activeVendor.linkedBankCount} Shared Account${activeVendor.linkedBankCount > 1 ? "s" : ""}`
                      : "None (Independent)"
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded border border-[#D9DDE3] bg-[#F0F2F5]">
                <span className="text-[#5B6470]">Registered Address Link</span>
                <span className={`font-mono font-bold ${activeVendor.linkedAddressCount > 0 ? "text-amber-600" : "text-[#5B6470]"}`}>
                  {activeVendor.linkedAddressCount !== null && activeVendor.linkedAddressCount !== undefined
                    ? activeVendor.linkedAddressCount > 0
                      ? `${activeVendor.linkedAddressCount} Co-located Office${activeVendor.linkedAddressCount > 1 ? "s" : ""}`
                      : "Independent Office"
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Structured Anomaly Record */}
          <div className="space-y-2 pt-1 border-t border-[#D9DDE3]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A838E]">
                Diagnostic Cartel Finding
              </span>
              <span className="text-[10px] font-mono text-red-600 font-bold">
                {activeVendor.cartelGroupId || (activeVendor.risk >= 70 ? `ALT-VND-${String(activeVendor.vendorId).padStart(3, "0")}` : `AUDIT-VND-${String(activeVendor.vendorId).padStart(3, "0")}`)}
              </span>
            </div>
            <div className="rounded border border-[#D9DDE3] bg-[#F0F2F5] p-3 text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2 text-[11px] pb-2 border-b border-[#D9DDE3]">
                <div>
                  <span className="text-[#7A838E] text-[10px] block">Location</span>
                  <span className="font-semibold text-[#17202A] truncate block" title={activeVendor.registeredAddress || activeVendor.state || "Jurisdiction Record Available"}>
                    {activeVendor.registeredAddress || activeVendor.state || "Jurisdiction Record Available"}
                  </span>
                </div>
                <div>
                  <span className="text-[#7A838E] text-[10px] block">Affiliated Cartel Ring</span>
                  <span className="font-semibold text-[#17202A]">
                    {activeVendor.cartelGroupId ? `Ring: ${activeVendor.cartelGroupId}` : "None (No Ring Detected)"}
                  </span>
                </div>
              </div>
              <div>
                <span className="font-bold text-[#17202A] text-[10px] uppercase tracking-wider block mb-1">
                  Key Findings
                </span>
                <ul className="text-[11px] text-[#5B6470] space-y-1 list-disc list-inside">
                  {activeVendor.signals && activeVendor.signals.length > 0 ? (
                    activeVendor.signals.map((sig, idx) => (
                      <li key={idx} className="capitalize">{sig}</li>
                    ))
                  ) : activeVendor.flaggedReason ? (
                    <li>{activeVendor.flaggedReason}</li>
                  ) : (
                    <>
                      <li>Independent banking hash with no co-mingled accounts</li>
                      <li>Distinct registered office address in {activeVendor.state || "State Registry"}</li>
                      <li>Public procurement participation with {activeVendor.coBiddersCount || 0} peer contractors</li>
                    </>
                  )}
                </ul>
              </div>
              <div className="pt-1.5 border-t border-[#D9DDE3] text-[10px] text-[#5B6470]">
                <strong className="text-[#17202A]">Required Action: </strong>
                {activeVendor.risk >= 70 || activeVendor.cartelGroupId
                  ? "Mandatory scrutiny by District Authority prior to PFMS sanction clearance."
                  : activeVendor.risk >= 20
                  ? "Enhanced transaction audit required for milestone invoice disbursements."
                  : "Standard automated monitoring; regular PFMS disbursements permitted."}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 border-t border-[#D9DDE3]">
            <Button
              variant="primary"
              size="sm"
              className="w-full justify-center shadow-xs"
              onClick={handleTestLinkedProject}
            >
              Verify Linked Project →
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Supporting Network Analytics: Explainable AI SHAP Waterfall Breakdown */}
      <div className="rounded border border-[#D9DDE3] bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9DDE3] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 font-semibold">
                XAI ATTRIBUTION
              </span>
              <h3 className="text-sm font-semibold tracking-tight text-[#17202A]">
                SHAP Risk Factor Attribution ({activeVendor.name})
              </h3>
            </div>
            <p className="text-xs text-[#5B6470] mt-0.5">
              Explainable AI contribution waterfall: <span className="text-red-600 font-semibold">Red bars</span> elevate risk; <span className="text-emerald-700 font-semibold">Green bars</span> mitigate risk.
            </p>
          </div>
          <Badge tone="info" className="font-mono text-[10px]">TreeExplainer Model</Badge>
        </div>

        <div className="pt-1">
          <ShapWaterfall data={shapData} height={220} />
        </div>

        <div className="rounded border border-[#D9DDE3] bg-[#F0F2F5] p-3 text-xs text-[#5B6470] space-y-1">
          <span className="font-bold text-[#17202A] text-[10px] uppercase tracking-wider">
            Auditor Diagnostic Interpretation:
          </span>
          <p className="text-[11px] leading-relaxed">
            {activeVendor.narrative
              ? activeVendor.narrative
              : activeVendor.signals && activeVendor.signals.length > 0
              ? `Active risk signals flagged: ${activeVendor.signals.join("; ")}.`
              : `No anomalous feature elevations identified for ${activeVendor.name}. Contractor operating within baseline procurement parameters (${activeVendor.risk}/100).`}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
