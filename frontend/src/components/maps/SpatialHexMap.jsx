import React, { useState, useMemo, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Polyline,
  Circle,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  getExistingAssets,
  getEcologicalBuffers,
  getInfrastructureCorridors,
  CONFLICT_THRESHOLD_METERS,
} from "../../services/spatialService";
import { cn } from "../../utils/formatters";
import { Layers, Navigation, Map } from "lucide-react";

// Available public basemaps that require NO API key and work reliably out of the box
const BASEMAP_CONFIGS = {
  osm: {
    id: "osm",
    name: "OpenStreetMap",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  esriStreet: {
    id: "esriStreet",
    name: "Esri World Street",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS",
    maxZoom: 18,
  },
};

// SVG DivIcon generator for crisp GIS markers
function createIcon({ color, isProposed = false, isConflict = false }) {
  if (isProposed) {
    const ringColor = isConflict ? "#f43f5e" : "#10b981";
    return L.divIcon({
      className: "custom-proposed-marker",
      html: `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute;
            width: 32px; height: 32px;
            border-radius: 50%;
            background-color: ${ringColor};
            opacity: 0.25;
          "></div>
          <div style="
            position: relative;
            width: 22px; height: 22px;
            border-radius: 50%;
            background: #ffffff;
            border: 3px solid ${ringColor};
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: ${ringColor};"></div>
          </div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -17],
    });
  }

  return L.divIcon({
    className: "custom-existing-marker",
    html: `
      <div style="
        width: 16px; height: 16px;
        border-radius: 50%;
        background-color: ${color};
        border: 2.5px solid #ffffff;
        box-shadow: 0 2px 5px rgba(0,0,0,0.4);
      "></div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  });
}

// Controller component to handle map clicks and smooth preset transitions
function MapInteractionHandler({ onMapClick, targetCoords }) {
  const map = useMap();

  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (targetCoords) {
      const center = map.getCenter();
      const dist =
        Math.abs(center.lat - targetCoords.lat) +
        Math.abs(center.lng - targetCoords.lng);
      // Only flyTo when position shifts noticeably (preset selection or relocation)
      if (dist > 0.01) {
        map.flyTo([targetCoords.lat, targetCoords.lng], 13, { duration: 1.0 });
      }
    }
  }, [targetCoords, map]);

  return null;
}

export function SpatialHexMap({
  proposedCoords,
  conflictData,
  onLocationChange,
  height = 500,
}) {
  const [selectedBasemap, setSelectedBasemap] = useState("osm");
  const [layers, setLayers] = useState({
    existingMplads: true,
    ecoBuffers: true,
    corridors: true,
    proximityBuffer: true,
  });

  const existingAssets = useMemo(() => getExistingAssets(), []);
  const ecologicalBuffers = useMemo(() => getEcologicalBuffers(), []);
  const corridors = useMemo(() => getInfrastructureCorridors(), []);

  const isConflict =
    conflictData?.status === "critical" || conflictData?.status === "restricted";

  const proposedMarkerIcon = useMemo(() => {
    return createIcon({
      color: isConflict ? "#f43f5e" : "#10b981",
      isProposed: true,
      isConflict,
    });
  }, [isConflict]);

  const activeBasemap = BASEMAP_CONFIGS[selectedBasemap] || BASEMAP_CONFIGS.osm;

  return (
    <div className="relative overflow-hidden rounded border border-[#D9DDE3] bg-white shadow-sm">
      {/* High-Density GIS Layer Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#D9DDE3] bg-[#F8FAFC] p-2.5 sm:px-3.5">
        {/* Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#7A838E]">
            <Layers className="h-3.5 w-3.5 text-blue-600" />
            Layers:
          </span>

          <button
            type="button"
            onClick={() =>
              setLayers((s) => ({ ...s, existingMplads: !s.existingMplads }))
            }
            className={cn(
              "rounded-sm border px-2.5 py-1 text-xs font-semibold transition-colors flex items-center gap-1.5",
              layers.existingMplads
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-[#D9DDE3] bg-white text-[#5B6470] hover:text-[#17202A]"
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Existing Assets ({existingAssets.length})
          </button>

          <button
            type="button"
            onClick={() =>
              setLayers((s) => ({ ...s, ecoBuffers: !s.ecoBuffers }))
            }
            className={cn(
              "rounded-sm border px-2.5 py-1 text-xs font-semibold transition-colors flex items-center gap-1.5",
              layers.ecoBuffers
                ? "border-amber-300 bg-amber-50 text-amber-800"
                : "border-[#D9DDE3] bg-white text-[#5B6470] hover:text-[#17202A]"
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
            Eco Buffer
          </button>

          <button
            type="button"
            onClick={() =>
              setLayers((s) => ({ ...s, corridors: !s.corridors }))
            }
            className={cn(
              "rounded-sm border px-2.5 py-1 text-xs font-semibold transition-colors flex items-center gap-1.5",
              layers.corridors
                ? "border-blue-300 bg-blue-50 text-blue-800"
                : "border-[#D9DDE3] bg-white text-[#5B6470] hover:text-[#17202A]"
            )}
          >
            <span className="h-1 w-2.5 bg-blue-600 rounded-sm" />
            Freight Corridor
          </button>

          <button
            type="button"
            onClick={() =>
              setLayers((s) => ({
                ...s,
                proximityBuffer: !s.proximityBuffer,
              }))
            }
            className={cn(
              "rounded-sm border px-2.5 py-1 text-xs font-semibold transition-colors flex items-center gap-1.5",
              layers.proximityBuffer
                ? "border-blue-300 bg-blue-50 text-blue-800"
                : "border-[#D9DDE3] bg-white text-[#5B6470] hover:text-[#17202A]"
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full border border-blue-600" />
            200m Buffer Ring
          </button>
        </div>

        {/* Basemap Selection & Interaction Hint */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#5B6470]">
            <Map className="h-3.5 w-3.5 text-[#7A838E]" />
            <span className="text-[10px] font-medium uppercase text-[#7A838E]">Basemap:</span>
            <select
              value={selectedBasemap}
              onChange={(e) => setSelectedBasemap(e.target.value)}
              className="rounded-sm border border-[#D9DDE3] bg-white px-2 py-0.5 text-xs text-[#17202A] focus:border-blue-600 focus:outline-none"
            >
              <option value="osm">OpenStreetMap</option>
              <option value="esriStreet">Esri World Street</option>
            </select>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[10px] text-[#5B6470] font-mono">
            <Navigation className="h-3 w-3 text-blue-600" />
            <span>Click map / drag pin</span>
          </div>
        </div>
      </div>

      {/* Dominant Leaflet GIS Map Canvas */}
      <div
        className="relative overflow-hidden bg-[#EAEFF5] z-0"
        style={{ height }}
      >
        <MapContainer
          key={activeBasemap.id}
          center={[proposedCoords.lat, proposedCoords.lng]}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          {/* Active Public Basemap (No API key required) */}
          <TileLayer
            attribution={activeBasemap.attribution}
            url={activeBasemap.url}
            maxZoom={activeBasemap.maxZoom}
          />

          <MapInteractionHandler
            onMapClick={onLocationChange}
            targetCoords={proposedCoords}
          />

          {/* Regional Ecological Buffer Polygons (Representative Demo Layer) */}
          {layers.ecoBuffers &&
            ecologicalBuffers.map((eco) => (
              <Polygon
                key={eco.id}
                positions={eco.coordinates}
                pathOptions={{
                  color: "#d97706",
                  fillColor: "#f59e0b",
                  fillOpacity: 0.2,
                  weight: 2,
                  dashArray: "6,6",
                }}
              >
                <Popup>
                  <div className="p-1 text-slate-100 text-xs">
                    <span className="text-[10px] uppercase font-bold text-amber-400">
                      Protected Environmental Buffer
                    </span>
                    <h5 className="font-bold text-white mt-0.5">{eco.name}</h5>
                    <p className="mt-1 text-[11px] text-slate-300">
                      Classification: {eco.restrictionType}
                    </p>
                    <p className="mt-1 text-[10px] text-amber-300 font-medium">
                      Requirement: Environmental clearance required
                    </p>
                  </div>
                </Popup>
              </Polygon>
            ))}

          {/* Planned Infrastructure Logistics Corridors (Representative Demo Layer) */}
          {layers.corridors &&
            corridors.map((corridor) => (
              <React.Fragment key={corridor.id}>
                <Polyline
                  positions={corridor.coordinates}
                  pathOptions={{
                    color: "#0284c7",
                    weight: 3.5,
                    dashArray: "8,6",
                    opacity: 0.9,
                  }}
                >
                  <Popup>
                    <div className="p-1 text-slate-100 text-xs">
                      <span className="text-[10px] uppercase font-bold text-sky-400">
                        Planned Transport Corridor
                      </span>
                      <h5 className="font-bold text-white mt-0.5">{corridor.name}</h5>
                      <p className="mt-1 text-[11px] text-slate-300">
                        {corridor.corridorType}
                      </p>
                      <p className="text-[10px] text-sky-300 font-mono mt-0.5">
                        Buffer setback: {corridor.widthMeters}m
                      </p>
                    </div>
                  </Popup>
                </Polyline>
              </React.Fragment>
            ))}

          {/* Existing MPLADS Works Markers */}
          {layers.existingMplads &&
            existingAssets.map((asset) => {
              const markerColor =
                asset.status === "Completed"
                  ? "#10b981"
                  : asset.status === "In Progress"
                  ? "#0ea5e9"
                  : "#f59e0b";

              const icon = createIcon({ color: markerColor });

              return (
                <React.Fragment key={asset.id}>
                  <Marker position={[asset.lat, asset.lng]} icon={icon}>
                    <Popup>
                      <div className="p-1 text-slate-100 text-xs">
                        <span className="text-[10px] uppercase font-bold text-emerald-400">
                          Existing District Asset
                        </span>
                        <h4 className="font-bold text-white text-sm mt-0.5">
                          {asset.name}
                        </h4>
                        <div className="mt-1 text-[11px] text-slate-300">
                          {asset.category} · Completed {asset.completionYear}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between font-mono text-[11px] border-t border-slate-700 pt-1">
                          <span className="font-bold text-emerald-400">₹{asset.costCr} Cr</span>
                          <span className="text-slate-400">H3 #{asset.h3CellId}</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>

                  {/* 200m Proximity Buffer Circle around existing asset */}
                  {layers.proximityBuffer && (
                    <Circle
                      center={[asset.lat, asset.lng]}
                      radius={CONFLICT_THRESHOLD_METERS}
                      pathOptions={{
                        color: markerColor,
                        fillColor: markerColor,
                        fillOpacity: 0.08,
                        weight: 1.2,
                        dashArray: "4,4",
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}

          {/* Proposed Work Project Location Marker */}
          <Marker
            position={[proposedCoords.lat, proposedCoords.lng]}
            icon={proposedMarkerIcon}
            draggable={true}
            eventHandlers={{
              dragend(e) {
                const marker = e.target;
                const pos = marker.getLatLng();
                onLocationChange(pos.lat, pos.lng);
              },
            }}
          >
            <Popup>
              <div className="p-1 text-slate-100 text-xs">
                <span className="text-[10px] uppercase font-bold text-rose-400">
                  Target Work Proposal
                </span>
                <h4 className="font-bold text-white text-sm mt-0.5">
                  Proposed Work Location
                </h4>
                <div className="mt-1 text-[11px] font-mono text-slate-300">
                  {proposedCoords.lat.toFixed(5)}° N, {proposedCoords.lng.toFixed(5)}° E
                </div>
                <div className="mt-1.5 font-bold text-xs border-t border-slate-700 pt-1">
                  Appraisal:{" "}
                  <span
                    className={
                      isConflict ? "text-rose-400" : "text-emerald-400"
                    }
                  >
                    {conflictData?.badgeText || "Evaluating..."}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Proposed Location 200m Proximity Radius Ring */}
          {layers.proximityBuffer && (
            <Circle
              center={[proposedCoords.lat, proposedCoords.lng]}
              radius={CONFLICT_THRESHOLD_METERS}
              pathOptions={{
                color: isConflict ? "#f43f5e" : "#10b981",
                fillColor: isConflict ? "#f43f5e" : "#10b981",
                fillOpacity: 0.16,
                weight: 2,
              }}
            />
          )}
        </MapContainer>

        {/* GPS Coordinates & Cell ID Readout - Bottom Left */}
        <div className="absolute bottom-2.5 left-2.5 z-[1000] rounded-sm border border-[#D9DDE3] bg-white/95 px-2.5 py-1.5 text-[10px] font-mono text-[#17202A] shadow-md backdrop-blur-sm">
          <div className="text-[8px] uppercase tracking-wider text-[#7A838E] font-bold">
            Target Coordinates
          </div>
          <div className="flex items-center gap-2.5 mt-0.5">
            <span className="text-[#17202A] font-bold tabular-nums">
              {proposedCoords.lat.toFixed(5)}° N, {proposedCoords.lng.toFixed(5)}° E
            </span>
            <span className="text-blue-700 font-semibold">
              H3: #{conflictData?.h3CellId || "89a12c8b3"}
            </span>
          </div>
        </div>

        {/* Map Legend - Bottom Right */}
        <div className="absolute bottom-2.5 right-2.5 z-[1000] rounded-sm border border-[#D9DDE3] bg-white/95 p-2 text-[9px] font-mono space-y-1 shadow-md text-[#5B6470] backdrop-blur-sm">
          <div className="font-bold text-[#7A838E] uppercase tracking-wider text-[8px]">
            GIS Legend
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full border border-white bg-red-600 shrink-0" />
            <span className="text-[#17202A]">Target Proposal Pin</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
            <span>Completed Asset</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
            <span>In-Progress Asset</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1 w-2.5 border-t border-dashed border-amber-500 shrink-0" />
            <span>Eco Buffer (200m)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
