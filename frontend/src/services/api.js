/**
 * Centralized API client for MPLADS Sentinel
 * Communicates with Flask backend on http://localhost:5000
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function buildUrl(endpoint, params = {}) {
  const base = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const url = new URL(base);
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      url.searchParams.append(key, val);
    }
  });
  return url.toString();
}

async function request(endpoint, options = {}, params = {}) {
  const url = buildUrl(endpoint, params);
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    let data;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      const errorMsg =
        data && typeof data === "object" && (data.error || data.message)
          ? data.error || data.message
          : `HTTP ${res.status}: ${res.statusText}`;
      const error = new Error(errorMsg);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.status) {
      throw err;
    }
    const netErr = new Error(`Network error connecting to backend: ${err.message}`);
    netErr.isNetworkError = true;
    netErr.originalError = err;
    throw netErr;
  }
}

export async function get(endpoint, params = {}) {
  return request(endpoint, { method: "GET" }, params);
}

export async function post(endpoint, body = {}, params = {}) {
  return request(
    endpoint,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    params
  );
}

export async function patch(endpoint, body = {}, params = {}) {
  return request(
    endpoint,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
    params
  );
}

export const api = {
  get,
  post,
  patch,
  API_BASE_URL,
};

export default api;
