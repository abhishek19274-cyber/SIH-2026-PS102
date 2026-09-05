import React, { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as d3 from "d3";
import { X, AlertTriangle, MapPin } from "lucide-react";
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
    <div className="rounded border border-[#D9DDE3] bg-white shadow-sm overflow-hidden">
      {/* Top Header & Layer Toolbar */}
      <div className="p-3 sm:p-4 border-b border-[#D9DDE3] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-sm border border-blue-200">
              NATIONAL GIS SURFACE
            </span>
            <h2 className="text-sm sm:text-base font-semibold text-[#17202A]">
              India National Geographic Risk Heatmap (MoSPI Nodal Oversight)
            </h2>
          </div>
          <p className="text-xs text-[#5B6470] mt-0.5">
            Survey of India boundary dataset. Click any state or flagged constituency to inspect risk factors, capital utilisation, and anomalous works.
          </p>
        </div>

        {/* Metric Layer Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1 rounded-sm border border-[#D9DDE3] bg-[#F0F2F5] p-0.5">
          {metricLayers.map((l) => (
            <button
              key={l.id}
              onClick={() => setMetricLayer(l.id)}
              className={`rounded-sm px-2.5 py-1 text-xs font-semibold transition-colors ${
                metricLayer === l.id
                  ? "bg-white text-blue-700 shadow-sm border border-[#D9DDE3]"
                  : "text-[#5B6470] hover:text-[#17202A]"
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
        <div className="flex-1 min-w-0 flex flex-col bg-[#F8FAFC]">
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
                  stroke={isSelectedState ? "#2563EB" : isHovered ? "#17202A" : "#FFFFFF"}
                  strokeWidth={isSelectedState ? 2.5 : isHovered ? 1.5 : 0.8}
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
                    {/* Animated Ping Ring for Bhopal / Selected */}
                    {isSelected && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r="14"
                        fill="none"
                        stroke="#2563EB"
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
                      fill={isCritical ? "#DC2626" : "#2563EB"}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 2 : 1}
                      className="shadow-sm"
                    />

                    {/* Constituency Label with crisp white stroke halo for light mode readability */}
                    {(isSelected || isCritical || c.name === "Bhopal") && (
                      <text
                        x={cx}
                        y={cy - 8}
                        textAnchor="middle"
                        fill="#17202A"
                        stroke="#FFFFFF"
                        strokeWidth="3"
                        paintOrder="stroke fill"
                        fontSize="9"
                        fontWeight="700"
                        className="pointer-events-none"
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
            className="pointer-events-none absolute z-30 rounded-sm border border-[#D9DDE3] bg-white p-2.5 shadow-lg text-xs space-y-1 transition-all duration-75"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
            }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#D9DDE3] pb-1">
              <span className="font-bold text-[#17202A] text-xs">
                {hoveredFeature.properties.name}
              </span>
              <Badge tone={riskTone(hoveredFeature.properties.risk)}>
                Risk {hoveredFeature.properties.risk}
              </Badge>
            </div>

            {hoveredFeature.properties.mpName && (
              <p className="text-[10px] text-blue-700 font-medium">
                MP: {hoveredFeature.properties.mpName}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 font-mono text-[10px] pt-0.5">
              <div>
                <span className="text-[#7A838E]">Utilisation:</span>{" "}
                <strong className="text-emerald-700 font-bold tabular-nums">
                  {hoveredFeature.properties.utilisation}%
                </strong>
              </div>
              <div>
                <span className="text-[#7A838E]">Completion:</span>{" "}
                <strong className="text-blue-700 font-bold tabular-nums">
                  {hoveredFeature.properties.completion}%
                </strong>
              </div>
              <div>
                <span className="text-[#7A838E]">Alerts:</span>{" "}
                <strong className="text-red-700 font-bold tabular-nums">
                  {hoveredFeature.properties.alerts}
                </strong>
              </div>
              <div>
                <span className="text-[#7A838E]">Layer:</span>{" "}
                <span className="text-[#17202A] uppercase font-semibold">
                  {metricLayer}
                </span>
              </div>
            </div>
          </div>
        )}
            </div>
          </div>

          {/* Dedicated Non-Overlapping Legend & Controls Bar */}
          <div className="border-t border-[#D9DDE3] bg-white px-3.5 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
              {/* Metric & Swatches */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A838E]">
                  {metricLayers.find((l) => l.id === metricLayer)?.label}:
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-3 rounded-sm bg-red-600 shrink-0" />
                  <span className="text-[#5B6470] text-[10px] font-medium">High Risk (≥ 70)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-3 rounded-sm bg-amber-500 shrink-0" />
                  <span className="text-[#5B6470] text-[10px]">Elevated (45–69)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-3 rounded-sm bg-slate-300 shrink-0" />
                  <span className="text-[#5B6470] text-[10px]">Compliant (&lt; 45)</span>
                </div>
              </div>

              {/* Pin Toggle & Hint */}
              <div className="flex items-center gap-2.5 ml-auto">
                <span className="hidden md:inline text-[10px] text-[#7A838E]">
                  Click <strong className="text-[#17202A]">Madhya Pradesh</strong> or pin to inspect
                </span>
                <button
                  type="button"
                  onClick={() => setShowConstituencyPins(!showConstituencyPins)}
                  className="text-[10px] text-blue-700 hover:text-blue-800 flex items-center gap-1 font-semibold bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-sm border border-blue-200 transition-colors cursor-pointer"
                >
                  <MapPin className="h-3 w-3" />
                  {showConstituencyPins ? "Hide Pins" : "Show Pins"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Side-by-Side Inspection Panel */}
        {selectedConstituency && (
          <div className="w-full min-[1360px]:w-[360px] shrink-0 border-t min-[1360px]:border-t-0 min-[1360px]:border-l border-[#D9DDE3] bg-white p-4 min-[1360px]:overflow-y-auto min-[1360px]:max-h-[740px]">
          <div className="space-y-3.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7A838E]">
                  {selectedConstituency.state} · {selectedConstituency.district}
                </span>
                <h2 className="text-base font-bold text-[#17202A] mt-0.5">
                  {selectedConstituency.name}
                </h2>
                <p className="text-xs text-blue-700 font-medium">
                  MP: {selectedConstituency.mpName}
                </p>
              </div>
              <button
                onClick={() => setSelectedConstituencyId(null)}
                className="rounded-sm p-1 text-[#7A838E] hover:bg-gray-100 hover:text-[#17202A] transition-colors"
                title="Close Panel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={riskTone(selectedConstituency.risk)}>
                Risk: {selectedConstituency.risk}/100 ({riskLabel(selectedConstituency.risk)})
              </Badge>
              <Badge tone={selectedConstituency.alerts > 8 ? "critical" : "info"}>
                {selectedConstituency.alerts} Active Alerts
              </Badge>
            </div>

            {/* Key Metric Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-sm border border-[#D9DDE3] bg-[#F0F2F5] p-2.5">
                <span className="text-[10px] uppercase tracking-wider text-[#7A838E] font-bold">Fund Utilisation</span>
                <div className="text-base font-bold text-emerald-700 font-mono mt-0.5 tabular-nums">
                  {selectedConstituency.utilisation}%
                </div>
              </div>
              <div className="rounded-sm border border-[#D9DDE3] bg-[#F0F2F5] p-2.5">
                <span className="text-[10px] uppercase tracking-wider text-[#7A838E] font-bold">Completion</span>
                <div className="text-base font-bold text-blue-700 font-mono mt-0.5 tabular-nums">
                  {selectedConstituency.completion}%
                </div>
              </div>
              <div className="rounded-sm border border-[#D9DDE3] bg-[#F0F2F5] p-2.5">
                <span className="text-[10px] uppercase tracking-wider text-[#7A838E] font-bold">Authorised</span>
                <div className="text-base font-bold text-[#17202A] font-mono mt-0.5 tabular-nums">
                  ₹{selectedConstituency.totalFundsCr.toFixed(1)} Cr
                </div>
              </div>
              <div className="rounded-sm border border-[#D9DDE3] bg-[#F0F2F5] p-2.5">
                <span className="text-[10px] uppercase tracking-wider text-[#7A838E] font-bold">Unspent</span>
                <div className="text-base font-bold text-amber-700 font-mono mt-0.5 tabular-nums">
                  ₹{selectedConstituency.unspentCr.toFixed(1)} Cr
                </div>
              </div>
            </div>

            {/* Top Flagged Risk Factors */}
            <div className="space-y-1.5 rounded-sm border border-[#D9DDE3] bg-[#F0F2F5] p-2.5 text-xs">
              <span className="font-bold uppercase tracking-wider text-[#7A838E] text-[10px]">
                Dominant AI Anomaly Signatures
              </span>
              <ul className="space-y-1 text-[#17202A] text-xs">
                <li className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                  <span>Vendor cartel collusion: Aarav Infra & Narmada Civil</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>Spatial duplicate asset in Berasia (180m cell)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>SC allocation shortfall (11.2% actual vs 15% mandate)</span>
                </li>
              </ul>
            </div>

            {/* Connected Action Buttons for Demo Flow */}
            <div className="space-y-1.5 pt-2 border-t border-[#D9DDE3]">
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
