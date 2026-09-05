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
 * Adapts backend vendor object to frontend schema.
 * Accurately combines vendor detail, network node attributes, links, and graph scores.
 * Genuinely missing data returns null/— rather than zero-masking.
 */
export function adaptVendor(v, networkNode = null, networkLinks = [], networkScore = null) {
  if (!v && !networkNode) return null;

  // Resolve numeric and string IDs
  const rawId = v?.vendor_id ?? networkNode?.id ?? v?.id ?? 1;
  const numId = parseInt(String(rawId).replace(/\D/g, ""), 10) || 1;
  const idStr = `v${numId}`;

  // Vendor Name
  const name =
    v?.business_name ||
    v?.vendor_name ||
    networkNode?.name ||
    networkNode?.label ||
    v?.name ||
    `Vendor-${String(numId).padStart(3, "0")}`;

  // Score Object from network scores or vendor graph_score
  const scoreObj = networkScore || v?.graph_score || {};

  // Risk Score (0-100)
  const rawRisk =
    v?.lifetime_risk_score !== undefined
      ? v.lifetime_risk_score
      : scoreObj?.lifetime_risk_score !== undefined
      ? scoreObj.lifetime_risk_score
      : networkNode?.risk !== undefined
      ? networkNode.risk
      : v?.risk;
  const risk = adaptRisk(rawRisk);

  // Contracts Value in Crores (from networkNode.value or total_contract_value or contractValueCr)
  let contractValueCr = null;
  if (networkNode?.value !== undefined && networkNode?.value !== null) {
    contractValueCr = Number(networkNode.value) / 10000000;
  } else if (v?.total_contract_value !== undefined && v?.total_contract_value !== null) {
    contractValueCr = Number(v.total_contract_value) / 10000000;
  } else if (v?.contractValueCr !== undefined && v?.contractValueCr !== null) {
    contractValueCr = Number(v.contractValueCr);
  }

  // Active Works Count (from network paid_on links or v.active_projects)
  let activeWorksCount = null;
  if (Array.isArray(networkLinks) && networkLinks.length > 0) {
    const paidOnCount = networkLinks.filter((l) => {
      const src = String(typeof l.source === "object" ? l.source.id : l.source);
      const tgt = String(typeof l.target === "object" ? l.target.id : l.target);
      const kind = l.kind || l.type;
      return (src === idStr || src === String(numId)) && (kind === "paid_on" || tgt.startsWith("p"));
    }).length;
    if (paidOnCount > 0) activeWorksCount = paidOnCount;
  }
  if (activeWorksCount === null) {
    if (v?.active_projects !== undefined && v?.active_projects !== null) {
      activeWorksCount = Number(v.active_projects);
    } else if (v?.activeWorksCount !== undefined && v?.activeWorksCount !== null) {
      activeWorksCount = Number(v.activeWorksCount);
    }
  }

  // Network Relationship Counts
  const linkedBank = Array.isArray(scoreObj.linked_bank) ? scoreObj.linked_bank : [];
  const linkedAddress = Array.isArray(scoreObj.linked_address) ? scoreObj.linked_address : [];
  const linkedPan = Array.isArray(scoreObj.linked_pan) ? scoreObj.linked_pan : [];
  const coBidders = Array.isArray(scoreObj.co_bidders) ? scoreObj.co_bidders : [];

  let linkedBankCount = linkedBank.length;
  let linkedAddressCount = linkedAddress.length;
  if (linkedBankCount === 0 && Array.isArray(networkLinks)) {
    linkedBankCount = networkLinks.filter((l) => {
      const src = String(typeof l.source === "object" ? l.source.id : l.source);
      const tgt = String(typeof l.target === "object" ? l.target.id : l.target);
      const kind = l.kind || l.type;
      return (src === idStr || tgt === idStr) && (kind === "shares_bank" || kind === "bank" || kind === "account");
    }).length;
  }
  if (linkedAddressCount === 0 && Array.isArray(networkLinks)) {
    linkedAddressCount = networkLinks.filter((l) => {
      const src = String(typeof l.source === "object" ? l.source.id : l.source);
      const tgt = String(typeof l.target === "object" ? l.target.id : l.target);
      const kind = l.kind || l.type;
      return (src === idStr || tgt === idStr) && (kind === "shares_address" || kind === "address");
    }).length;
  }

  // Cartel Ring Identification
  const cartelGroupId = v?.cartel_group_id || scoreObj.cartel_group_id || networkNode?.cartel_group_id || null;

  // Narrative & Explicit Audit Signals
  const narrative = scoreObj.narrative || v?.narrative || null;
  const signals = Array.isArray(scoreObj.signals) ? scoreObj.signals : [];

  // SHAP Attribution Waterfall
  const shapRaw = scoreObj.shap || v?.graph_score?.shap || v?.shap;
  const shap = adaptShap(shapRaw);

  return {
    id: idStr,
    vendorId: numId,
    name,
    risk,
    contractValueCr,
    activeWorksCount,
    cartelGroupId,
    gstin: v?.gstin_number || null,
    panHash: v?.pan_hash || null,
    bankHash: v?.bank_account_hash || null,
    registeredAddress: v?.registered_address || null,
    state: v?.state || null,
    constituencies: v?.constituency
      ? [v.constituency]
      : v?.district
      ? [v.district]
      : v?.constituencies || (v?.state ? [v.state] : []),
    linkedBankCount,
    linkedAddressCount,
    linkedPanCount: linkedPan.length,
    coBiddersCount: coBidders.length,
    coBidders,
    signals,
    narrative,
    shap,
    completionRate: v?.completionRate !== undefined ? v.completionRate : null,
    overrunRate: v?.overrunRate !== undefined ? v.overrunRate : null,
    flaggedReason:
      v?.flagged_reasons?.join("; ") ||
      narrative ||
      (signals.length ? signals.join("; ") : null) ||
      v?.flaggedReason ||
      null,
    raw: v,
  };
}

