/**
 * MPLADS Sentinel Data Service Layer (Mock/Prototype Provider)
 * 
 * NOTE: This is a modular, structured mock dataset designed for hackathon demonstration.
 * In production, these exports can be swapped with real eSAKSHI / MoSPI REST/GraphQL API endpoints.
 */

export const constituencies = [
  { id: "c1", name: "Bhopal", state: "Madhya Pradesh", district: "Bhopal", mpName: "Alok Sharma", risk: 82, utilisation: 41, completion: 38, alerts: 14, totalFundsCr: 10.0, unspentCr: 4.8, q: 2, r: 3, lat: 23.2599, lng: 77.4126 },
  { id: "c2", name: "Indore", state: "Madhya Pradesh", district: "Indore", mpName: "Shankar Lalwani", risk: 54, utilisation: 62, completion: 57, alerts: 6, totalFundsCr: 10.0, unspentCr: 3.2, q: 1, r: 4, lat: 22.7196, lng: 75.8577 },
  { id: "c3", name: "Jabalpur", state: "Madhya Pradesh", district: "Jabalpur", mpName: "Ashish Dubey", risk: 71, utilisation: 48, completion: 44, alerts: 9, totalFundsCr: 10.0, unspentCr: 4.1, q: 3, r: 3, lat: 23.1815, lng: 79.9864 },
  { id: "c4", name: "Varanasi", state: "Uttar Pradesh", district: "Varanasi", mpName: "Narendra Modi", risk: 66, utilisation: 55, completion: 51, alerts: 8, totalFundsCr: 10.0, unspentCr: 3.8, q: 5, r: 1, lat: 25.3176, lng: 82.9739 },
  { id: "c5", name: "Lucknow", state: "Uttar Pradesh", district: "Lucknow", mpName: "Rajnath Singh", risk: 39, utilisation: 74, completion: 69, alerts: 3, totalFundsCr: 10.0, unspentCr: 2.1, q: 4, r: 0, lat: 26.8467, lng: 80.9462 },
  { id: "c6", name: "Patna Sahib", state: "Bihar", district: "Patna", mpName: "Ravi Shankar Prasad", risk: 88, utilisation: 33, completion: 29, alerts: 18, totalFundsCr: 10.0, unspentCr: 5.6, q: 6, r: 2, lat: 25.5941, lng: 85.1376 },
  { id: "c7", name: "Mumbai South", state: "Maharashtra", district: "Mumbai", mpName: "Arvind Sawant", risk: 28, utilisation: 81, completion: 77, alerts: 2, totalFundsCr: 10.0, unspentCr: 1.4, q: -1, r: 5, lat: 18.9388, lng: 72.8354 },
  { id: "c8", name: "Nagpur", state: "Maharashtra", district: "Nagpur", mpName: "Nitin Gadkari", risk: 47, utilisation: 68, completion: 61, alerts: 5, totalFundsCr: 10.0, unspentCr: 2.7, q: 0, r: 4, lat: 21.1458, lng: 79.0882 },
  { id: "c9", name: "Jaipur", state: "Rajasthan", district: "Jaipur", mpName: "Manju Sharma", risk: 58, utilisation: 59, completion: 53, alerts: 7, totalFundsCr: 10.0, unspentCr: 3.5, q: 0, r: 1, lat: 26.9124, lng: 75.7873 },
  { id: "c10", name: "Ahmedabad East", state: "Gujarat", district: "Ahmedabad", mpName: "Hasmukh Patel", risk: 35, utilisation: 76, completion: 72, alerts: 2, totalFundsCr: 10.0, unspentCr: 1.9, q: -2, r: 3, lat: 23.0225, lng: 72.5714 },
  { id: "c11", name: "Hyderabad", state: "Telangana", district: "Hyderabad", mpName: "Asaduddin Owaisi", risk: 44, utilisation: 70, completion: 66, alerts: 4, totalFundsCr: 10.0, unspentCr: 2.5, q: 2, r: 6, lat: 17.3850, lng: 78.4867 },
  { id: "c12", name: "Bengaluru South", state: "Karnataka", district: "Bengaluru", mpName: "Tejasvi Surya", risk: 31, utilisation: 79, completion: 74, alerts: 3, totalFundsCr: 10.0, unspentCr: 1.6, q: 1, r: 7, lat: 12.9716, lng: 77.5946 },
  { id: "c13", name: "Chennai Central", state: "Tamil Nadu", district: "Chennai", mpName: "Dayanidhi Maran", risk: 26, utilisation: 84, completion: 80, alerts: 1, totalFundsCr: 10.0, unspentCr: 1.2, q: 3, r: 8, lat: 13.0827, lng: 80.2707 },
  { id: "c14", name: "Kolkata North", state: "West Bengal", district: "Kolkata", mpName: "Sudip Bandyopadhyay", risk: 63, utilisation: 52, completion: 48, alerts: 10, totalFundsCr: 10.0, unspentCr: 4.2, q: 7, r: 3, lat: 22.5726, lng: 88.3639 },
  { id: "c15", name: "Bhubaneswar", state: "Odisha", district: "Khordha", mpName: "Aparajita Sarangi", risk: 49, utilisation: 64, completion: 58, alerts: 5, totalFundsCr: 10.0, unspentCr: 2.9, q: 6, r: 5, lat: 20.2961, lng: 85.8245 },
  { id: "c16", name: "Guwahati", state: "Assam", district: "Kamrup", mpName: "Bijuli Kalita Medhi", risk: 72, utilisation: 46, completion: 42, alerts: 11, totalFundsCr: 10.0, unspentCr: 4.5, q: 9, r: 1, lat: 26.1445, lng: 91.7362 },
  { id: "c17", name: "Thiruvananthapuram", state: "Kerala", district: "Thiruvananthapuram", mpName: "Shashi Tharoor", risk: 22, utilisation: 86, completion: 83, alerts: 1, totalFundsCr: 10.0, unspentCr: 0.9, q: 2, r: 9, lat: 8.5241, lng: 76.9366 },
  { id: "c18", name: "Chandigarh", state: "Chandigarh", district: "Chandigarh", mpName: "Manish Tewari", risk: 18, utilisation: 88, completion: 85, alerts: 0, totalFundsCr: 10.0, unspentCr: 0.7, q: 2, r: -1, lat: 30.7333, lng: 76.7794 },
];

