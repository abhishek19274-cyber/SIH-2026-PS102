/**
 * Dashboard Service
 * Connects to /api/dashboards/*
 */
import { get } from "./api";

export async function getMinistryDashboard() {
  return get("/api/dashboards/ministry");
}

export async function getDistrictDashboard(params = {}) {
  return get("/api/dashboards/district", params);
}

export async function getMpDashboard(params = {}) {
  return get("/api/dashboards/mp", params);
}

export async function getCitizenDashboard() {
  return get("/api/dashboards/citizen");
}

export async function getPublicDashboard() {
  return get("/api/dashboards/public");
}

export const dashboardService = {
  getMinistryDashboard,
  getDistrictDashboard,
  getMpDashboard,
  getCitizenDashboard,
  getPublicDashboard,
};

export default dashboardService;
