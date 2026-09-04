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

**2. Install dependencies:**
```bash
pip install -r backend/requirements.txt
```

**3. Run the backend + dashboard:**
```bash
python run.py
```
Open **http://localhost:5000** for the Satark dashboard, or **http://localhost:5000/antigravity/** for the Antigravity UI.

The database auto-seeds synthetic fraud scenarios on first run.

**4. Frontend (Next.js scaffold, optional):**
```bash
cd frontend
npm install
npm run dev
```

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
