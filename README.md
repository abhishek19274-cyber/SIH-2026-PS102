# SIH Problem Statement 102 — Satark-MPLAD (MPLAD Audit System)

**AI-Powered platform for detecting anomalies, fraud, and inefficiencies in the MPLADS scheme.**
Smart India Hackathon 2026 · PS SIH26102 · Ministry of Statistics & Programme Implementation (MoSPI)

Satark-MPLAD ingests MPLADS operational data and runs it through six intelligence engines
(tabular anomaly detection, graph cartel detection, geospatial deduplication, document
intelligence, predictive timeline analysis, and natural-language querying), delivering
explainable, role-based risk alerts to MPs, District Authorities, State Nodal Authorities,
and the Ministry.

## Repository Structure

```
backend/       Flask API + 6 intelligence engines
  app.py         App factory, blueprint registration
  config.py      Environment configuration
  models.py      SQLAlchemy ORM models (Project, Vendor, Transaction, Document, Alert, AuditLog)
  routes/        API blueprints (projects, vendors, transactions, alerts, dashboards, documents, nl_query)
  services/      Engines (anomaly, graph, geo, ocr, timeline, nl, benchmark, explainer)
  utils/         Hashing, validators, tamper-evident audit logger
  data/          Synthetic data generator + seed data
  requirements.txt
data/          Sample/mock datasets (mock_data.csv)
docs/          Architecture diagram + full team blueprint
frontend/      Dashboard UI (dashboard.html) + Antigravity build + Next.js scaffold
run.py         Entry point (run from repo root)
```

## Quick Start

**1. Clone:**
```bash
git clone https://github.com/abhishek19274-cyber/SIH-2026-PS102.git
cd SIH-2026-PS102
```

**2. Install Python dependencies:**
```bash
pip install -r backend/requirements.txt
```

**3. Run the backend + dashboard:**
```bash
python run.py
```
Open **http://localhost:5000**. Flask serves the built SPA from `frontend/dist` (committed in the repo) and the API under `/api/…`.

**Rebuild the React dashboard after frontend changes:**
```bash
cd frontend
npm install
npm run build
cd ..
```

The database auto-seeds synthetic fraud scenarios on first run.

**Optional — frontend hot-reload during UI work:**
```bash
cd frontend
npm run dev
```
Vite will proxy API calls; keep `python run.py` running on port 5000.

## Detection Engines

| Engine | Target | Location |
|---|---|---|
| Tabular Anomaly | Cost inflation, split invoices | `backend/services/anomaly_engine.py` |
| Graph Cartel | Vendor rings, bid-rigging | `backend/services/graph_engine.py` |
| Geo-Spatial | Duplicate/ghost works | `backend/services/geo_engine.py` |
| Document AI | Forged/backdated docs | `backend/services/ocr_engine.py` |
| Timeline | Delay prediction | `backend/services/timeline_engine.py` |
| NL Query | Plain-language audit | `backend/services/nl_engine.py` |

Every alert is explainable via SHAP-style attribution. AI flags, humans decide.

## `backend/services/` — Intelligence Engines (described from source)

Every engine produces a SHAP-style attribution waterfall (`ExplainerService.generate_shap_waterfall`) and an audit-ready narrative (`format_narrative`). The `benchmark_service` provides MoSPI regional cost benchmarks (eSankhyiki-style state-adjusted unit costs) used by the anomaly engine.