export const vendors = [
  {
    id: "v1",
    name: "Aarav Infra Projects",
    risk: 86,
    contractValueCr: 42.5,
    completionRate: 0.41,
    overrunRate: 0.38,
    activeWorksCount: 7,
    constituencies: ["Bhopal", "Jabalpur"],
    flaggedReason: "High cost overrun & collusion with Narmada Civil Works via shared bank account",
    shap: [
      { feature: "Shared bank with flagged vendor", value: 0.28 },
      { feature: "Cost overrun frequency", value: 0.21 },
      { feature: "Co-bidding cluster size", value: 0.16 },
      { feature: "On-time completion", value: -0.08 },
      { feature: "GST vintage (>5 yrs)", value: -0.04 },
    ],
  },
  {
    id: "v2",
    name: "Narmada Civil Works",
    risk: 74,
    contractValueCr: 28.1,
    completionRate: 0.52,
    overrunRate: 0.29,
    activeWorksCount: 5,
    constituencies: ["Bhopal", "Indore"],
    flaggedReason: "Shared registered office address with Aarav Infra; delayed utilization",
    shap: [
      { feature: "Shared registered address", value: 0.24 },
      { feature: "Delayed fund utilisation", value: 0.18 },
      { feature: "Director overlap indicator", value: 0.12 },
      { feature: "Past completion rate", value: -0.06 },
    ],
  },
  {
    id: "v3",
    name: "Satpura Roads Ltd",
    risk: 61,
    contractValueCr: 19.4,
    completionRate: 0.63,
    overrunRate: 0.17,
    activeWorksCount: 4,
    constituencies: ["Bhopal", "Sagar"],
    flaggedReason: "Frequent co-bidding cartel participation with high-risk entities",
    shap: [
      { feature: "Co-bidding with high-risk vendor", value: 0.19 },
      { feature: "Sanction lag correlation", value: 0.11 },
      { feature: "Quality inspection score", value: -0.09 },
    ],
  },
  {
    id: "v4",
    name: "Vindhya Buildcon",
    risk: 33,
    contractValueCr: 31.8,
    completionRate: 0.81,
    overrunRate: 0.06,
    activeWorksCount: 6,
    constituencies: ["Bhopal", "Gwalior"],
    flaggedReason: "Low risk profile; strong on-time delivery track record",
    shap: [
      { feature: "On-time completion history", value: -0.22 },
      { feature: "Low overrun rate", value: -0.14 },
      { feature: "Network isolation (no cartels)", value: -0.08 },
      { feature: "New PAN linkage verification", value: 0.05 },
    ],
  },
  {
    id: "v5",
    name: "Malwa Electricals",
    risk: 48,
    contractValueCr: 11.2,
    completionRate: 0.70,
    overrunRate: 0.12,
    activeWorksCount: 3,
    constituencies: ["Bhopal", "Ujjain"],
    flaggedReason: "Bank link with Satpura Roads, though individual projects compliant",
    shap: [
      { feature: "Shared bank link", value: 0.14 },
      { feature: "Completion turnaround rate", value: -0.11 },
      { feature: "Alert history frequency", value: 0.07 },
    ],
  },
  {
    id: "v6",
    name: "Ganga Jal Nigam JV",
    risk: 79,
    contractValueCr: 36.6,
    completionRate: 0.46,
    overrunRate: 0.33,
    activeWorksCount: 6,
    constituencies: ["Varanasi", "Patna Sahib"],
    flaggedReason: "Unspent balance stagnation and address overlap with Aarav Infra group",
    shap: [
      { feature: "Unspent balance velocity", value: 0.26 },
      { feature: "Shared corporate address", value: 0.17 },
      { feature: "SC/ST allocation shortfall", value: 0.09 },
    ],
  },
  {
    id: "v7",
    name: "Deccan Prefab Systems",
    risk: 24,
    contractValueCr: 14.7,
    completionRate: 0.88,
    overrunRate: 0.04,
    activeWorksCount: 3,
    constituencies: ["Hyderabad", "Bengaluru South"],
    flaggedReason: "Highly compliant vendor with transparent public procurement history",
    shap: [
      { feature: "High completion rate (88%)", value: -0.19 },
      { feature: "Independent verified banking", value: -0.10 },
      { feature: "Single-district footprint", value: 0.03 },
    ],
  },
];

