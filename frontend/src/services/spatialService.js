/**
 * Spatial Verification & PM GatiShakti Service
 * 
 * Implements real geographic coordinate math, Haversine distance calculations,
 * and spatial collision detection against existing MPLADS works and PM GatiShakti layers.
 * Decoupled from UI components for future integration with official GIS backend APIs.
 */

export const CONFLICT_THRESHOLD_METERS = 200; // ~180-200m corresponding to H3 resolution-9 cell
export const CORRIDOR_BUFFER_METERS = 120;

// Existing MPLADS infrastructure assets in Bhopal/Berasia demonstration sector
export const existingAssets = [
  {
    id: "asset-001",
    name: "Community Hall (Berasia Ward 4)",
    status: "Completed",
    completionYear: 2024,
    costCr: 0.45,
    category: "Community Assets",
    agency: "Bhopal Municipal Corporation",
    h3CellId: "89a12c8b3",
    lat: 23.6342,
    lng: 77.4331,
  },
  {
    id: "asset-002",
    name: "PHC Sub-Centre Wing (Huzur)",
    status: "In Progress",
    completionYear: 2025,
    costCr: 0.65,
    category: "Health & Sanitation",
    agency: "PWD Bhopal",
    h3CellId: "89a12c8b7",
    lat: 23.6210,
    lng: 77.4210,
  },
  {
    id: "asset-003",
    name: "Govt High School Additional Block",
    status: "Sanctioned",
    completionYear: 2026,
    costCr: 0.30,
    category: "Education",
    agency: "Bhopal District Authority",
    h3CellId: "89a12c8bf",
    lat: 23.6480,
    lng: 77.4490,
  },
  {
    id: "asset-004",
    name: "Storm Drainage Package #4",
    status: "Completed",
    completionYear: 2023,
    costCr: 0.25,
    category: "Public Utilities",
    agency: "Bhopal Municipal Corporation",
    h3CellId: "89a12c8a1",
    lat: 23.6150,
    lng: 77.4520,
  },
];

// Environmental & Forest Reserve Buffer Polygons (Representative Demo Layer)
export const ecologicalBuffers = [
  {
    id: "eco-001",
    name: "Forest & Wetland Eco-Buffer (Berasia North) [Demo Layer]",
    agency: "Regional Environmental Buffer",
    restrictionType: "Ecological Conservation Zone",
    coordinates: [
      [23.655, 77.455],
      [23.675, 77.470],
      [23.665, 77.490],
      [23.645, 77.480],
      [23.640, 77.460],
    ],
  },
];

// Planned Logistics & Freight Corridors (Representative Demo Layer)
export const infrastructureCorridors = [
  {
    id: "corridor-001",
    name: "Multi-modal Freight Corridor Alignment [Demo Layer]",
    corridorType: "Dedicated Freight Logistics Setback",
    widthMeters: 150,
    coordinates: [
      [23.605, 77.395],
      [23.625, 77.425],
      [23.645, 77.455],
      [23.675, 77.495],
    ],
  },
];

/**
 * Haversine formula to calculate great-circle distance between two GPS coordinates in meters.
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Point-in-polygon ray-casting algorithm for geo-fencing checks.
 */
export function isPointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0],
      yi = polygon[i][1];
    const xj = polygon[j][0],
      yj = polygon[j][1];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Distance from a point to a line segment in meters.
 */
function distToSegment(p, v, w) {
  const l2 = Math.pow(v[0] - w[0], 2) + Math.pow(v[1] - w[1], 2);
  if (l2 === 0) return calculateHaversineDistance(p[0], p[1], v[0], v[1]);
  let t = ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;
  t = Math.max(0, Math.min(1, t));
  const projection = [v[0] + t * (w[0] - v[0]), v[1] + t * (w[1] - v[1])];
  return calculateHaversineDistance(p[0], p[1], projection[0], projection[1]);
}

/**
 * Evaluates spatial conflict for a proposed project coordinate.
 */
