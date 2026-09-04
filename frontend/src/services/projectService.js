/**
 * Project Service
 * Connects to /api/projects/*
 */
import { get, post } from "./api";

export async function getProjects(params = {}) {
  return get("/api/projects/", params);
}

export async function getProject(id) {
  return get(`/api/projects/${id}`);
}

export async function getProjectAlerts(id) {
  return get(`/api/projects/${id}/alerts`);
}

export async function getProjectStats() {
  return get("/api/projects/stats");
}

export async function getH3Clusters() {
  return get("/api/projects/cluster/h3");
}

export async function getSurvivalCurve(id) {
  return get(`/api/projects/${id}/survival-curve`);
}

export async function verifyProjectLocation(payload) {
  return post("/api/projects/geo-verify", payload);
}

export const projectService = {
  getProjects,
  getProject,
  getProjectAlerts,
  getProjectStats,
  getH3Clusters,
  getSurvivalCurve,
  verifyProjectLocation,
};

export default projectService;
