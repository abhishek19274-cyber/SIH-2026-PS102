import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { VendorNetworkGraph } from "../components/graph/VendorNetworkGraph";
import { ShapWaterfall } from "../components/charts/ShapWaterfall";
import { Card, CardTitle, CardHint } from "../components/common/Card";
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

  useEffect(() => {
    let isMounted = true;
    async function fetchNetwork() {
      try {
        const rawNet = await vendorService.getVendorNetwork();
        if (rawNet && isMounted) {
          setNetworkData(adaptVendorNetwork(rawNet));
        }
      } catch (err) {
        console.warn("[MPLADS Sentinel] Backend unavailable — using demo fallback.", err);
      }
    }
    fetchNetwork();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function fetchVendorInfo() {
      const rawId = selectedVendorId || selectedVendor?.id;
      const numId = parseInt(String(rawId).replace(/\D/g, ""), 10) || 1;
      try {
        const detail = await vendorService.getVendor(numId);
        if (detail && isMounted) {
          setVendorDetail(adaptVendor(detail));
        }
      } catch (err) {
        console.warn("[MPLADS Sentinel] Backend unavailable — using demo fallback.", err);
      }
    }
    fetchVendorInfo();
    return () => {
      isMounted = false;
    };
  }, [selectedVendorId, selectedVendor]);

  const activeVendor = vendorDetail || selectedVendor;

  const handleTestLinkedProject = () => {
    // Linked project is Community hall, Berasia
    setDemoStep(3);
    navigate("/spatial");
  };

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
            Verify Linked Project (Berasia) →
          </Button>
        </div>
      }
    >
      {/* D3 Force Directed Network Graph */}
      <Card className="p-0 overflow-hidden border-slate-800">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <CardTitle>Inter-Vendor Relationship & Cartel Graph</CardTitle>
            <CardHint>
              Click any vendor node to inspect its XAI SHAP risk waterfall, contract history, and linked constituency works.
            </CardHint>
          </div>
          <span className="text-xs text-slate-400">
            Selected: <strong className="text-sky-400">{activeVendor.name}</strong>
          </span>
        </div>
        <VendorNetworkGraph
          networkData={networkData}
          onSelectVendor={(node) => setSelectedVendorId(node.id)}
        />
      </Card>

      {/* Selected Vendor Detail & SHAP Waterfall Explanation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vendor Profile Dossier */}
        <Card className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Vendor Profile Dossier
              </span>
              <Badge tone={riskTone(activeVendor.risk)}>
                {riskLabel(activeVendor.risk)}
              </Badge>
            </div>
            <h3 className="text-xl font-bold text-white mt-1">
              {activeVendor.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Operating in: {activeVendor.constituencies ? activeVendor.constituencies.join(", ") : "Bhopal"}
            </p>
          </div>

          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs space-y-1">
            <span className="font-semibold text-rose-300">Flagged Anomaly Rationale:</span>
            <p className="text-slate-300 leading-relaxed">
              {activeVendor.flaggedReason}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
              <span className="text-slate-400">Total Contracts</span>
              <div className="text-base font-bold text-white font-mono mt-0.5">
                ₹{activeVendor.contractValueCr} Cr
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
              <span className="text-slate-400">Completion Rate</span>
              <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                {(activeVendor.completionRate * 100).toFixed(0)}%
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
              <span className="text-slate-400">Cost Overrun Rate</span>
              <div className="text-base font-bold text-rose-400 font-mono mt-0.5">
                {(activeVendor.overrunRate * 100).toFixed(0)}%
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
              <span className="text-slate-400">Active Works</span>
              <div className="text-base font-bold text-sky-400 font-mono mt-0.5">
                {activeVendor.activeWorksCount} Projects
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            className="w-full justify-center"
            onClick={handleTestLinkedProject}
          >
            Test Spatial Clearance in Berasia →
          </Button>
        </Card>

        {/* Explainable AI: SHAP Waterfall Breakdown (2 cols) */}
        <Card className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                SHAP Risk Factor Attribution ({activeVendor.name})
              </CardTitle>
              <CardHint>
                Explainable AI waterfall: <span className="text-rose-400 font-semibold">Red bars</span> push risk higher; <span className="text-emerald-400 font-semibold">Green bars</span> reduce risk.
              </CardHint>
            </div>
            <Badge tone="info">TreeExplainer Model</Badge>
          </div>

          <div className="pt-2">
            <ShapWaterfall data={activeVendor.shap} height={260} />
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-xs text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300">Auditor Interpretation:</span>
            <p>
              Shared banking connection accounts for +0.28 risk delta due to financial co-mingling with Narmada Civil Works. Overrun history adds +0.21 risk. Past GST compliance lowers baseline risk marginally by -0.04.
            </p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
