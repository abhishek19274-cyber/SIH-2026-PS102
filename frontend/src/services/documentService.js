/**
 * Document Service
 * Connects to /api/documents/*
 */
import { get, post } from "./api";

export async function getDocuments(projectId = null) {
  const params = projectId ? { project_id: projectId } : {};
  return get("/api/documents/", params);
}

export async function parseDocument(payload) {
  return post("/api/documents/parse", payload);
}

export const documentService = {
  getDocuments,
  parseDocument,
};

export default documentService;