export const vendorEdges = [
  { source: "v1", target: "v2", kind: "bank", label: "Shared HDFC A/C 9841..." },
  { source: "v1", target: "v6", kind: "address", label: "Shared Reg Office (Bhopal)" },
  { source: "v2", target: "v3", kind: "cobid", label: "Co-bidding (3 tenders)" },
  { source: "v3", target: "v5", kind: "bank", label: "Shared SBI A/C 3109..." },
  { source: "v1", target: "v3", kind: "cobid", label: "Co-bidding (5 tenders)" },
  { source: "v6", target: "v2", kind: "cobid", label: "Co-bidding (2 tenders)" },
  { source: "v4", target: "v7", kind: "bank", label: "Verified Vendor Network" },
  { source: "v5", target: "v6", kind: "address", label: "Shared Billing Branch" },
];

export const agencies = [
  { id: "a1", name: "Bhopal Municipal Corporation", risk: 77, works: 48, state: "Madhya Pradesh" },
  { id: "a2", name: "Patna Smart City Ltd", risk: 84, works: 31, state: "Bihar" },
  { id: "a3", name: "PWD Varanasi Zone", risk: 62, works: 22, state: "Uttar Pradesh" },
  { id: "a4", name: "Guwahati Metro Region DA", risk: 71, works: 19, state: "Assam" },
  { id: "a5", name: "Chennai Corporation", risk: 21, works: 40, state: "Tamil Nadu" },
  { id: "a6", name: "Bengaluru BBMP (South)", risk: 34, works: 35, state: "Karnataka" },
];

