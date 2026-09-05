import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { alertService } from "../services/alertService";
import { dashboardService } from "../services/dashboardService";
import { vendorService } from "../services/vendorService";
import { adaptAlert, adaptRisk } from "../services/adapters";
import { updateStateMetricsFromBackend, updateConstituencyPinsFromProjects } from "../services/nationalGeoService";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [role, setRole] = useState("ministry"); // ministry | ida | mp | sna
  const [metricLayer, setMetricLayer] = useState("risk"); // risk | utilisation | completion | alerts
  const [selectedConstituencyId, setSelectedConstituencyId] = useState(null);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [toast, setToast] = useState(null);
  const [demoTourActive, setDemoTourActive] = useState(true);
  const [demoStep, setDemoStep] = useState(1);

  // Load all real data from backend on mount
  useEffect(() => {
    let isMounted = true;

    async function loadAllData() {
      // 1. Load alerts from backend
      try {
        const res = await alertService.getAlerts();
        const alertList = Array.isArray(res) ? res : res?.alerts || [];
        if (alertList.length > 0 && isMounted) {
          const adapted = alertList.map(adaptAlert);
          setAlerts(adapted);
          setSelectedAlertId(adapted[0].id);
        }
      } catch (err) {
        console.warn("[MPLADS Sentinel] Backend alerts unavailable.", err);
      }

      // 2. Load ministry dashboard for constituency data & heatmap
      try {
        const data = await dashboardService.getMinistryDashboard();
        if (data && isMounted) {
          // Update heatmap in geo service
          if (data.heatmap) {
            updateStateMetricsFromBackend(data.heatmap);
          }
          // Build constituency list from real projects
          if (data.projects && data.projects.length > 0) {
            updateConstituencyPinsFromProjects(data.projects);
            
            // Build constituency objects for context
            const cMap = {};
            for (const p of data.projects) {
              const key = p.constituency || p.district || "Unknown";
              if (!cMap[key]) {
                cMap[key] = {
                  id: `c-${key.replace(/\s/g, "-").toLowerCase()}`,
                  name: key,
                  state: p.state || "",
                  district: p.district || "",
                  mpName: p.mp_name || "",
                  lat: Number(p.latitude) || 22.0,
                  lng: Number(p.longitude) || 78.0,
                  risk: 0, utilisation: 0, alerts: 0,
                  totalFundsCr: 0, unspentCr: 0,
                  count: 0, riskSum: 0, sanctioned: 0, disbursed: 0,
                };
              }
              const c = cMap[key];
              c.count += 1;
              c.sanctioned += (p.sanctioned_amount || 0);
              c.disbursed += (p.disbursed_amount || 0);
              c.riskSum += (p.composite_risk_score || 0);
            }
            const cList = Object.values(cMap).map((c) => {
              const util = c.sanctioned > 0 ? Math.round((c.disbursed / c.sanctioned) * 100) : 0;
              const avgRisk = c.count > 0 ? Math.round((c.riskSum / c.count) * 100) : 0;
              return {
                ...c,
                risk: avgRisk,
                utilisation: util,
                completion: Math.max(0, util - 5),
                alerts: Math.round(avgRisk * c.count / 100),
                totalFundsCr: Number((c.sanctioned / 10000000).toFixed(1)),
                unspentCr: Number(((c.sanctioned - c.disbursed) / 10000000).toFixed(1)),
              };
            }).sort((a, b) => b.risk - a.risk);
            setConstituencies(cList);
            if (cList.length > 0 && !selectedConstituencyId) {
              setSelectedConstituencyId(cList[0].id);
            }
          }
        }
      } catch (err) {
        console.warn("[MPLADS Sentinel] Backend dashboard unavailable.", err);
      }

      // 3. Load vendors from backend
      try {
        const vList = await vendorService.getVendors();
        if (Array.isArray(vList) && vList.length > 0 && isMounted) {
          const adapted = vList.map((v) => ({
            id: `v${v.vendor_id}`,
            vendorId: v.vendor_id,
            name: v.business_name || v.vendor_name || `Vendor-${v.vendor_id}`,
            risk: adaptRisk(v.lifetime_risk_score),
            contractValueCr: 0,
            constituencies: v.state ? [v.state] : [],
            flaggedReason: v.cartel_group_id ? "Cartel ring member" : "",
            shap: [],
          }));
          setVendors(adapted);
          if (adapted.length > 0 && !selectedVendorId) {
            setSelectedVendorId(adapted[0].id);
          }
        }
      } catch (err) {
        console.warn("[MPLADS Sentinel] Backend vendors unavailable.", err);
      }
    }

    loadAllData();
    return () => { isMounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      const { toBackendDisposition } = require("../services/adapters");
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

  // Resolve selected items
  const selectedConstituency =
    constituencies.find((c) => c.id === selectedConstituencyId) || constituencies[0] || { id: "none", name: "Loading...", state: "", risk: 0, utilisation: 0, alerts: 0 };
  const selectedVendor =
    vendors.find((v) => v.id === selectedVendorId) || vendors[0] || { id: "none", name: "Loading...", risk: 0 };
  const selectedAlert =
    alerts.find((a) => a.id === selectedAlertId) || alerts[0] || null;

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
        constituencies,
        vendors,
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