| File | What it does (actual behavior from source) | Key inputs / outputs |
|---|---|---|
| `anomaly_engine.py` | `TabularAnomalyEngine.score_transaction()` scores each invoice vs regional benchmarks (`benchmark_service.get_benchmark`). Checks: unit-cost deviation >12%, split invoices near ₹5L threshold within 48h, backdated invoice (before project sanction), March rush spike, missing progress photo on large disbursement (>₹2L). Returns `anomaly_score`, `is_flagged`, SHAP `shap`, `narrative`. | `transaction`, `project`, `vendor`, `sibling_invoices` → score + explanations |
| `graph_engine.py` | `GraphEngine.build()` creates adjacency from vendors (bank hash, address, PAN) + co-bidding. `score_vendor()` detects: shared bank/address/PAN clusters; circular co-bidding rings (co-bids only with linked vendors). `network_payload()` produces D3-compatible `{nodes, links, scores}`. | `vendors`, `transactions`, `projects` → cartel group IDs + network graph |
| `geo_engine.py` | `latlng_to_h3()` does H3-style hex indexing (~167m cells). `find_duplicates()` finds same-category works within 80m via haversine. `zone_conflict()` flags eco-sensitive cells (`RESTRICTED_ZONES`). `cluster_by_h3()` groups projects by cell. | `lat/lng`, `radius_m`, `projects` → duplicates + zone conflicts |
| `ocr_engine.py` | `OCREngine.parse_text()` extracts merchant, amount (₹ regex + Total/Amount), date, GSTIN, invoice number from raw text via regex. `cross_check()` compares against portal values; flags amount delta >₈1,000, backdated invoice (before sanction), GSTIN mismatch. | `raw_text`, `portal_amount/date/gstin`, `sanction_date` → discrepancies + SHAP |
| `timeline_engine.py` | `TimelineEngine.score_project()` predicts delay probability from: work-category prior (`CATEGORY_BASE`), implementing-agency completion rate, monsoon sanction season (Jun–Sep), large-ticket ≥₈3L. Produces Weibull survival curve (19 months) + expected completion date. | `project`, `all_projects` → `delay_probability`, `survival_curve` |
| `nl_engine.py` | `NLEngine.compile()` matches keywords to 11 SELECT-only SQL templates (critical Maharashtra, high-risk pending, cartel ring, Wardha, SC/ST, monsoon delays, overdue, split invoice, multi-agency vendors, etc.). Adds `constituency` filter for MP role. `is_select_only()` guard prevents writes. | `question`, `role` → `sql` (SELECT only) + summary |
| `benchmark_service.py` | `BenchmarkService.get_benchmark()` maps `material_category` to `REGIONAL_BENCHMARKS` (steel, RCC, road, solar, borewell, etc.) with `STATE_COST_MULTIPLIERS` per state. Returns unit cost + 15% upper threshold + source label. | `material_category`, `state` → benchmark values |
| `explainer.py` | `ExplainerService.generate_shap_waterfall()` crosses feature contributions into a waterfall (`base_value`, `final_score`, `attributions` with `start/end_value`). `format_narrative()` writes the audit message for an alert. | `base_val`, feature list → SHAP + narrative |

## Frontend ↔ Backend Integration (current state + how to wire)

- **Backend entry:** `run.py` / `backend/app.py` — creates Flask app, registers blueprints at prefixes (`/api/projects`, `/api/vendors`, `/api/transactions`, `/api/alerts`, `/api/nl_query`, `/api/dashboards`, `/api/documents`, `/`, `/antigravity`). DB auto-creates + seeds synthetic fraud scenarios on first run (`generate_demo_data`). Health endpoint at `/api/health`.
- **Dashboard UI:** `backend/routes/dashboard.py` renders `templates/dashboard.html` at `/`. **This file does not exist in the repo** — needs to be added or the route removed.
- **Antigravity frontend build:** `backend/routes/antigravity.py` serves `frontend/antigravity/index.html` + assets at `/antigravity/`. **`frontend/antigravity/` folder is not in repo** — only `frontend/package.json` + `frontend/src/services/api.js` (a `// TODO` stub) exist.
- **Next.js scaffold (`frontend/`):** `package.json` has `dev`/`build`/`start` (Next.js). `frontend/src/services/api.js` is an unimplemented axios/fetch wrapper. To integrate: initialize an axios instance pointing to `http://localhost:5000`, then call `/api/projects`, `/api/alerts`, `/api/nl_query` (POST with JSON body `{question}`), `/api/dashboards/ministry`, `/api/vendors/network`, etc.
- **CORS:** `flask_cors.CORS(app)` is attempted if installed (graceful fallback if missing).

### Recommended integration steps for teammates
1. Clone repo + install `backend/requirements.txt` (not root-level `requirements.txt`; it lives at `backend/requirements.txt`).
2. Run: `python run.py` → `http://localhost:5000` (dashboard at `/`) + `/antigravity/` (if directory present).
3. For the Next.js frontend in `frontend/`: `npm install` → populate `frontend/src/services/api.js` with axios instance baseURL `http://localhost:5000`, then import in pages that fetch `/api/*`.
4. If using `/antigravity/`: copy/checkout the `frontend/antigravity/` build (assets + index.html) into the repo — currently missing.

## Known gaps (do not assume working)
- `templates/dashboard.html` not present → `/` route will 500.
- `frontend/antigravity/` folder missing → `/antigravity/` will 404.
- `frontend/src/services/api.js` is `// TODO` → no frontend-to-backend calls implemented.
- `.gitignore` excludes `*.db`, `.venv/`, `node_modules/` — `satark_demo.db` and venv are not committed; DB seeds automatically on first `run.py` invocation (`generate_demo_data`).
- `README.md` previously listed `run.py`/`requirements.txt` "at root" — `requirements.txt` is only at `backend/requirements.txt`; `run.py` is at root.

