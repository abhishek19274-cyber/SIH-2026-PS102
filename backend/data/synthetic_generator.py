"""Seed the demo DB with realistic MPLAD fraud patterns.

Creates 30 projects, 18 vendors (some sharing bank/address/PAN to trigger
the graph engine's cartel detection), ~120 transactions with planted
anomalies, documents, and pre-scored alerts so the dashboard works on
first boot.
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import datetime
import hashlib
import random
from backend.models import Project, Vendor, Transaction, Document, Alert

random.seed(42)

# ---------------------------------------------------------------------------
# Reference data
# ---------------------------------------------------------------------------
STATES = [
    ("Maharashtra", "Pune", "Baramati"),
    ("Maharashtra", "Nagpur", "Nagpur"),
    ("Maharashtra", "Wardha", "Wardha"),
    ("Uttar Pradesh", "Lucknow", "Lucknow"),
    ("Uttar Pradesh", "Varanasi", "Varanasi"),
    ("Bihar", "Patna", "Patna Sahib"),
    ("Karnataka", "Bengaluru Rural", "Kanakapura"),
    ("Tamil Nadu", "Coimbatore", "Coimbatore"),
    ("Rajasthan", "Jaipur", "Jaipur"),
    ("West Bengal", "Kolkata", "Kolkata North"),
    ("Kerala", "Ernakulam", "Ernakulam"),
    ("Madhya Pradesh", "Bhopal", "Bhopal"),
    ("Delhi", "New Delhi", "New Delhi"),
    ("Assam", "Kamrup", "Guwahati"),
]

MP_NAMES = [
    "Rajesh Kumar", "Priya Sharma", "Sunil Patil", "Meena Devi",
    "Arvind Yadav", "Lakshmi Nair", "Vikas Gupta", "Sneha Reddy",
    "Deepak Joshi", "Asha Kumari", "Ravi Shankar", "Nandini Murthy",
    "Mohammed Irfan", "Swati Deshmukh",
]

WORK_CATEGORIES = [
    "Road Construction", "Drinking Water", "Solar Street Light",
    "Community Hall", "Sanitation Block", "School Infrastructure",
    "Borewell Drilling", "Drainage System", "Park Development",
    "Health Infrastructure",
]

WORK_DESCRIPTIONS = [
    "Construction of CC road from village chowk to NH junction",
    "Installation of RO drinking water purifier at Gram Panchayat office",
    "Installation of 20 solar street lights along panchayat road",
    "Construction of community hall with capacity 200 persons",
    "Construction of sanitary complex with incinerator unit",
    "Supply and installation of 50 dual desks at primary school",
    "Borewell drilling 150mm dia and pump installation",
    "Storm-water drainage channel lining near market area",
    "Development of public park with walking track and benches",
    "Construction of sub-health centre waiting hall",
    "Bituminous road overlay of internal village roads",
    "Installation of overhead water tank and pipeline",
    "Construction of public toilet block with biogas plant",
    "Paver block interlocking at bus stand area",
    "Installation of CCTV surveillance in market area",
    "Construction of boundary wall for government school",
    "Repair and renovation of Anganwadi centre",
    "Solar pump set for community irrigation",
    "Construction of cremation shed with platform",
    "Open gym equipment installation at community ground",
    "Footpath construction along main village road",
    "Rainwater harvesting structure at school premises",
    "Construction of public library reading room",
    "Speed-breaker and signage on accident-prone stretch",
    "LED flood-lighting of sports ground",
    "Cattle trough and drinking water point at mandi",
    "Construction of waiting shed at bus stop",
    "Repair of hand pumps and bore-wells cluster",
    "Multi-purpose digital literacy centre",
    "E-rickshaw charging station with solar canopy",
]

MATERIAL_CATEGORIES = [
    "structural_steel", "cement_rcc_m20", "solar_street_light_12w",
    "bituminous_road_work", "interlocking_paver_blocks",
    "borewell_drilling_150mm", "submersible_pump_3hp",
    "drinking_water_purifier_ro", "school_dual_desk",
    "sanitary_napkin_incinerator",
]

AGENCIES = [
    "District Administration", "Gram Panchayat", "Zila Parishad",
    "PWD Division", "State Jal Board", "Municipal Corporation",
]

CARTEL_PREFIX = ["Apex", "Prime", "Vertex", "Summit", "Zenith", "Crest", "Pinnacle"]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
_sha = lambda s: hashlib.sha256(s.encode()).hexdigest()

def _date(y, m, d):
    return datetime.date(y, m, d)

def _rand_date(start, end):
    delta = (end - start).days
    return start + datetime.timedelta(days=random.randint(0, max(delta, 1)))

def _lat_lng(state_name):
    centroids = {
        "Maharashtra": (19.0, 75.5), "Uttar Pradesh": (27.0, 80.9),
        "Bihar": (25.6, 85.1), "Karnataka": (12.9, 77.5),
        "Tamil Nadu": (11.0, 76.9), "Rajasthan": (26.9, 75.8),
        "West Bengal": (22.6, 88.4), "Kerala": (10.0, 76.3),
        "Madhya Pradesh": (23.3, 77.4), "Gujarat": (23.0, 72.6),
        "Delhi": (28.6, 77.2), "Assam": (26.1, 91.7),
    }
    lat, lng = centroids.get(state_name, (22.0, 78.0))
    return round(lat + random.uniform(-0.5, 0.5), 4), round(lng + random.uniform(-0.5, 0.5), 4)

# ---------------------------------------------------------------------------
# Core generator
# ---------------------------------------------------------------------------
def generate_demo_data(session, BenchmarkService):
    from services.geo_engine import latlng_to_h3

    # ── 1. Vendors (18) ──────────────────────────────────────────────────
    vendor_data = []
    shared_bank_hash = _sha("BANK-ACB-778899")
    shared_addr = "Plot 42, MIDC Phase 2, Nagpur, Maharashtra"
    shared_pan = _sha("ABCDE1234F")

    for i in range(1, 19):
        # Ring 1: Bank & Address sharing (Nagpur cartel)
        is_cartel_a = i in (1, 2, 3)
        # Ring 2: PAN sharing (UP cartel)
        is_cartel_b = i in (5, 6)

        name = f"Vendor-{i:03d} {'Infra' if i%2==0 else 'Traders'}"
        if is_cartel_a: name = f"{CARTEL_PREFIX[i%len(CARTEL_PREFIX)]} Enterprises Pvt Ltd"
        if is_cartel_b: name = f"Shree Krishna Construction {i}"

        v = Vendor(
            vendor_id=i,
            business_name=name,
            gstin_number=f"27ABCDE{i:04d}F1Z{i % 10}",
            pan_hash=shared_pan if is_cartel_b else _sha(f"PAN-{i}"),
            bank_account_hash=shared_bank_hash if is_cartel_a else _sha(f"BANK-{i}"),
            registered_address=shared_addr if is_cartel_a else f"{10 + i} Industrial Area, Sector {i}, City-{i}",
            registered_phone_hash=_sha(f"PHONE-{i}"),
            lifetime_risk_score=0.0,
            cartel_group_id=None,
            state="Maharashtra" if is_cartel_a else "Uttar Pradesh" if is_cartel_b else STATES[i % len(STATES)][0],
        )
        vendor_data.append(v)
        session.add(v)

    # ── 2. Projects (30) ─────────────────────────────────────────────────
    project_data = []
    for i in range(1, 31):
        state, district, constituency = STATES[(i-1) % len(STATES)]

        # Force a geo duplicate for project 5 vs 6
        if i == 6:
            state, district, constituency = STATES[(4) % len(STATES)]
            lat, lng = project_data[4].latitude + 0.0003, project_data[4].longitude + 0.0001
            p_cat = project_data[4].work_category
        # Force an eco-zone conflict for project 12
        elif i == 12:
            lat, lng = 20.3, 79.3 # Tadoba buffer approx (h9_13933_52600)
            p_cat = WORK_CATEGORIES[(i-1) % len(WORK_CATEGORIES)]
        else:
            lat, lng = _lat_lng(state)
            p_cat = WORK_CATEGORIES[(i-1) % len(WORK_CATEGORIES)]

        sanction = _rand_date(_date(2024, 4, 1), _date(2025, 6, 30))
        # Plant monsoon sanctions
        if i in (10, 15):
            sanction = _date(2024, 7, 15)

        expected = sanction + datetime.timedelta(days=random.choice([180, 270, 365]))
        p = Project(
            project_id=i,
            constituency=constituency,
            district=district,
            state=state,
            mp_name=MP_NAMES[(i-1) % len(MP_NAMES)],
            house_type="Lok Sabha" if i % 5 != 0 else "Rajya Sabha",
            work_description=WORK_DESCRIPTIONS[(i-1) % len(WORK_DESCRIPTIONS)],
            work_category=p_cat,
            sanctioned_amount=round(random.uniform(15_00_000, 75_00_000), 0),
            disbursed_amount=0.0,
            latitude=lat,
            longitude=lng,
            h3_index=latlng_to_h3(lat, lng),
            project_status=random.choice(["Sanctioned", "In Progress", "Completed"]),
            sanction_date=sanction,
            expected_completion=expected,
            actual_completion=expected + datetime.timedelta(days=random.randint(0, 90)) if random.random() < 0.3 else None,
            implementing_agency=random.choice(AGENCIES),
            sc_area=random.random() < 0.25,
            st_area=random.random() < 0.15,
            photo_uploaded=random.random() > 0.3,
            delay_probability=round(random.uniform(0.05, 0.65), 3),
            zone_flag=None,
        )
        project_data.append(p)
        session.add(p)

    session.flush()

    # ── 3. Transactions (~120) with planted fraud patterns ───────────────
    txn_data = []
    txn_id = 0

    from services.benchmark_service import BenchmarkService as BS

    for p in project_data:
        n_txns = random.randint(3, 6)
        for _ in range(n_txns):
            txn_id += 1
            # Push cartel vendors to same projects to trigger circular co-bidding
            if p.project_id % 3 == 0:
                vendor = vendor_data[random.choice([0, 1, 2])]
            elif p.project_id % 4 == 0:
                vendor = vendor_data[random.choice([4, 5])]
            else:
                vendor = random.choice(vendor_data)

            mat = random.choice(MATERIAL_CATEGORIES)
            bm = BS.get_benchmark(mat, p.state)
            bench_cost = bm["benchmark_unit_cost"]

            fraud_roll = random.random()
            unit_cost = bench_cost
            inv_date = _rand_date(p.sanction_date or _date(2024, 6, 1), _date(2025, 12, 31))
            quantity = round(random.uniform(5, 150), 1)

            if fraud_roll < 0.15:
                # Cost inflation
                unit_cost = round(bench_cost * random.uniform(1.25, 1.60), 2)
            elif fraud_roll < 0.25:
                # Invoice before sanction
                inv_date = (p.sanction_date or _date(2024, 6, 1)) - datetime.timedelta(days=random.randint(5, 45))
            elif fraud_roll < 0.35:
                # March rush
                inv_date = _date(2025, 3, random.randint(15, 31))
                p.photo_uploaded = False # trigger missing photo
            else:
                unit_cost = round(bench_cost * random.uniform(0.92, 1.10), 2)

            invoice_amount = round(unit_cost * quantity, 2)

            # Split invoicing
            if vendor.vendor_id in (1, 2, 3) and random.random() < 0.40:
                invoice_amount = round(random.uniform(490000, 499500), 2)
                unit_cost = round(invoice_amount / max(quantity, 1), 2)

            t = Transaction(
                transaction_id=txn_id,
                project_id=p.project_id,
                vendor_id=vendor.vendor_id,
                invoice_number=f"INV-{p.state[:2].upper()}-{txn_id:05d}",
                invoice_amount=invoice_amount,
                material_category=mat,
                unit_cost=unit_cost,
                quantity=quantity,
                unit_measure=bm["unit"],
                transaction_date=inv_date,
                payment_stage=random.choice(["Milestone 1", "Milestone 2", "Final"]),
                is_flagged=False,
                anomaly_score=0.0,
            )
            txn_data.append(t)
            session.add(t)
            p.disbursed_amount = round((p.disbursed_amount or 0) + invoice_amount, 2)

    session.flush()

    # ── 4. Documents ─────────────────────────────────────────────────────
    for t in txn_data:
        doc = Document(
            transaction_id=t.transaction_id,
            project_id=t.project_id,
            document_type=random.choice(["Invoice", "Utilisation Certificate", "Work Order"]),
            storage_uri=f"/demo/docs/{t.invoice_number}.pdf",
            extracted_text=f"Invoice {t.invoice_number} amount ₹{t.invoice_amount:,.2f} for {t.material_category}",
            extracted_entities={
                "amount": t.invoice_amount,
                "vendor": t.vendor_id,
                "material": t.material_category,
            },
            ocr_confidence=round(random.uniform(0.82, 0.99), 3),
            discrepancy_detected=random.random() < 0.12,
            discrepancy_details="Amount mismatch between header and line total" if random.random() < 0.12 else None,
        )
        session.add(doc)

    # ── 5. Score transactions & vendors → create alerts ──────────────────
    from services.anomaly_engine import TabularAnomalyEngine
    from services.graph_engine import GraphEngine
    from services.geo_engine import GeoEngine

    anomaly_eng = TabularAnomalyEngine()
    graph_eng = GraphEngine()
    geo_eng = GeoEngine()

    projects_by_id = {p.project_id: p for p in project_data}
    vendors_by_id = {v.vendor_id: v for v in vendor_data}

    # Geo eco-zone check
    for p in project_data:
        zone = geo_eng.zone_conflict(p.h3_index)
        if zone:
            p.zone_flag = zone
            alert = Alert(
                project_id=p.project_id,
                alert_type="Restricted Geo-Zone Conflict",
                severity="CRITICAL",
                natural_language_summary=f"Project GPS overlaps with GatiShakti restricted area: {zone}",
            )
            session.add(alert)

        dups = geo_eng.find_duplicates(project_data, p.latitude, p.longitude, p.work_category, exclude_id=p.project_id)
        if dups:
            alert = Alert(
                project_id=p.project_id,
                alert_type="Spatial Duplication Check",
                severity="HIGH",
                natural_language_summary=f"Found {len(dups)} existing {p.work_category} works within 120m radius.",
            )
            session.add(alert)

    scores = anomaly_eng.score_all(txn_data, projects_by_id, vendors_by_id)
    for t in txn_data:
        s = scores.get(t.transaction_id)
        if s:
            t.anomaly_score = s["anomaly_score"]
            t.is_flagged = s["is_flagged"]
            t.flag_reason = s["flag_reason"]
            if s["is_flagged"] and s.get("narrative"):
                alert = Alert(
                    project_id=t.project_id,
                    vendor_id=t.vendor_id,
                    alert_type=s["flag_reason"] or "Financial Anomaly",
                    severity="CRITICAL" if s["anomaly_score"] >= 0.70 else "HIGH",
                    shap_explanation=s["shap"],
                    natural_language_summary=s["narrative"],
                )
                session.add(alert)

    graph = graph_eng.build(vendor_data, txn_data, project_data)
    for v in vendor_data:
        gs = graph_eng.score_vendor(v.vendor_id, graph)
        if gs:
            v.lifetime_risk_score = gs["lifetime_risk_score"]
            v.cartel_group_id = gs["cartel_group_id"]
            if gs["lifetime_risk_score"] >= 0.40 and gs.get("narrative"):
                alert = Alert(
                    vendor_id=v.vendor_id,
                    alert_type="Vendor Cartel / Bid-Rigging",
                    severity="CRITICAL",
                    shap_explanation=gs["shap"],
                    natural_language_summary=gs["narrative"],
                )
                session.add(alert)

    for p in project_data:
        proj_txns = [t for t in txn_data if t.project_id == p.project_id]
        if proj_txns:
            max_anomaly = max(t.anomaly_score for t in proj_txns)
            avg_anomaly = sum(t.anomaly_score for t in proj_txns) / len(proj_txns)
            p.composite_risk_score = round(0.6 * max_anomaly + 0.4 * avg_anomaly, 3)

    session.commit()
    print(f"[SyntheticGenerator] Seeded {len(project_data)} projects, "
          f"{len(vendor_data)} vendors, {len(txn_data)} transactions.")
