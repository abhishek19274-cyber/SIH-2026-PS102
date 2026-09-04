import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { mpProjects } from "../../data/mockData";

// Helper to generate color-coded circular marker icons
const createCustomIcon = (stage) => {
  const color =
    stage === "Completed"
      ? "#10b981"
      : stage === "In Progress"
      ? "#0ea5e9"
      : stage === "Sanctioned"
      ? "#6366f1"
      : "#f59e0b";

  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 2.5px solid #ffffff;
        box-shadow: 0 0 10px ${color};
      "></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
};

export function ConstituencyMap({ projects, height = 340 }) {
  const displayProjects = projects?.length ? projects : mpProjects;
  const bhopalCenter = [23.2599, 77.4126];

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-inner z-0"
      style={{ height }}
    >
      <MapContainer
        center={bhopalCenter}
        zoom={11}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {displayProjects.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={createCustomIcon(p.stage)}
          >
            <Popup className="custom-popup">
              <div className="p-1 text-slate-900">
                <h4 className="font-bold text-sm text-slate-950">{p.name}</h4>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs font-semibold text-sky-700">₹{p.amountCr} Cr</span>
                  <span className="text-xs text-slate-600">· {p.stage}</span>
                </div>
                <div className="mt-1.5 text-[11px] text-slate-500">
                  Target: {p.expectedDate}
                  {p.delayDays > 0 && (
                    <span className="text-rose-600 font-bold ml-1">
                      (Delayed {p.delayDays}d)
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                    Risk Score: {p.risk}/100
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Status Indicator Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] rounded-xl border border-slate-800/80 bg-slate-950/85 p-2.5 backdrop-blur-md text-[11px] space-y-1">
        <div className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
          Work Stages (Bhopal)
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Completed
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> In Progress
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" /> Sanctioned
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Recommended
          </span>
        </div>
      </div>
    </div>
  );
}
