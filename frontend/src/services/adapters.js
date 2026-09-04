/**
 * Data Adapters
 * Bridges Flask backend schema differences to existing UI components
 */

/**
 * Normalizes risk score: 0.0-1.0 float in backend -> 0-100 integer in UI
 */
export function adaptRisk(val) {
  if (val === null || val === undefined) return 0;
  const num = Number(val);
  if (isNaN(num)) return 0;
  return num <= 1.0 ? Math.round(num * 100) : Math.round(num);
}

/**
 * Maps uppercase backend severity to frontend styling tokens
 */
export function adaptSeverity(severity) {
  if (!severity) return "normal";
  const s = String(severity).toUpperCase();
  switch (s) {
    case "CRITICAL":
      return "critical";
    case "HIGH":
      return "elevated";
    case "MEDIUM":
      return "info";
    case "LOW":
      return "normal";
    default:
      return severity.toLowerCase();
  }
}

/**
 * Maps frontend tone back to uppercase backend severity
 */
export function toBackendSeverity(tone) {
  if (!tone) return "MEDIUM";
  const t = String(tone).toLowerCase();
  switch (t) {
    case "critical":
      return "CRITICAL";
    case "elevated":
      return "HIGH";
    case "info":
      return "MEDIUM";
    case "normal":
      return "LOW";
    default:
      return "HIGH";
  }
}

/**
 * Maps backend uppercase disposition to frontend display string
 */
export function adaptDisposition(disp) {
  if (!disp) return "pending";
  const d = String(disp).toUpperCase();
  switch (d) {
    case "PENDING":
      return "pending";
    case "ACCEPTED":
      return "true_positive";
    case "REJECTED":
      return "false_positive";
    case "ESCALATED":
      return "escalated";
    default:
      return disp.toLowerCase();
  }
}

/**
 * Maps frontend disposition button actions back to backend uppercase values
 */
export function toBackendDisposition(action) {
  const a = String(action).toLowerCase();
  switch (a) {
    case "true_positive":
    case "accepted":
      return "ACCEPTED";
    case "false_positive":
    case "rejected":
      return "REJECTED";
    case "escalated":
      return "ESCALATED";
    case "pending":
    default:
      return "PENDING";
  }
}

/**
 * Adapts backend /api/vendors/network response to D3 graph schema
 */
export function adaptVendorNetwork(data) {
  if (!data || !Array.isArray(data.nodes)) {
    return { nodes: [], links: [], scores: {} };
  }

  const nodes = data.nodes.map((n) => ({
    id: n.id,
    name: n.label || n.id,
    label: n.label,
    kind: n.kind || "vendor",
    risk: adaptRisk(n.risk),
    cartel: n.cartel_group_id,
    value: n.value || 0,
    constituency: n.constituency,
  }));

  const links = (data.links || []).map((l) => ({
    source: l.source,
    target: l.target,
    kind: l.kind,
    type:
      l.kind === "shares_bank"
        ? "account"
        : l.kind === "shares_address"
        ? "address"
        : l.kind === "paid_on"
        ? "project_link"
        : "bid_rotation",
  }));

  return {
    nodes,
    links,
    scores: data.scores || {},
  };
}

/**
 * Normalizes SHAP attribution object/array for ShapWaterfall.jsx
 */
export function adaptShap(shap) {
  if (!shap) return [];
  if (Array.isArray(shap)) {
    return shap.map((item) => ({
      feature: item.feature || item.description || "Factor",
      value: item.impact !== undefined ? item.impact : item.value !== undefined ? item.value : 0,
      description: item.description,
      start_value: item.start_value,
      end_value: item.end_value,
    }));
  }
  if (shap.attributions && Array.isArray(shap.attributions)) {
    return shap.attributions.map((item) => ({
      feature: item.feature || item.description || "Factor",
      value: item.impact !== undefined ? item.impact : 0,
      description: item.description,
      start_value: item.start_value,
      end_value: item.end_value,
    }));
  }
  return [];
}

/**
 * Adapts backend alert object to frontend schema
 */
