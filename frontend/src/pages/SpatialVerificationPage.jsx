import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
} from "lucide-react";
import { AppShell } from "../components/layout/AppShell";
import { SpatialHexMap } from "../components/maps/SpatialHexMap";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { useApp } from "../context/AppContext";
import {
  evaluateSpatialConflict,
  demonstrationLocations,
  CONFLICT_THRESHOLD_METERS,
} from "../services/spatialService";
import { projectService } from "../services/projectService";

export function SpatialVerificationPage() {
  const navigate = useNavigate();
  const { createLiveAlert, setDemoStep } = useApp();

  // Active Proposal Coordinates & Form Data
  const [proposedCoords, setProposedCoords] = useState({
    lat: demonstrationLocations.duplicateBerasia.lat,
    lng: demonstrationLocations.duplicateBerasia.lng,
  });

  const [workName, setWorkName] = useState(
    demonstrationLocations.duplicateBerasia.name
  );
  const [vendorName, setVendorName] = useState(
    demonstrationLocations.duplicateBerasia.vendor
  );
  const [amountCr, setAmountCr] = useState(
    demonstrationLocations.duplicateBerasia.amountCr
  );
  const [category, setCategory] = useState(
    demonstrationLocations.duplicateBerasia.category
  );

  const [backendGeoVerify, setBackendGeoVerify] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function verifyWithBackend() {
      try {
        const res = await projectService.verifyProjectLocation({
          latitude: proposedCoords.lat,
          longitude: proposedCoords.lng,
          threshold_meters: 500,
        });
        if (res && isMounted) {
          setBackendGeoVerify(res);
        }
      } catch (err) {
        console.warn("[MPLADS Sentinel] Backend unavailable — using demo fallback.", err);
      }
    }
    verifyWithBackend();
    return () => {
      isMounted = false;
    };
  }, [proposedCoords.lat, proposedCoords.lng]);

  // Compute real-time spatial conflict diagnostics via spatialService
  const conflictData = useMemo(() => {
    return evaluateSpatialConflict(proposedCoords.lat, proposedCoords.lng);
  }, [proposedCoords.lat, proposedCoords.lng]);

  const handleLocationChange = (lat, lng) => {
    setProposedCoords({ lat, lng });
  };

  const handlePresetDuplicate = () => {
    const loc = demonstrationLocations.duplicateBerasia;
    setProposedCoords({ lat: loc.lat, lng: loc.lng });
    setWorkName(loc.name);
    setVendorName(loc.vendor);
    setAmountCr(loc.amountCr);
    setCategory(loc.category);
  };

  const handlePresetEco = () => {
    const loc = demonstrationLocations.ecoZoneBerasiaNorth;
    setProposedCoords({ lat: loc.lat, lng: loc.lng });
    setWorkName(loc.name);
    setVendorName(loc.vendor);
    setAmountCr(loc.amountCr);
    setCategory(loc.category);
  };

  const handlePresetClear = () => {
    const loc = demonstrationLocations.clearBairagarh;
    setProposedCoords({ lat: loc.lat, lng: loc.lng });
    setWorkName(loc.name);
    setVendorName(loc.vendor);
    setAmountCr(loc.amountCr);
    setCategory(loc.category);
  };

  const handleGenerateAlert = () => {
    const isDuplicate = conflictData.conflictType === "duplicate" || (backendGeoVerify?.duplicates?.length > 0);
    const backendDupe = backendGeoVerify?.duplicates?.[0];

    createLiveAlert({
      title: isDuplicate
        ? `Duplicate asset within ${conflictData.distanceMeters}m H3 cell: ${workName}`
        : `PM GatiShakti restricted-zone intersection: ${workName}`,
      type: "Spatial conflict",
      severity: isDuplicate ? "critical" : "elevated",
      entity: `${workName} · [${proposedCoords.lat.toFixed(4)}, ${proposedCoords.lng.toFixed(4)}]`,
      explanation: backendDupe
        ? `Flask GIS Engine confirmed duplicate asset #${backendDupe.project_id} "${backendDupe.title}" at distance ${backendDupe.distance_meters.toFixed(1)}m. ` + conflictData.reason
        : conflictData.reason,
      shap: [
        { feature: `H3 spatial proximity (${conflictData.distanceMeters}m)`, value: isDuplicate ? 0.44 : 0.05 },
        { feature: "Ecological buffer overlap", value: isDuplicate ? 0.02 : 0.38 },
        { feature: "Vendor network risk", value: 0.22 },
        { feature: "Same implementing agency", value: 0.12 },
        { feature: "Utilisation lag", value: 0.08 },
      ],
      evidence: [
        `H3 Hex index: #${backendGeoVerify?.h3_index || conflictData.h3CellId}`,
        backendDupe
          ? `Backend Database Match: Project #${backendDupe.project_id} (${backendDupe.title})`
          : conflictData.closestAsset
          ? `Existing Asset ID #${conflictData.closestAsset.id} (${conflictData.closestAsset.name})`
          : `PM GatiShakti Eco-Layer Buffer #MOEFCC-BPL-2026`,
        `GIS Haversine calculation: ${conflictData.distanceMeters} meters separation`,
      ],
    });

    setDemoStep(4);
    navigate("/alerts");
  };

  const statusTone =
    conflictData.status === "critical"
      ? "critical"
      : conflictData.status === "restricted"
      ? "elevated"
      : "normal";

  return (
    <AppShell
      title="Project Spatial Verification"
      subtitle="Geospatial verification for proposed MPLADS works against existing district assets and regional master plans"
      actions={
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePresetDuplicate}
            className={
              conflictData.conflictType === "duplicate"
                ? "border-red-600 bg-red-50 text-red-700 font-semibold"
                : ""
            }
          >
            Scenario: Duplicate Asset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePresetEco}
            className={
              conflictData.conflictType === "ecological"
                ? "border-amber-600 bg-amber-50 text-amber-800 font-semibold"
                : ""
            }
          >
            Scenario: Eco Zone
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePresetClear}
            className={
              conflictData.conflictType === "none"
                ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold"
                : ""
            }
          >
            Scenario: Clear
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* 1. Dominant GIS Spatial Workstation Canvas */}
        <div className="space-y-2">
          <SpatialHexMap
            proposedCoords={proposedCoords}
            conflictData={conflictData}
            onLocationChange={handleLocationChange}
            height={460}
          />
        </div>

        {/* 2. Side-by-Side Spatial Diagnostic Result & Proposal Dossier */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Diagnostic Result & Statutory Action */}
          <Card className="space-y-3.5 p-3.5 sm:p-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#D9DDE3] pb-2.5">
                <div>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#7A838E]">
                    Spatial Verification Verdict
                  </span>
                  <h3 className="text-base font-bold text-[#17202A] mt-0.5">
                    {conflictData.title}
                  </h3>
                </div>
                <Badge tone={statusTone} className="font-mono text-[10px]">
                  {conflictData.badgeText}
                </Badge>
              </div>

              {/* Structured Status Diagnostic Dossier */}
              <div className="rounded border border-[#D9DDE3] bg-[#F0F2F5] p-3.5 space-y-3">
                {/* Verdict Header Row */}
                <div className="flex items-center justify-between pb-2 border-b border-[#D9DDE3]">
                  <div className="flex items-center gap-2">
                    {conflictData.status === "critical" ? (
                      <AlertOctagon className="h-4 w-4 text-red-600 shrink-0" />
                    ) : conflictData.status === "restricted" ? (
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    )}
                    <span className="font-bold text-xs uppercase tracking-wide text-[#17202A]">
                      {conflictData.status === "critical"
                        ? "Statutory Proximity Conflict Detected"
                        : conflictData.status === "restricted"
                        ? "Restricted Environmental Zone Buffer"
                        : "Statutory Clearance Approved"}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-[#5B6470]">
                    {conflictData.status === "clear" ? "CODE: 00-OK" : "CODE: 45-ERR"}
                  </span>
                </div>

                {/* Spatial Parameter Matrix */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="bg-white rounded border border-[#D9DDE3] p-2">
                    <span className="text-[9px] uppercase tracking-wider text-[#7A838E] block">Spatial Distance</span>
                    <span className={`font-bold tabular-nums ${conflictData.distanceMeters < CONFLICT_THRESHOLD_METERS ? "text-red-600" : "text-emerald-700"}`}>
                      {conflictData.distanceMeters} Meters
                    </span>
                    <span className="text-[9px] text-[#7A838E] block">Threshold: {CONFLICT_THRESHOLD_METERS}m</span>
                  </div>
                  <div className="bg-white rounded border border-[#D9DDE3] p-2">
                    <span className="text-[9px] uppercase tracking-wider text-[#7A838E] block">H3 Spatial Index</span>
                    <span className="font-bold text-[#17202A] truncate block">#{conflictData.h3CellId}</span>
                    <span className="text-[9px] text-[#7A838E] block">Res-9 (~105m hex)</span>
                  </div>
                </div>

                {/* Key Findings Narrative */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A838E] block">
                    Diagnostic Finding
                  </span>
                  <p className="text-xs text-[#17202A] leading-relaxed">
                    {conflictData.reason}
                  </p>
                </div>

                {/* Conflicting Nearby Asset Record */}
                {conflictData.closestAsset && (
                  <div className="rounded border border-[#D9DDE3] bg-white p-2.5 text-xs font-mono space-y-1">
                    <div className="flex items-center justify-between text-[#17202A] font-semibold">
                      <span>Conflicting Asset:</span>
                      <span className="text-red-600 font-bold">#{conflictData.closestAsset.id}</span>
                    </div>
                    <div className="text-[#5B6470] font-sans text-[11px]">
                      {conflictData.closestAsset.name}
                    </div>
                    <div className="flex justify-between text-[10px] text-[#7A838E] pt-1 border-t border-[#D9DDE3]">
                      <span>Commissioned: {conflictData.closestAsset.completionYear}</span>
                      <span>Value: ₹{conflictData.closestAsset.costCr} Cr</span>
                      <span className="text-red-600 font-bold">Δ {conflictData.distanceMeters}m</span>
                    </div>
                  </div>
                )}

                {/* Statutory Recommendation */}
                <div className="pt-2 border-t border-[#D9DDE3] text-[11px] text-[#5B6470]">
                  <strong className="text-[#17202A]">Statutory Directive:</strong> {conflictData.recommendation}
                </div>
              </div>
            </div>

            {/* Action Button / Clearance Indicator */}
            <div className="pt-2 border-t border-[#D9DDE3]">
              {conflictData.status !== "clear" ? (
                <Button
                  variant={conflictData.status === "critical" ? "critical" : "elevated"}
                  size="md"
                  className="w-full justify-center shadow-subtle"
                  onClick={handleGenerateAlert}
                >
                  <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                  Generate Anomaly Alert & Route to IDA Triage Inbox →
                </Button>
              ) : (
                <div className="rounded bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 flex items-center justify-between">
                  <span>✓ Verified clear of duplicate assets and buffer setbacks</span>
                  <span className="font-bold font-mono text-[10px] uppercase">Eligible for Sanction</span>
                </div>
              )}
            </div>
          </Card>

          {/* Proposal Attributes Dossier */}
          <Card className="space-y-3 p-3.5 sm:p-4">
            <div className="border-b border-[#D9DDE3] pb-2.5">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#7A838E]">
                Work Proposal Attributes
              </span>
              <h3 className="text-base font-bold text-[#17202A] mt-0.5">
                Proposal Candidate Metadata
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[#7A838E] font-bold uppercase tracking-wider text-[9px] mb-1">
                  Work Title
                </label>
                <input
                  type="text"
                  value={workName}
                  onChange={(e) => setWorkName(e.target.value)}
                  className="w-full rounded border border-[#D9DDE3] bg-white px-2.5 py-1.5 text-xs text-[#17202A] focus:border-blue-600 focus:outline-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[#7A838E] font-bold uppercase tracking-wider text-[9px] mb-1">
                    Designated Vendor
                  </label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="w-full rounded border border-[#D9DDE3] bg-white px-2.5 py-1.5 text-xs text-[#17202A] focus:border-blue-600 focus:outline-none font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[#7A838E] font-bold uppercase tracking-wider text-[9px] mb-1">
                    Estimated Cost (₹ Cr)
                  </label>
                  <input
                    type="text"
                    value={amountCr}
                    onChange={(e) => setAmountCr(e.target.value)}
                    className="w-full rounded border border-[#D9DDE3] bg-white px-2.5 py-1.5 text-xs text-[#17202A] font-mono focus:border-blue-600 focus:outline-none tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#7A838E] font-bold uppercase tracking-wider text-[9px] mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded border border-[#D9DDE3] bg-white px-2.5 py-1.5 text-xs text-[#17202A] focus:border-blue-600 focus:outline-none font-sans"
                />
              </div>

              <div className="rounded border border-[#D9DDE3] bg-[#F0F2F5] p-2 text-[10px] font-mono text-[#5B6470] flex items-center justify-between">
                <span>GPS: <strong className="text-[#17202A] tabular-nums">{proposedCoords.lat.toFixed(5)}° N, {proposedCoords.lng.toFixed(5)}° E</strong></span>
                <span>H3 Res-9: <strong className="text-blue-700">#{conflictData.h3CellId}</strong></span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
