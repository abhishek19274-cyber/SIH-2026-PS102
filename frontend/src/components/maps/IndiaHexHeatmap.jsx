import React, { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as d3 from "d3";
import { X, AlertTriangle, Shield, MapPin } from "lucide-react";
import { useApp } from "../../context/AppContext";
import {
  getNationalGeography,
  getStateMetric,
  getMetricValue,
  getMetricColor,
  getConstituencyPins,
} from "../../services/nationalGeoService";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { riskTone, riskLabel } from "../../utils/formatters";

export function IndiaHexHeatmap() {
  const {
    metricLayer,
    setMetricLayer,
    selectedConstituencyId,
    setSelectedConstituencyId,
    selectedConstituency,
    setSelectedVendorId,
    setDemoStep,
    setRole,
  } = useApp();

  const navigate = useNavigate();
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [showConstituencyPins, setShowConstituencyPins] = useState(true);
  const mapContainerRef = useRef(null);

  const handleMouseMove = (e) => {
    const rect = mapContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltipPos({
      x: Math.max(10, Math.min(e.clientX - rect.left + 15, rect.width - 240)),
      y: Math.max(10, Math.min(e.clientY - rect.top - 40, rect.height - 160)),
    });
  };

  // Map canvas dimensions
  const width = 680;
  const height = 720;

  const geoData = useMemo(() => getNationalGeography(), []);
  const constituencyPins = useMemo(() => getConstituencyPins(), []);

  // D3 Geo Mercator dynamic projection fitting to Survey of India GeoJSON bounds
  const { pathGenerator, projection } = useMemo(() => {
    const padding = 24;
    const proj = d3
      .geoMercator()
      .fitExtent(
        [
          [padding, padding],
          [width - padding, height - padding],
        ],
        geoData
      );

    const path = d3.geoPath().projection(proj);
    return { pathGenerator: path, projection: proj };
  }, [width, height, geoData]);

  const metricLayers = [
    { id: "risk", label: "Composite Risk Score", desc: "Multi-factor AI anomaly index (0-100)" },
    { id: "utilisation", label: "Fund Utilisation %", desc: "Total PFMS disbursed vs. authorized allocation" },
    { id: "completion", label: "Completion Rate %", desc: "Percentage of sanctioned works completed" },
    { id: "alerts", label: "Alert Volume Density", desc: "Total active spatial, cartel & compliance alerts" },
  ];

  const handleStateClick = (feature) => {
    const stateName = feature.properties.name;
    // If user clicks Madhya Pradesh, auto-focus Bhopal demonstration
    if (stateName === "Madhya Pradesh") {
      setSelectedConstituencyId("c1");
    } else {
      // Find a matching constituency in this state or focus first one
      const match = constituencyPins.find(
        (c) => c.state.toLowerCase() === stateName.toLowerCase()
      );
      if (match) {
        setSelectedConstituencyId(match.id);
      }
    }
  };

  const handleConstituencyClick = (constituency) => {
    setSelectedConstituencyId(constituency.id);
  };

  const handleDrilldownVendor = () => {
    setSelectedVendorId("v1"); // Aarav Infra Projects
    setDemoStep(2);
    navigate("/vendors");
  };

  const handleDrilldownIDA = () => {
    setRole("ida");
    setDemoStep(3);
    navigate("/ida");
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#090e1b] shadow-2xl">
      {/* Top Map Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-900/80 p-3 sm:px-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-sky-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            India National Risk Choropleth & GIS
          </span>
          <span className="hidden md:inline-flex items-center gap-1 rounded bg-sky-500/10 px-2 py-0.5 text-[10px] font-mono text-sky-400 border border-sky-500/20">
            Survey of India Administrative Boundaries
          </span>
        </div>

        {/* Metric Layer Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/90 p-1">
          {metricLayers.map((l) => (
            <button
              key={l.id}
              onClick={() => setMetricLayer(l.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                metricLayer === l.id
                  ? "bg-sky-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
              title={l.desc}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area: Map Viewport on Left, Side-by-Side Inspection Panel on Right */}
      <div className="relative flex flex-col min-[1360px]:flex-row items-stretch">
        {/* Left/Main Column: Unobstructed Map Viewport + Dedicated Legend Bar */}
        <div className="flex-1 min-w-0 flex flex-col bg-[#090e1b]">
          {/* SVG GIS Canvas Container - Dedicated Unobstructed Viewport */}
          <div
            ref={mapContainerRef}
            className="relative flex-1 min-h-[460px] flex items-center justify-center p-3 sm:p-5 overflow-hidden"
          >
            <div className="relative w-full max-w-[640px] flex items-center justify-center">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-auto max-h-[640px] max-w-[640px] select-none block aspect-[680/720]"
                role="img"
                aria-label="National risk geographic choropleth of India with Survey of India administrative boundaries"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredFeature(null)}
              >
          <defs>
            {/* Background cartographic ambient glow */}
            <radialGradient id="nationalGlow" cx="50%" cy="48%" r="65%">
              <stop offset="0%" stopColor="rgba(14, 165, 233, 0.08)" />
              <stop offset="60%" stopColor="rgba(15, 23, 42, 0.3)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            {/* Subtle grid pattern */}
            <pattern id="geoGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="0.8" />
            </pattern>
          </defs>

          <rect width={width} height={height} fill="url(#nationalGlow)" />
          <rect width={width} height={height} fill="url(#geoGrid)" />

          {/* Real India State Boundary Paths */}
          <g className="states-layer">
            {geoData.features.map((feature, idx) => {
              const stateName = feature.properties.name;
              const metric = getStateMetric(stateName);
              const val = getMetricValue(metricLayer, metric);
              const fillColor = getMetricColor(metricLayer, val);
              const isHovered = hoveredFeature?.properties?.name === stateName;
              const isSelectedState =
                selectedConstituency?.state.toLowerCase() === stateName.toLowerCase();

              const pathD = pathGenerator(feature);
              if (!pathD) return null;

              return (
                <path
                  key={feature.id || `${stateName}-${idx}`}
                  d={pathD}
                  fill={fillColor}
                  stroke={isSelectedState ? "#38bdf8" : isHovered ? "#ffffff" : "rgba(255, 255, 255, 0.18)"}
                  strokeWidth={isSelectedState ? 2.2 : isHovered ? 1.5 : 0.75}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() =>
                    setHoveredFeature({
                      properties: {
                        name: stateName,
                        ...metric,
                      },
                    })
                  }
                  onClick={() => handleStateClick(feature)}
                />
              );
            })}
          </g>

          {/* Key Parliamentary Constituencies Geographic Pins */}
          {showConstituencyPins && (
            <g className="constituency-pins-layer">
              {constituencyPins.map((c) => {
                const coords = projection([c.lng, c.lat]);
                if (!coords) return null;
                const [cx, cy] = coords;
                const isSelected = selectedConstituencyId === c.id;
                const isCritical = c.risk >= 70;

                return (
                  <g
                    key={c.id}
                    className="cursor-pointer transition-transform duration-200 hover:scale-125"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConstituencyClick(c);
                    }}
                    onMouseEnter={() =>
                      setHoveredFeature({
                        isConstituency: true,
                        properties: {
                          name: `${c.name} (Constituency)`,
                          state: c.state,
                          risk: c.risk,
                          utilisation: c.utilisation,
                          completion: c.completion,
                          alerts: c.alerts,
                          mpName: c.mpName,
                        },
                      })
                    }
                  >
                    {/* Animated Ping Ring for Bhopal / Critical */}
                    {isSelected && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r="14"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2"
                        strokeDasharray="3 3"
                        className="animate-spin-slow"
                      />
                    )}

                    {/* Outer marker ring */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 6 : isCritical ? 4.5 : 3.5}
                      fill={isCritical ? "#f43f5e" : "#0ea5e9"}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 2 : 1}
                      className="drop-shadow-lg"
                    />

                    {/* Constituency Label */}
                    {(isSelected || isCritical || c.name === "Bhopal") && (
                      <text
                        x={cx}
                        y={cy - 8}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="700"
                        className="pointer-events-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                      >
                        {c.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}
        </svg>

        {/* Interactive Floating Hover Tooltip */}
        {hoveredFeature && (
          <div
            className="pointer-events-none absolute z-30 rounded-xl border border-slate-700 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl text-xs space-y-1.5 transition-all duration-75"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
            }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5">
              <span className="font-bold text-white text-sm">
                {hoveredFeature.properties.name}
              </span>
              <Badge tone={riskTone(hoveredFeature.properties.risk)}>
                Risk {hoveredFeature.properties.risk}/100
              </Badge>
            </div>

            {hoveredFeature.properties.mpName && (
              <p className="text-[11px] text-sky-400 font-medium">
                MP: {hoveredFeature.properties.mpName}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
              <div>
                <span className="text-slate-400">Utilisation:</span>{" "}
                <strong className="text-emerald-400 font-bold">
                  {hoveredFeature.properties.utilisation}%
                </strong>
              </div>
              <div>
                <span className="text-slate-400">Completion:</span>{" "}
                <strong className="text-sky-400 font-bold">
                  {hoveredFeature.properties.completion}%
                </strong>
              </div>
              <div>
                <span className="text-slate-400">Alerts:</span>{" "}
                <strong className="text-rose-400 font-bold">
                  {hoveredFeature.properties.alerts} Flagged
                </strong>
              </div>
              <div>
                <span className="text-slate-400">Layer:</span>{" "}
                <span className="text-slate-200 uppercase font-semibold">
                  {metricLayer}
                </span>
              </div>
            </div>
          </div>
        )}
            </div>
          </div>

          {/* Dedicated Non-Overlapping Legend & Controls Bar */}
          <div className="border-t border-slate-800/80 bg-slate-950/85 px-4 py-2.5 backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Metric & Swatches */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {metricLayers.find((l) => l.id === metricLayer)?.label}:
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-4 rounded bg-rose-500 shadow-sm shadow-rose-500/30 shrink-0" />
                  <span className="text-slate-300 text-[11px] font-medium">High Risk (≥ 70)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-4 rounded bg-amber-500 shadow-sm shadow-amber-500/30 shrink-0" />
                  <span className="text-slate-300 text-[11px]">Elevated (45–69)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-4 rounded bg-emerald-500 shadow-sm shadow-emerald-500/30 shrink-0" />
                  <span className="text-slate-300 text-[11px]">Compliant (&lt; 45)</span>
                </div>
              </div>

              {/* Pin Toggle & Hint */}
              <div className="flex items-center gap-3 ml-auto">
                <span className="hidden md:inline text-[11px] text-slate-400">
                  Click <strong className="text-slate-200">Madhya Pradesh</strong> or pin to inspect
                </span>
                <button
                  type="button"
                  onClick={() => setShowConstituencyPins(!showConstituencyPins)}
                  className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1 rounded-md border border-sky-500/20 transition cursor-pointer"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {showConstituencyPins ? "Hide Pins" : "Show Pins"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Side-by-Side (Desktop) or Stacked Below (Smaller Desktop / Tablet) Inspection Panel */}
        {selectedConstituency && (
          <div className="w-full min-[1360px]:w-[380px] shrink-0 border-t min-[1360px]:border-t-0 min-[1360px]:border-l border-slate-800 bg-[#0c1220]/98 p-5 backdrop-blur-2xl shadow-2xl min-[1360px]:overflow-y-auto min-[1360px]:max-h-[740px] transition-all">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {selectedConstituency.state} · {selectedConstituency.district}
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">
                  {selectedConstituency.name}
                </h2>
                <p className="text-xs text-sky-400 font-medium">
                  MP: {selectedConstituency.mpName}
                </p>
              </div>
              <button
                onClick={() => setSelectedConstituencyId(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                title="Close Panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={riskTone(selectedConstituency.risk)}>
                Composite Risk: {selectedConstituency.risk}/100 ({riskLabel(selectedConstituency.risk)})
              </Badge>
              <Badge tone={selectedConstituency.alerts > 8 ? "critical" : "info"}>
                {selectedConstituency.alerts} Flagged Alerts
              </Badge>
            </div>

            {/* Key Metric Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
                <span className="text-slate-400">Fund Utilisation</span>
                <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                  {selectedConstituency.utilisation}%
                </div>
              </div>
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
                <span className="text-slate-400">Physical Completion</span>
                <div className="text-lg font-bold text-sky-400 font-mono mt-0.5">
                  {selectedConstituency.completion}%
                </div>
              </div>
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
                <span className="text-slate-400">Total Authorised</span>
                <div className="text-lg font-bold text-white font-mono mt-0.5">
                  ₹{selectedConstituency.totalFundsCr.toFixed(1)} Cr
                </div>
              </div>
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
                <span className="text-slate-400">Unspent Balance</span>
                <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
                  ₹{selectedConstituency.unspentCr.toFixed(1)} Cr
                </div>
              </div>
            </div>

            {/* Top Flagged Risk Factors */}
            <div className="space-y-2 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 text-xs">
              <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">
                Dominant Risk Factors (AI Flagged)
              </span>
              <ul className="space-y-1.5 text-slate-300">
                <li className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  <span>Vendor cartel collusion: Aarav Infra & Narmada Civil</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>Spatial duplicate asset flagged in Berasia (180m cell)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <span>SC allocation shortfall (11.2% actual vs 15% mandate)</span>
                </li>
              </ul>
            </div>

            {/* Connected Action Buttons for Demo Flow */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <Button
                variant="critical"
                size="sm"
                className="w-full justify-center"
                onClick={handleDrilldownVendor}
              >
                Inspect High-Risk Vendor Network →
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center"
                onClick={handleDrilldownIDA}
              >
                Switch to IDA Sanction Triage
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