export const utilisationTrend = [
  { quarter: "FY24 Q1", utilisation: 48, completion: 41, alerts: 62 },
  { quarter: "FY24 Q2", utilisation: 53, completion: 46, alerts: 71 },
  { quarter: "FY24 Q3", utilisation: 57, completion: 49, alerts: 66 },
  { quarter: "FY24 Q4", utilisation: 61, completion: 54, alerts: 58 },
  { quarter: "FY25 Q1", utilisation: 59, completion: 52, alerts: 81 },
  { quarter: "FY25 Q2", utilisation: 64, completion: 57, alerts: 74 },
];

export const capitalVelocity = [
  { stage: "CNA authorised", days: 0, amount: 100, predictedUnspent: 12, dwellDays: 0 },
  { stage: "SNA received", days: 18, amount: 86, predictedUnspent: 19, dwellDays: 18 },
  { stage: "District released", days: 41, amount: 61, predictedUnspent: 28, dwellDays: 23 },
  { stage: "Vendor paid", days: 67, amount: 44, predictedUnspent: 34, dwellDays: 26 },
];

export const scstNational = {
  scMandate: 15.0,
  stMandate: 7.5,
  scActual: 12.4,
  stActual: 6.1,
};

export const sanctions = [
  { id: "s1", work: "Community hall, Berasia", constituency: "Bhopal", vendor: "Aarav Infra Projects", vendorId: "v1", amountCr: 0.48, daysRemaining: 4, risk: 86, category: "Community Assets" },
  { id: "s2", work: "PHC upgrade, Huzur", constituency: "Bhopal", vendor: "Narmada Civil Works", vendorId: "v2", amountCr: 0.72, daysRemaining: 9, risk: 74, category: "Health & Sanitation" },
  { id: "s3", work: "Street lighting, Kolar", constituency: "Bhopal", vendor: "Malwa Electricals", vendorId: "v5", amountCr: 0.31, daysRemaining: 16, risk: 48, category: "Public Utilities" },
  { id: "s4", work: "School toilets, Govindpura", constituency: "Bhopal", vendor: "Vindhya Buildcon", vendorId: "v4", amountCr: 0.22, daysRemaining: 22, risk: 33, category: "Education" },
  { id: "s5", work: "CC road, Ayodhya Bypass", constituency: "Bhopal", vendor: "Satpura Roads Ltd", vendorId: "v3", amountCr: 0.91, daysRemaining: 31, risk: 61, category: "Roads & Pathways" },
  { id: "s6", work: "Anganwadi, Ratibad", constituency: "Bhopal", vendor: "Ganga Jal Nigam JV", vendorId: "v6", amountCr: 0.18, daysRemaining: 38, risk: 79, category: "Child Welfare" },
];

