/**
 * Alert Service
 * Connects to /api/alerts/*
 */
import { get, patch } from "./api";

export async function getAlerts(params = {}) {
  return get("/api/alerts/", params);
}

export async function getAlert(id) {
  return get(`/api/alerts/${id}`);
}

export async function updateAlertDisposition(id, payload) {
  return patch(`/api/alerts/${id}/disposition`, payload);
}

export async function getAlertStats() {
  return get("/api/alerts/stats");
}

export const alertService = {
  getAlerts,
  getAlert,
  updateAlertDisposition,
  getAlertStats,
};

export default alertService;
