/**
 * National Geographic Intelligence Service
 * 
 * Provides real GeoJSON boundaries of India and state-level metrics for the MoSPI Command Centre.
 * Decoupled from UI components for future integration with official MoSPI eSAKSHI data feeds.
 */

import indiaGeoJson from "../data/indiaStatesGeo.json";
import { constituencies } from "../data/mockData";

// State aggregated baseline metrics (prototype values mapped to real state boundaries)
export const stateMetrics = {
  "Madhya Pradesh": { risk: 78, utilisation: 54, completion: 48, alerts: 35, constituencies: 29 },
  "Uttar Pradesh": { risk: 72, utilisation: 58, completion: 52, alerts: 42, constituencies: 80 },
  "Bihar": { risk: 84, utilisation: 38, completion: 32, alerts: 48, constituencies: 40 },
  "Maharashtra": { risk: 42, utilisation: 74, completion: 69, alerts: 18, constituencies: 48 },
  "Rajasthan": { risk: 59, utilisation: 62, completion: 56, alerts: 21, constituencies: 25 },
  "Gujarat": { risk: 36, utilisation: 79, completion: 74, alerts: 11, constituencies: 26 },
  "Telangana": { risk: 45, utilisation: 68, completion: 64, alerts: 14, constituencies: 17 },
  "Karnataka": { risk: 34, utilisation: 78, completion: 73, alerts: 12, constituencies: 28 },
  "Tamil Nadu": { risk: 29, utilisation: 83, completion: 79, alerts: 9, constituencies: 39 },
  "West Bengal": { risk: 68, utilisation: 51, completion: 47, alerts: 27, constituencies: 42 },
  "Odisha": { risk: 53, utilisation: 63, completion: 58, alerts: 19, constituencies: 21 },
  "Assam": { risk: 71, utilisation: 49, completion: 45, alerts: 24, constituencies: 14 },
  "Kerala": { risk: 24, utilisation: 87, completion: 83, alerts: 6, constituencies: 20 },
  "Punjab": { risk: 49, utilisation: 66, completion: 61, alerts: 13, constituencies: 13 },
  "Haryana": { risk: 46, utilisation: 69, completion: 65, alerts: 12, constituencies: 10 },
  "Delhi": { risk: 38, utilisation: 77, completion: 72, alerts: 8, constituencies: 7 },
  "Jammu & Kashmir": { risk: 65, utilisation: 52, completion: 48, alerts: 17, constituencies: 5 },
  "Jammu and Kashmir": { risk: 65, utilisation: 52, completion: 48, alerts: 17, constituencies: 5 },
  "Ladakh": { risk: 52, utilisation: 65, completion: 60, alerts: 7, constituencies: 1 },
  "Himachal Pradesh": { risk: 31, utilisation: 81, completion: 77, alerts: 5, constituencies: 4 },
  "Uttarakhand": { risk: 43, utilisation: 72, completion: 67, alerts: 8, constituencies: 5 },
  "Jharkhand": { risk: 79, utilisation: 44, completion: 39, alerts: 29, constituencies: 14 },
  "Chhattisgarh": { risk: 64, utilisation: 57, completion: 52, alerts: 21, constituencies: 11 },
  "Andhra Pradesh": { risk: 47, utilisation: 71, completion: 66, alerts: 16, constituencies: 25 },
  "Arunachal Pradesh": { risk: 58, utilisation: 61, completion: 55, alerts: 12, constituencies: 2 },
  "Manipur": { risk: 74, utilisation: 46, completion: 41, alerts: 26, constituencies: 2 },
  "Meghalaya": { risk: 62, utilisation: 55, completion: 50, alerts: 18, constituencies: 2 },
  "Mizoram": { risk: 48, utilisation: 70, completion: 66, alerts: 9, constituencies: 1 },
  "Nagaland": { risk: 66, utilisation: 51, completion: 47, alerts: 22, constituencies: 1 },
  "Tripura": { risk: 50, utilisation: 68, completion: 63, alerts: 11, constituencies: 2 },
  "Sikkim": { risk: 32, utilisation: 82, completion: 78, alerts: 6, constituencies: 1 },
  "Goa": { risk: 28, utilisation: 85, completion: 81, alerts: 5, constituencies: 2 },
  "Andaman & Nicobar": { risk: 30, utilisation: 84, completion: 80, alerts: 4, constituencies: 1 },
  "Andaman and Nicobar": { risk: 30, utilisation: 84, completion: 80, alerts: 4, constituencies: 1 },
  "Lakshadweep": { risk: 22, utilisation: 88, completion: 85, alerts: 3, constituencies: 1 },
  "Chandigarh": { risk: 35, utilisation: 80, completion: 76, alerts: 4, constituencies: 1 },
  "Puducherry": { risk: 33, utilisation: 82, completion: 77, alerts: 5, constituencies: 1 },
  "Dadra and Nagar Haveli and Daman and Diu": { risk: 37, utilisation: 78, completion: 74, alerts: 6, constituencies: 2 },
};

// Fallback metric for union territories / smaller states
const defaultStateMetric = {
  risk: 40,
  utilisation: 70,
  completion: 65,
  alerts: 5,
  constituencies: 1,
};

export function getNationalGeography() {
  return indiaGeoJson;
}

export function getStateMetric(stateName) {
  if (!stateName) return defaultStateMetric;
  if (stateMetrics[stateName]) return stateMetrics[stateName];
  const alt = stateName.includes("&")
    ? stateName.replace(/&/g, "and")
    : stateName.replace(/\band\b/g, "&");
  return stateMetrics[alt] || defaultStateMetric;
}

export function getMetricValue(layer, metricObj) {
  if (!metricObj) return 0;
  if (layer === "risk") return metricObj.risk;
  if (layer === "utilisation") return metricObj.utilisation;
  if (layer === "completion") return metricObj.completion;
  if (layer === "alerts") return metricObj.alerts;
  return metricObj.risk;
}

export function getMetricColor(layer, value) {
  if (layer === "utilisation" || layer === "completion") {
    // Higher is compliant (green), moderate is warning (amber), low is lag (red)
    if (value >= 75) return "#86EFAC";
    if (value >= 55) return "#FDE047";
    return "#FCA5A5";
  }
  // Risk & Alerts: Higher is critical (red), moderate is elevated (amber), lower is compliant (slate)
  if (value >= 70) return "#F87171";
  if (value >= 45) return "#FBBF24";
  return "#CBD5E1";
}

export function getConstituencyPins() {
  return constituencies.map((c) => ({
    ...c,
    lat: Number(c.lat),
    lng: Number(c.lng),
  }));
}
