/**
 * Vendor Service
 * Connects to /api/vendors/*
 */
import { get } from "./api";

export async function getVendors(params = {}) {
  return get("/api/vendors/", params);
}

export async function getVendor(id) {
  return get(`/api/vendors/${id}`);
}

export async function getVendorNetwork() {
  return get("/api/vendors/network");
}

export async function getVendorAuditNetwork() {
  return get("/api/vendors/audit-network");
}

export async function getVendorStats() {
  return get("/api/vendors/stats");
}

export const vendorService = {
  getVendors,
  getVendor,
  getVendorNetwork,
  getVendorAuditNetwork,
  getVendorStats,
};

export default vendorService;
