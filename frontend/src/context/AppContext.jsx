import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { alertsInitial, constituencies, vendors } from "../data/mockData";
import { alertService } from "../services/alertService";
import { adaptAlert, toBackendDisposition } from "../services/adapters";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [role, setRole] = useState("ministry"); // ministry | ida | mp | sna
  const [metricLayer, setMetricLayer] = useState("risk"); // risk | utilisation | completion | alerts
  const [selectedConstituencyId, setSelectedConstituencyId] = useState("c1"); // Bhopal
  const [selectedVendorId, setSelectedVendorId] = useState("v1"); // Aarav Infra Projects
  const [selectedAlertId, setSelectedAlertId] = useState("al1");
  const [alerts, setAlerts] = useState(alertsInitial);
  const [toast, setToast] = useState(null);
  const [demoTourActive, setDemoTourActive] = useState(true);
  const [demoStep, setDemoStep] = useState(1);

  useEffect(() => {
    let isMounted = true;
    async function loadAlerts() {
      try {
        const res = await alertService.getAlerts();
        const alertList = Array.isArray(res) ? res : res?.alerts || [];
        if (alertList.length > 0 && isMounted) {
          const adapted = alertList.map(adaptAlert);
          setAlerts(adapted);
          setSelectedAlertId(adapted[0].id);
        }
      } catch (err) {
        console.warn("[MPLADS Sentinel] Backend unavailable — using demo fallback.", err);
      }
    }
    loadAlerts();
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 4500);
  }, []);

  const disposeAlert = useCallback((id, disposition, note) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, disposition, note } : a))
    );
    showToast(
      `Alert ${String(id).toUpperCase()} updated: ${disposition.replace("_", " ").toUpperCase()}`,
      disposition === "true_positive"
        ? "success"
        : disposition === "escalated"
        ? "warning"
        : "info"
    );

    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) {
      alertService
        .updateAlertDisposition(numericId, {
          disposition: toBackendDisposition(disposition),
          actor: "district_collector",
          notes: note || "Triage completed via Sentinel UI",
        })
        .catch((err) => {
          console.warn("[MPLADS Sentinel] Failed to sync disposition to backend:", err);
        });
    }
  }, [showToast]);

  const createLiveAlert = useCallback((newAlert) => {
    const generatedAlert = {
      id: `al-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      disposition: "pending",
      ...newAlert,
    };
    setAlerts((prev) => [generatedAlert, ...prev]);
    setSelectedAlertId(generatedAlert.id);
    showToast(
      `🚨 New Anomaly Alert Generated: "${generatedAlert.title}" pushed to IDA Triage!`,
      "critical"
    );
    return generatedAlert;
  }, [showToast]);

  // Quick helper to resolve selected items
  const selectedConstituency =
    constituencies.find((c) => c.id === selectedConstituencyId) || constituencies[0];
  const selectedVendor =
    vendors.find((v) => v.id === selectedVendorId) || vendors[0];
  const selectedAlert =
    alerts.find((a) => a.id === selectedAlertId) || alerts[0];

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        metricLayer,
        setMetricLayer,
        selectedConstituencyId,
        setSelectedConstituencyId,
        selectedConstituency,
        selectedVendorId,
        setSelectedVendorId,
        selectedVendor,
        selectedAlertId,
        setSelectedAlertId,
        selectedAlert,
        alerts,
        disposeAlert,
        createLiveAlert,
        toast,
        showToast,
        demoTourActive,
        setDemoTourActive,
        demoStep,
        setDemoStep,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}