export const alertsInitial = [
  {
    id: "al1",
    title: "Duplicate asset within 180m H3 cell",
    type: "Spatial conflict",
    severity: "critical",
    timestamp: "2026-09-04T08:12:00+05:30",
    entity: "Community hall, Berasia",
    explanation:
      "Proposed coordinates fall in the same H3 resolution-9 cell as an existing MPLADS community hall marked completed in 2024. SHAP attributes 41% of the score to spatial overlap and 22% to vendor network risk.",
    shap: [
      { feature: "H3 cell overlap (180m)", value: 0.41 },
      { feature: "Vendor network risk", value: 0.22 },
      { feature: "Same implementing agency", value: 0.11 },
      { feature: "Utilisation lag", value: 0.08 },
      { feature: "Historical FP rate", value: -0.06 },
    ],
    evidence: [
      "Map screenshot · Hex #89a12c8b3 (Berasia Ward 4)",
      "Sanction Order PDF #MP-BPL-2024-098 page 2",
      "Geo-tagged inspection photo dated 2024-11-14",
    ],
    disposition: "pending",
  },
  {
    id: "al2",
    title: "Vendor cluster sharing bank account",
    type: "Network anomaly",
    severity: "critical",
    timestamp: "2026-09-04T07:40:00+05:30",
    entity: "Aarav Infra Projects & Narmada Civil",
    explanation:
      "Three vendors across Bhopal and Jabalpur share the same beneficiary account. Combined contract value is ₹78.2 Cr with elevated overrun frequency.",
    shap: [
      { feature: "Shared bank account", value: 0.36 },
      { feature: "Combined contract value", value: 0.18 },
      { feature: "Co-bidding density", value: 0.14 },
      { feature: "GST vintage (>5 yrs)", value: -0.05 },
    ],
    evidence: [
      "PFMS beneficiary extract A/C #HDFC00010928",
      "D3 graph cluster hull A (Collusion coefficient 0.87)",
      "Tender bidding timestamp overlap log",
    ],
    disposition: "pending",
  },
  {
    id: "al3",
    title: "SC allocation below 15% mandate",
    type: "Compliance",
    severity: "elevated",
    timestamp: "2026-09-03T18:05:00+05:30",
    entity: "Bhopal District Authority",
    explanation:
      "Year-to-date SC earmarking is 11.2% against the 15% national mandate. Trajectory models a 2.1 pp shortfall by fiscal close if current sanctions hold.",
    shap: [
      { feature: "SC share of sanctions", value: 0.29 },
      { feature: "Pipeline composition", value: 0.16 },
      { feature: "Prior-year catch-up buffer", value: -0.07 },
    ],
    evidence: [
      "District allocation ledger FY25-26",
      "Mandate compliance tracker sheet",
    ],
    disposition: "pending",
  },
  {
    id: "al4",
    title: "GatiShakti restricted-zone intersection",
    type: "Spatial conflict",
    severity: "elevated",
    timestamp: "2026-09-03T11:22:00+05:30",
    entity: "CC road, Ayodhya Bypass",
    explanation:
      "Alignment clips an ecological buffer on the PM GatiShakti National Master Plan layer. Amber hexes indicate restricted ecological zone, not duplicate conflict.",
    shap: [
      { feature: "Ecological buffer overlap", value: 0.33 },
      { feature: "Corridor setback distance", value: 0.12 },
      { feature: "Prior clearances buffer", value: -0.10 },
    ],
    evidence: [
      "PM GatiShakti Forest Eco-layer KMZ",
      "Ayodhya Bypass alignment survey shapefile",
    ],
    disposition: "pending",
  },
  {
    id: "al5",
    title: "Unspent balance velocity stall",
    type: "Fund flow",
    severity: "info",
    timestamp: "2026-09-02T16:44:00+05:30",
    entity: "SNA Madhya Pradesh",
    explanation:
      "Authorised funds have dwelt at SNA for 23 days versus a 12-day median. Model predicts ₹18.4 Cr additional unspent if release does not occur this week.",
    shap: [
      { feature: "SNA dwell time (23d)", value: 0.27 },
      { feature: "Seasonal release pattern", value: 0.09 },
      { feature: "Pending sanctions queue", value: 0.08 },
    ],
    evidence: [
      "PFMS SNA Treasury dashboard transaction dump",
    ],
    disposition: "pending",
  },
];

export const mpBudget = {
  totalCr: 5.0,
  spent: 1.86,
  committed: 1.42,
  available: 1.72,
  spentPercent: 37.2,
  committedPercent: 28.4,
  availablePercent: 34.4,
};

export const mpProjects = [
  { id: "p1", name: "Community hall, Berasia", stage: "Recommended", amountCr: 0.48, expectedDate: "2027-03-12", delayDays: 0, risk: 86, category: "Community", lat: 23.634, lng: 77.433 },
  { id: "p2", name: "PHC upgrade, Huzur", stage: "Recommended", amountCr: 0.72, expectedDate: "2027-01-20", delayDays: 34, risk: 74, category: "Health", lat: 23.298, lng: 77.382 },
  { id: "p3", name: "School toilets, Govindpura", stage: "Sanctioned", amountCr: 0.22, expectedDate: "2026-12-02", delayDays: 0, risk: 33, category: "Education", lat: 23.275, lng: 77.461 },
  { id: "p4", name: "Street lighting, Kolar", stage: "Sanctioned", amountCr: 0.31, expectedDate: "2026-11-18", delayDays: 12, risk: 48, category: "Lighting", lat: 23.176, lng: 77.425 },
  { id: "p5", name: "CC road, Ayodhya Bypass", stage: "In Progress", amountCr: 0.91, expectedDate: "2026-10-30", delayDays: 8, risk: 61, category: "Roads", lat: 23.242, lng: 77.481 },
  { id: "p6", name: "Anganwadi, Ratibad", stage: "In Progress", amountCr: 0.18, expectedDate: "2026-09-28", delayDays: 0, risk: 79, category: "Child Welfare", lat: 23.155, lng: 77.319 },
  { id: "p7", name: "Drinking water RO, Bairagarh", stage: "Completed", amountCr: 0.40, expectedDate: "2026-06-14", delayDays: 0, risk: 18, category: "Water", lat: 23.284, lng: 77.332 },
  { id: "p8", name: "Paver drain, Arera Colony", stage: "Completed", amountCr: 0.27, expectedDate: "2026-05-02", delayDays: 0, risk: 12, category: "Sanitation", lat: 23.212, lng: 77.438 },
];