export function adaptAlert(a) {
  if (!a) return null;
  const id = a.alert_id !== undefined ? String(a.alert_id) : String(a.id || "");
  const alertType = a.alert_type || a.type || "Anomaly Alert";
  const vendorName = a.vendor_name || "";
  const title = a.title || (vendorName ? `${alertType} · ${vendorName}` : alertType);
  const entity =
    a.entity ||
    (vendorName
      ? `${vendorName}${a.constituency ? " · " + a.constituency : a.district ? " · " + a.district : ""}`
      : a.project_desc || "General Entity");

  return {
    id,
    alert_id: a.alert_id !== undefined ? a.alert_id : id,
    title,
    type: alertType,
    severity: adaptSeverity(a.severity),
    entity,
    timestamp: a.created_at || a.timestamp || new Date().toISOString(),
    disposition: adaptDisposition(a.disposition),
    explanation: a.natural_language_summary || a.explanation || "",
    shap: adaptShap(a.shap_explanation || a.shap),
    evidence:
      a.evidence ||
      (a.shap_explanation?.attributions
        ? a.shap_explanation.attributions.map((att) => att.description).filter(Boolean)
        : [
            a.project_desc ? `Project: ${a.project_desc}` : "",
            a.constituency ? `Constituency: ${a.constituency}, ${a.state || ""}` : "",
          ].filter(Boolean)),
    project_id: a.project_id,
    vendor_id: a.vendor_id,
    district: a.district,
    state: a.state,
    constituency: a.constituency,
    raw: a,
  };
}

/**
 * Adapts backend project object to frontend schema
 */
export function adaptProject(p) {
  if (!p) return null;
  const costCr = p.sanctioned_amount
    ? Number((p.sanctioned_amount / 10000000).toFixed(2))
    : p.amountCr || 0;

  return {
    id: p.project_id !== undefined ? `p${p.project_id}` : p.id || "",
    projectId: p.project_id,
    name: p.work_description || p.title || p.name || `Work #${p.project_id}`,
    stage: p.project_status || p.stage || "Sanctioned",
    amountCr: costCr,
    risk: adaptRisk(p.composite_risk_score !== undefined ? p.composite_risk_score : p.risk),
    lat: Number(p.latitude) || p.lat || 23.2599,
    lng: Number(p.longitude) || p.lng || 77.4126,
    delayDays: p.delay_probability ? Math.round(p.delay_probability * 60) : p.delayDays || 0,
    expectedDate: p.expected_completion || p.expectedDate || "Q3 2025",
    vendor: p.vendor_name || p.vendor || "Designated Contractor",
    category: p.work_category || p.category || "Civil Infrastructure",
    agency: p.implementing_agency || p.agency || "District Agency",
    raw: p,
  };
}

/**
 * Adapts backend vendor object to frontend schema
 */
export function adaptVendor(v) {
  if (!v) return null;
  const contractValCr = v.total_contract_value
    ? Number((v.total_contract_value / 10000000).toFixed(1))
    : v.contractValueCr || 0;

  return {
    id: v.vendor_id !== undefined ? `v${v.vendor_id}` : v.id || "",
    vendorId: v.vendor_id,
    name: v.business_name || v.vendor_name || v.name || `Vendor #${v.vendor_id}`,
    risk: adaptRisk(v.lifetime_risk_score !== undefined ? v.lifetime_risk_score : v.composite_risk_score !== undefined ? v.composite_risk_score : v.risk),
    contractValueCr: contractValCr,
    cartelGroupId: v.cartel_group_id,
    flaggedReason:
      v.flagged_reasons?.join("; ") ||
      v.graph_score?.narrative ||
      v.flaggedReason ||
      "Anomalous co-bidding or shared identifier detected",
    completionRate: v.completionRate !== undefined ? v.completionRate : 0.65,
    overrunRate: v.overrunRate !== undefined ? v.overrunRate : 0.35,
    activeWorksCount: v.active_projects || v.activeWorksCount || 2,
    constituencies: v.constituency ? [v.constituency] : v.district ? [v.district] : v.constituencies || ["Bhopal"],
    shap: adaptShap(v.graph_score?.shap || v.shap),
    raw: v,
  };
}

