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
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid #ffffff;
      "></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -8],
  });
};

export function ConstituencyMap({ projects, height = 340 }) {
  const displayProjects = projects?.length ? projects : mpProjects;
  const bhopalCenter = [23.2599, 77.4126];

  return (
    <div
      className="relative overflow-hidden rounded border border-[#D9DDE3] bg-[#F5F6F8] z-0"
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
              <div className="p-1 text-[#17202A]">
                <h4 className="font-bold text-xs text-[#17202A]">{p.name}</h4>
                <div className="mt-1 flex items-center gap-2 font-mono">
                  <span className="text-xs font-semibold text-blue-700">₹{p.amountCr} Cr</span>
                  <span className="text-xs text-[#5B6470]">· {p.stage}</span>
                </div>
                <div className="mt-1 text-[10px] text-[#5B6470]">
                  Target: {p.expectedDate}
                  {p.delayDays > 0 && (
                    <span className="text-rose-600 font-bold ml-1">
                      (Delayed {p.delayDays}d)
                    </span>
                  )}
                </div>
                <div className="mt-1.5">
                  <span className="inline-block rounded-sm bg-[#F0F2F5] px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#17202A] border border-[#D9DDE3]">
                    Risk Score: {p.risk}/100
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Status Indicator Legend */}
      <div className="absolute bottom-2 left-2 z-[1000] rounded border border-[#D9DDE3] bg-white/95 px-3 py-2 backdrop-blur shadow-sm text-[10px] space-y-1">
        <div className="font-mono uppercase tracking-wider text-[#7A838E] text-[9px] font-semibold">
          Work Stages (Bhopal)
        </div>
        <div className="flex items-center gap-2.5 font-mono">
          <span className="flex items-center gap-1 text-[#5B6470]">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Completed
          </span>
          <span className="flex items-center gap-1 text-[#5B6470]">
            <span className="h-2 w-2 rounded-full bg-sky-500" /> In Progress
          </span>
          <span className="flex items-center gap-1 text-[#5B6470]">
            <span className="h-2 w-2 rounded-full bg-indigo-500" /> Sanctioned
          </span>
          <span className="flex items-center gap-1 text-[#5B6470]">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Recommended
          </span>
        </div>
      </div>
    </div>
  );
}