export const districts = [
  { id: "d1", name: "Bhopal", utilisation: 41, sanctionDays: 39, completion: 38, anomalies: 14, scPct: 11.2, stPct: 5.4, totalWorks: 78, unspentCr: 4.8 },
  { id: "d2", name: "Indore", utilisation: 62, sanctionDays: 22, completion: 57, anomalies: 6, scPct: 14.1, stPct: 6.8, totalWorks: 92, unspentCr: 3.2 },
  { id: "d3", name: "Jabalpur", utilisation: 48, sanctionDays: 31, completion: 44, anomalies: 9, scPct: 12.8, stPct: 8.1, totalWorks: 64, unspentCr: 4.1 },
  { id: "d4", name: "Gwalior", utilisation: 71, sanctionDays: 18, completion: 66, anomalies: 3, scPct: 15.4, stPct: 7.6, totalWorks: 85, unspentCr: 1.8 },
  { id: "d5", name: "Rewa", utilisation: 36, sanctionDays: 44, completion: 31, anomalies: 11, scPct: 10.6, stPct: 9.2, totalWorks: 52, unspentCr: 5.3 },
  { id: "d6", name: "Sagar", utilisation: 58, sanctionDays: 26, completion: 53, anomalies: 5, scPct: 13.9, stPct: 7.1, totalWorks: 59, unspentCr: 3.0 },
  { id: "d7", name: "Ujjain", utilisation: 67, sanctionDays: 20, completion: 61, anomalies: 4, scPct: 16.2, stPct: 6.4, totalWorks: 71, unspentCr: 2.2 },
];

export const stateTrend = [
  { month: "Apr", utilisation: 44, completion: 39, alerts: 28 },
  { month: "May", utilisation: 47, completion: 41, alerts: 31 },
  { month: "Jun", utilisation: 51, completion: 44, alerts: 24 },
  { month: "Jul", utilisation: 50, completion: 46, alerts: 33 },
  { month: "Aug", utilisation: 55, completion: 49, alerts: 29 },
  { month: "Sep", utilisation: 58, completion: 52, alerts: 22 },
];

export const existingWorksSpatial = [
  { id: "w1", name: "Community hall (2024)", status: "Completed", q: 3, r: 2, distanceM: 0, year: 2024, costCr: 0.45 },
  { id: "w2", name: "PHC Sub-centre wing", status: "In Progress", q: 5, r: 1, distanceM: 420, year: 2025, costCr: 0.65 },
  { id: "w3", name: "Govt School block", status: "Sanctioned", q: 1, r: 4, distanceM: 850, year: 2026, costCr: 0.30 },
  { id: "w4", name: "Drainage package #4", status: "Completed", q: 6, r: 4, distanceM: 1200, year: 2023, costCr: 0.25 },
];

export const duplicateHexes = new Set(["3,2"]);
export const restrictedHexes = new Set(["2,1", "4,3", "7,2"]);

// Quick mock helper functions
export const getConstituencyById = (id) => constituencies.find((c) => c.id === id) || constituencies[0];
export const getVendorById = (id) => vendors.find((v) => v.id === id) || vendors[0];
export const getDistrictByName = (name) => districts.find((d) => d.name.toLowerCase() === name.toLowerCase()) || districts[0];