export function evaluateSpatialConflict(lat, lng, options = {}) {
  const thresholdMeters = options.threshold || CONFLICT_THRESHOLD_METERS;

  // 1. Check distance against all existing MPLADS assets
  let closestAsset = null;
  let minDistance = Infinity;

  for (const asset of existingAssets) {
    const dist = calculateHaversineDistance(lat, lng, asset.lat, asset.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestAsset = asset;
    }
  }

  // Generate deterministic representative H3 resolution-9 cell ID
  const h3CellId = `89a${Math.floor(lat * 100).toString(16)}${Math.floor(lng * 100).toString(16)}b3`;

  // Condition A: Duplicate Asset Conflict (< threshold)
  if (closestAsset && minDistance <= thresholdMeters) {
    return {
      status: "critical",
      conflictType: "duplicate",
      badgeText: "CRITICAL SPATIAL DUPLICATE",
      closestAsset,
      distanceMeters: minDistance,
      h3CellId,
      title: `Duplicate Infrastructure Detected (${minDistance}m separation)`,
      reason: `Proposed GPS location is within ${minDistance}m (same H3 Resolution-9 cell) of existing ${closestAsset.name} (commissioned ${closestAsset.completionYear} for ₹${closestAsset.costCr} Cr). Statutory guidelines prohibit duplicate asset financing.`,
      recommendation: "Reject or relocate proposed work coordinates. Sanction freeze mandatory pending physical site verification.",
      lat,
      lng,
    };
  }

  // Condition B: Ecological Buffer check
  for (const eco of ecologicalBuffers) {
    if (isPointInPolygon([lat, lng], eco.coordinates)) {
      return {
        status: "restricted",
        conflictType: "ecological",
        badgeText: "RESTRICTED ECOLOGICAL BUFFER",
        closestAsset: null,
        distanceMeters: 0,
        h3CellId,
        title: `Intersects ${eco.name}`,
        reason: `Proposed coordinates intersect a restricted ecological conservation buffer. Environmental clearance required prior to work sanction.`,
        recommendation: "Obtain environmental clearance from competent authority or adjust alignment outside buffer perimeter.",
        lat,
        lng,
      };
    }
  }

  // Condition C: Infrastructure Corridor Buffer check
  for (const corridor of infrastructureCorridors) {
    for (let i = 0; i < corridor.coordinates.length - 1; i++) {
      const segDist = distToSegment(
        [lat, lng],
        corridor.coordinates[i],
        corridor.coordinates[i + 1]
      );
      if (segDist <= corridor.widthMeters) {
        return {
          status: "restricted",
          conflictType: "corridor",
          badgeText: "RESTRICTED LOGISTICS CORRIDOR",
          closestAsset: null,
          distanceMeters: segDist,
          h3CellId,
          title: `Intersects ${corridor.name}`,
          reason: `Coordinates fall within ${segDist}m of a planned logistics corridor alignment (${corridor.widthMeters}m buffer setback). Work may face right-of-way reclamation.`,
          recommendation: "Submit alignment to transport/corridor authority for setback clearance.",
          lat,
          lng,
        };
      }
    }
  }

  // Condition D: Clear for sanction
  return {
    status: "clear",
    conflictType: "none",
    badgeText: "SPATIAL CLEARANCE VERIFIED",
    closestAsset: closestAsset && minDistance < 10000 ? closestAsset : null,
    distanceMeters: minDistance,
    h3CellId,
    title: "Spatial Clearance Verified",
    reason: `Coordinates verified against existing local works (nearest asset is ${minDistance > 1000 ? `${(minDistance / 1000).toFixed(1)} km` : `${minDistance}m`} away) and regional master plan corridors. No overlapping assets detected.`,
    recommendation: "Eligible for financial sanction review by Implementing District Authority.",
    lat,
    lng,
  };
}

export function getExistingAssets() {
  return existingAssets;
}

export function getEcologicalBuffers() {
  return ecologicalBuffers;
}

export function getInfrastructureCorridors() {
  return infrastructureCorridors;
}

// Preset demonstration coordinate templates
export const demonstrationLocations = {
  duplicateBerasia: {
    name: "Community hall, Berasia",
    vendor: "Aarav Infra Projects",
    amountCr: "0.48",
    category: "Community Assets",
    lat: 23.6340,
    lng: 77.4330,
    expectedConflict: "duplicate",
  },
  ecoZoneBerasiaNorth: {
    name: "Forest Link Road, Berasia North",
    vendor: "Satpura Roads Ltd",
    amountCr: "0.91",
    category: "Roads & Pathways",
    lat: 23.6600,
    lng: 77.4650,
    expectedConflict: "ecological",
  },
  clearBairagarh: {
    name: "Solar High-Mast Lighting, Bairagarh",
    vendor: "Vindhya Buildcon",
    amountCr: "0.22",
    category: "Public Utilities",
    lat: 23.2840,
    lng: 77.3320,
    expectedConflict: "none",
  },
};
