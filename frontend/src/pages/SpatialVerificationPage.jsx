import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  MapPin,
} from "lucide-react";
import { AppShell } from "../components/layout/AppShell";
import { SpatialHexMap } from "../components/maps/SpatialHexMap";
import { Card, CardTitle, CardHint } from "../components/common/Card";
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePresetDuplicate}
            className={
              conflictData.conflictType === "duplicate"
                ? "border-rose-500/50 bg-rose-500/10 text-rose-300"
                : ""
            }
          >
            Demo Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePresetEco}
            className={
              conflictData.conflictType === "ecological"
                ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                : ""
            }
          >
            Demo Eco Zone
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePresetClear}
            className={
              conflictData.conflictType === "none"
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                : ""
            }
          >
            Demo Clear
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Dominant Top Section: GIS Workstation Map */}
        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-400" />
              <CardTitle>Bhopal / Berasia GIS Verification Canvas</CardTitle>
            </div>
            <span className="text-xs text-slate-400">
              Proximity Threshold: {CONFLICT_THRESHOLD_METERS}m
            </span>
          </div>
          <CardHint>
            Interactive GIS cartography. Drag the proposed work pin or click on the map to evaluate candidate coordinates.
          </CardHint>

          <SpatialHexMap
            proposedCoords={proposedCoords}
            conflictData={conflictData}
            onLocationChange={handleLocationChange}
            height={480}
          />
        </Card>

        {/* Restrained Appraisal Panel Directly Below Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Diagnostic Result & Statutory Action */}
          <Card className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Spatial Verification Result
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {conflictData.title}
                  </h3>
                </div>
                <Badge tone={statusTone} className="font-mono text-[10px]">
                  {conflictData.badgeText}
                </Badge>
              </div>

              {/* Status Diagnostic Card */}
              <div
                className={`rounded-xl border p-4 space-y-2.5 ${
                  conflictData.status === "critical"
                    ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                    : conflictData.status === "restricted"
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  {conflictData.status === "critical" ? (
                    <AlertOctagon className="h-5 w-5 text-rose-400 shrink-0" />
                  ) : conflictData.status === "restricted" ? (
                    <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  )}
                  <h4 className="font-bold text-sm leading-tight">
                    {conflictData.status === "critical"
                      ? "Statutory Proximity Conflict"
                      : conflictData.status === "restricted"
                      ? "Restricted Zone Encroachment"
                      : "Clear for Sanction Review"}
                  </h4>
                </div>

                <p className="text-xs leading-relaxed opacity-95">
                  {conflictData.reason}
                </p>

                {conflictData.closestAsset && (
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2.5 text-[11px] font-mono space-y-1 text-slate-300">
                    <div className="text-slate-400">
                      Nearby Asset: <strong className="text-white">{conflictData.closestAsset.name}</strong>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Distance: <strong className="text-rose-400">{conflictData.distanceMeters}m</strong> (Threshold: {CONFLICT_THRESHOLD_METERS}m)</span>
                      <span>Commissioned: {conflictData.closestAsset.completionYear} (₹{conflictData.closestAsset.costCr} Cr)</span>
                    </div>
                  </div>
                )}

                <div className="text-[11px] font-medium pt-1 opacity-90">
                  <strong>Recommendation:</strong> {conflictData.recommendation}
                </div>
              </div>
            </div>

            {/* Action Button / Clearance Indicator */}
            <div className="pt-2">
              {conflictData.status !== "clear" ? (
                <Button
                  variant={conflictData.status === "critical" ? "critical" : "elevated"}
                  size="md"
                  className="w-full justify-center shadow-md"
                  onClick={handleGenerateAlert}
                >
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  Generate Anomaly Alert & Push to IDA Inbox →
                </Button>
              ) : (
                <div className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs text-emerald-300 flex items-center justify-between">
                  <span>✓ Verified clear of duplicate assets and corridor setbacks</span>
                  <span className="font-bold">Eligible for Sanction</span>
                </div>
              )}
            </div>
          </Card>

          {/* Proposal Attributes Dossier */}
          <Card className="space-y-3">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Work Proposal Attributes
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Proposal Metadata
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium uppercase tracking-wider text-[10px] mb-1">
                  Work Title
                </label>
                <input
                  type="text"
                  value={workName}
                  onChange={(e) => setWorkName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium uppercase tracking-wider text-[10px] mb-1">
                    Designated Vendor
                  </label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium uppercase tracking-wider text-[10px] mb-1">
                    Estimated Cost (₹ Cr)
                  </label>
                  <input
                    type="text"
                    value={amountCr}
                    onChange={(e) => setAmountCr(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium uppercase tracking-wider text-[10px] mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>GPS: <strong className="text-slate-200">{proposedCoords.lat.toFixed(5)}° N, {proposedCoords.lng.toFixed(5)}° E</strong></span>
                <span>H3 Res-9: <strong className="text-sky-400">#{conflictData.h3CellId}</strong></span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
