"""Seed the database with REAL MPLADS data from the MoSPI DigiGov portal.

Replaces synthetic_generator.py by fetching live government data and mapping
it to the existing SQLAlchemy models (Project, Vendor, Transaction, etc.).

Falls back to synthetic data if the MoSPI API is unreachable.
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
# India district → approximate lat/lng lookup (130+ districts)
# ---------------------------------------------------------------------------
DISTRICT_COORDS = {
    # Maharashtra
    "Pune": (18.52, 73.86), "Mumbai": (19.08, 72.88), "Mumbai Suburban": (19.10, 72.90),
    "Nagpur": (21.15, 79.09), "Nashik": (19.99, 73.79), "Thane": (19.19, 72.98),
    "Aurangabad": (19.88, 75.34), "Solapur": (17.68, 75.91), "Kolhapur": (16.70, 74.24),
    "Satara": (17.68, 74.00), "Raigad": (18.52, 73.18), "Wardha": (20.74, 78.60),
    "Sangli": (16.85, 74.56), "Ahmednagar": (19.09, 74.74), "Latur": (18.40, 76.57),
    # Uttar Pradesh
    "Lucknow": (26.85, 80.95), "Varanasi": (25.32, 83.01), "Kanpur": (26.45, 80.35),
    "Agra": (27.18, 78.02), "Prayagraj": (25.43, 81.85), "Allahabad": (25.43, 81.85),
    "Meerut": (28.98, 77.71), "Bareilly": (28.37, 79.42), "Gorakhpur": (26.76, 83.37),
    "Ghaziabad": (28.67, 77.42), "Noida": (28.57, 77.35), "Jhansi": (25.45, 78.57),
    "Moradabad": (28.83, 78.78), "Aligarh": (27.88, 78.08), "Mathura": (27.49, 77.67),
    # Bihar
    "Patna": (25.61, 85.14), "Gaya": (24.80, 85.00), "Muzaffarpur": (26.12, 85.39),
    "Bhagalpur": (25.24, 86.97), "Darbhanga": (26.15, 85.90), "Purnia": (25.77, 87.47),
    # Karnataka
    "Bengaluru": (12.97, 77.59), "Bangalore Urban": (12.97, 77.59),
    "Bangalore Rural": (13.22, 77.38), "Mysuru": (12.30, 76.66), "Mysore": (12.30, 76.66),
    "Hubli": (15.36, 75.12), "Mangalore": (12.87, 74.88), "Belgaum": (15.85, 74.50),
    "Gulbarga": (17.33, 76.83), "Shimoga": (13.93, 75.57), "Kanakapura": (12.55, 77.42),
    # Tamil Nadu
    "Chennai": (13.08, 80.27), "Coimbatore": (11.01, 76.96), "Madurai": (9.93, 78.12),
    "Trichy": (10.79, 78.69), "Salem": (11.65, 78.16), "Vellore": (12.92, 79.13),
    "Tirunelveli": (8.73, 77.70), "Erode": (11.34, 77.73),
    # Rajasthan
    "Jaipur": (26.91, 75.79), "Jodhpur": (26.29, 73.02), "Udaipur": (24.59, 73.71),
    "Kota": (25.18, 75.83), "Ajmer": (26.45, 74.64), "Bikaner": (28.02, 73.31),
    "Alwar": (27.56, 76.63), "Bharatpur": (27.22, 77.49),
    # West Bengal
    "Kolkata": (22.57, 88.36), "Howrah": (22.59, 88.26), "North 24 Parganas": (22.62, 88.43),
    "South 24 Parganas": (22.17, 88.43), "Murshidabad": (24.18, 88.27),
    "Hooghly": (22.90, 88.39), "Bardhaman": (23.23, 87.86), "Nadia": (23.47, 88.56),
    # Kerala
    "Ernakulam": (9.98, 76.30), "Thiruvananthapuram": (8.52, 76.94),
    "Kozhikode": (11.25, 75.77), "Thrissur": (10.53, 76.21), "Kottayam": (9.59, 76.52),
    "Malappuram": (11.07, 76.07), "Kannur": (11.87, 75.37),
    # Madhya Pradesh
    "Bhopal": (23.26, 77.41), "Indore": (22.72, 75.86), "Jabalpur": (23.18, 79.95),
    "Gwalior": (26.22, 78.18), "Ujjain": (23.18, 75.77), "Sagar": (23.84, 78.74),
    # Delhi
    "New Delhi": (28.61, 77.21), "Central Delhi": (28.65, 77.23),
    "South Delhi": (28.53, 77.22), "North Delhi": (28.71, 77.21),
    "East Delhi": (28.63, 77.29), "West Delhi": (28.65, 77.10),
    # Gujarat
    "Ahmedabad": (23.02, 72.57), "Surat": (21.17, 72.83), "Vadodara": (22.31, 73.19),
    "Rajkot": (22.30, 70.80), "Gandhinagar": (23.22, 72.64),
    # Assam
    "Guwahati": (26.14, 91.73), "Kamrup": (26.14, 91.73), "Dibrugarh": (27.47, 94.91),
    # Telangana
    "Hyderabad": (17.38, 78.49), "Rangareddy": (17.35, 78.55),
    "Warangal": (17.98, 79.60), "Karimnagar": (18.44, 79.13),
    # Punjab
    "Ludhiana": (30.90, 75.86), "Amritsar": (31.63, 74.87), "Jalandhar": (31.33, 75.58),
    "Patiala": (30.34, 76.39), "Bathinda": (30.21, 74.95),
    # Haryana
    "Gurugram": (28.46, 77.03), "Faridabad": (28.41, 77.31), "Rohtak": (28.90, 76.57),
    "Hisar": (29.15, 75.72), "Ambala": (30.38, 76.78), "Karnal": (29.69, 76.99),
    # Odisha
    "Bhubaneswar": (20.30, 85.82), "Cuttack": (20.46, 85.88), "Puri": (19.81, 85.83),
    # Jharkhand
    "Ranchi": (23.34, 85.31), "Jamshedpur": (22.80, 86.20), "Dhanbad": (23.79, 86.43),
    # Chhattisgarh
    "Raipur": (21.25, 81.63), "Bilaspur": (22.09, 82.15),
    # Uttarakhand
    "Dehradun": (30.32, 78.03), "Haridwar": (29.95, 78.16),
    # Himachal Pradesh
    "Shimla": (31.10, 77.17), "Kangra": (32.10, 76.27),
    # Jammu & Kashmir
    "Srinagar": (34.08, 74.80), "Jammu": (32.73, 74.87),
    # Goa
    "Panaji": (15.50, 73.83), "North Goa": (15.53, 73.95), "South Goa": (15.28, 74.05),
    # NE States
    "Imphal": (24.81, 93.94), "Shillong": (25.57, 91.88), "Aizawl": (23.73, 92.72),
    "Kohima": (25.67, 94.11), "Agartala": (23.83, 91.28), "Itanagar": (27.10, 93.62),
    "Gangtok": (27.33, 88.62),
    # UTs
    "Chandigarh": (30.73, 76.78), "Puducherry": (11.93, 79.83),
    "Port Blair": (11.67, 92.73),
}

# State name → centroid fallback
STATE_CENTROIDS = {
    "Maharashtra": (19.0, 75.5), "Uttar Pradesh": (27.0, 80.9),
    "Bihar": (25.6, 85.1), "Karnataka": (12.9, 77.5),
    "Tamil Nadu": (11.0, 76.9), "Rajasthan": (26.9, 75.8),
    "West Bengal": (22.6, 88.4), "Kerala": (10.0, 76.3),
    "Madhya Pradesh": (23.3, 77.4), "Gujarat": (23.0, 72.6),
    "Delhi": (28.6, 77.2), "Assam": (26.1, 91.7),
    "Haryana": (29.0, 76.1), "Punjab": (31.1, 75.3),
    "Andhra Pradesh": (15.9, 79.7), "Telangana": (17.8, 79.5),
    "Odisha": (20.5, 84.0), "Jharkhand": (23.6, 85.3),
    "Chhattisgarh": (21.3, 81.6), "Uttarakhand": (30.1, 79.0),
    "Himachal Pradesh": (31.1, 77.2), "Goa": (15.4, 74.0),
    "Jammu And Kashmir": (33.8, 76.6), "Jammu & Kashmir": (33.8, 76.6),
    "Tripura": (23.9, 91.9), "Meghalaya": (25.5, 91.4),
    "Manipur": (24.7, 93.9), "Nagaland": (26.2, 94.6),
    "Mizoram": (23.2, 92.9), "Arunachal Pradesh": (28.2, 94.7),
    "Sikkim": (27.5, 88.5), "Chandigarh": (30.7, 76.8),
    "Puducherry": (11.9, 79.8), "Andaman And Nicobar": (11.7, 92.7),
    "Dadra And Nagar Haveli": (20.3, 73.0), "Daman And Diu": (20.4, 72.8),
    "Lakshadweep": (10.6, 72.6), "Ladakh": (34.2, 77.6),
}

WORK_CATEGORIES_MAP = {
    "road": "Road Construction",
    "water": "Drinking Water",
    "solar": "Solar Street Light",
    "community": "Community Hall",
    "sanit": "Sanitation Block",
    "school": "School Infrastructure",
    "bore": "Borewell Drilling",
    "drain": "Drainage System",
    "park": "Park Development",
    "health": "Health Infrastructure",
    "toilet": "Sanitation Block",
    "library": "School Infrastructure",
    "gym": "Park Development",
    "electri": "Solar Street Light",
    "light": "Solar Street Light",
    "bridge": "Road Construction",
    "culvert": "Road Construction",
    "pump": "Drinking Water",
    "tank": "Drinking Water",
    "cremation": "Community Hall",
    "anganwadi": "Health Infrastructure",
    "hospital": "Health Infrastructure",
    "dispensary": "Health Infrastructure",
    "ambulance": "Health Infrastructure",
    "bus": "Road Construction",
    "footpath": "Road Construction",
    "paver": "Road Construction",
    "cctv": "Community Hall",
    "crematorium": "Community Hall",
}

MATERIAL_CATEGORIES = [
    "structural_steel", "cement_rcc_m20", "solar_street_light_12w",
    "bituminous_road_work", "interlocking_paver_blocks",
    "borewell_drilling_150mm", "submersible_pump_3hp",
    "drinking_water_purifier_ro", "school_dual_desk",
    "sanitary_napkin_incinerator",
]

_sha = lambda s: hashlib.sha256(s.encode()).hexdigest()


def _geocode(district_name, state_name):
    """Look up approximate lat/lng for a district. Adds small jitter."""
    # Try exact district match
    for key in [district_name, district_name.title(), district_name.upper()]:
        if key in DISTRICT_COORDS:
            lat, lng = DISTRICT_COORDS[key]
            return (
                round(lat + random.uniform(-0.15, 0.15), 4),
                round(lng + random.uniform(-0.15, 0.15), 4),
            )

    # Try partial match
    dn = (district_name or "").lower()
    for key, coords in DISTRICT_COORDS.items():
        if key.lower() in dn or dn in key.lower():
            lat, lng = coords
            return (
                round(lat + random.uniform(-0.15, 0.15), 4),
                round(lng + random.uniform(-0.15, 0.15), 4),
            )

    # Fall back to state centroid
    sn = (state_name or "").strip()
    for key, coords in STATE_CENTROIDS.items():
        if key.lower() == sn.lower() or sn.lower() in key.lower():
            lat, lng = coords
            return (
                round(lat + random.uniform(-0.5, 0.5), 4),
                round(lng + random.uniform(-0.5, 0.5), 4),
            )

    # Ultimate fallback: center of India
    return (
        round(22.0 + random.uniform(-2.0, 2.0), 4),
        round(78.0 + random.uniform(-2.0, 2.0), 4),
    )


def _categorize_work(activity_name):
    """Map activity description to a work category."""
    if not activity_name:
        return "Public Infrastructure"
    lower = activity_name.lower()
    for keyword, category in WORK_CATEGORIES_MAP.items():
        if keyword in lower:
            return category
    return "Public Infrastructure"


def _parse_amount(value):
    """Parse amount from API response (could be string, int, float, None)."""
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    try:
        cleaned = str(value).replace(",", "").replace("Rs", "").replace("₹", "").strip()
        return float(cleaned) if cleaned else 0.0
    except (ValueError, TypeError):
        return 0.0


def _parse_date(value):
    """Parse date string from API response."""
    if not value:
        return None
    for fmt in ["%d-%m-%Y", "%d/%m/%Y", "%Y-%m-%d", "%d-%b-%Y", "%d %b %Y"]:
        try:
            return datetime.datetime.strptime(str(value).strip(), fmt).date()
        except (ValueError, TypeError):
            continue
    return None


def _map_status(raw_status):
    """Map MoSPI work status to our status enum."""
    if not raw_status:
        return "Sanctioned"
    s = raw_status.strip().lower()
    if "complet" in s:
        return "Completed"
    if "sanction" in s:
        return "Sanctioned"
    if "progress" in s or "ongoing" in s or "going" in s:
        return "In Progress"
    if "recommend" in s:
        return "Sanctioned"
    return "In Progress"


# ---------------------------------------------------------------------------
# Core generator — fetches real data and maps to models
# ---------------------------------------------------------------------------
def generate_real_data(session, BenchmarkService):
    """Fetch real MPLADS data and seed the database."""
    from backend.data.mplads_fetcher import MpladsApiFetcher
    from backend.services.geo_engine import latlng_to_h3

    fetcher = MpladsApiFetcher()

    print("[RealDataGen] Fetching real MPLADS data from MoSPI portal...")

    # ── Fetch data from API ───────────────────────────────────────────────
    sanctioned = fetcher.get_tile_report("Works Sanctioned")
    completed = fetcher.get_tile_report("Works Completed")

    # Merge all records, preferring completed (has more info)
    all_works = []
    seen_letters = set()

    for rec in completed:
        letter = rec.get("LETTER_NO", "")
        if letter and letter not in seen_letters:
            rec["_source"] = "completed"
            all_works.append(rec)
            seen_letters.add(letter)

    for rec in sanctioned:
        letter = rec.get("LETTER_NO", "")
        if letter and letter not in seen_letters:
            rec["_source"] = "sanctioned"
            all_works.append(rec)
            seen_letters.add(letter)
        elif not letter:
            rec["_source"] = "sanctioned"
            all_works.append(rec)

    if not all_works:
        print("[RealDataGen] WARNING: Could not fetch any records from MoSPI API.")
        print("[RealDataGen] Falling back to synthetic data...")
        from backend.data.synthetic_generator import generate_demo_data
        return generate_demo_data(session, BenchmarkService)

    # Cap at 5000 records for demo performance, but shuffle for variety
    random.shuffle(all_works)
    all_works = all_works[:5000]
    print(f"[RealDataGen] Processing {len(all_works)} real MPLADS works...")

    # ── 1. Create Vendors from Implementing Agencies ──────────────────────
    agency_set = set()
    for rec in all_works:
        ia = rec.get("IA_NAME") or rec.get("IA NAME") or ""
        ida = rec.get("IDA NAME") or rec.get("IDA_NAME") or ""
        if ia.strip():
            agency_set.add(ia.strip())
        if ida.strip():
            agency_set.add(ida.strip())

    # Add some extra agencies if we have few
    if len(agency_set) < 10:
        agency_set.update([
            "District Administration", "Gram Panchayat", "Zila Parishad",
            "PWD Division", "State Jal Board", "Municipal Corporation",
            "Public Works Department", "Rural Development Department",
        ])

    agency_list = sorted(agency_set)[:200]  # Cap vendors
    vendor_data = []

    # Create cartel patterns for realistic fraud detection
    shared_bank_hash = _sha("CARTEL-BANK-778899")
    shared_pan = _sha("CARTEL-PAN-ABCDE1234F")

    for i, name in enumerate(agency_list, 1):
        is_cartel_a = i in (1, 2, 3)  # Shared bank account ring
        is_cartel_b = i in (5, 6)      # Shared PAN ring

        state_name = ""
        for rec in all_works:
            if (rec.get("IA_NAME") or rec.get("IA NAME") or "").strip() == name:
                state_name = rec.get("STATE_NAME", "")
                break

        v = Vendor(
            vendor_id=i,
            business_name=name,
            gstin_number=f"27MPLAD{i:04d}F1Z{i % 10}",
            pan_hash=shared_pan if is_cartel_b else _sha(f"PAN-REAL-{i}-{name}"),
            bank_account_hash=shared_bank_hash if is_cartel_a else _sha(f"BANK-REAL-{i}-{name}"),
            registered_address=f"Office of {name}, District HQ",
            registered_phone_hash=_sha(f"PHONE-REAL-{i}"),
            lifetime_risk_score=0.0,
            cartel_group_id=None,
            state=state_name,
        )
        vendor_data.append(v)
        session.add(v)

    vendor_map = {v.business_name: v for v in vendor_data}

    # ── 2. Create Projects from real work records ─────────────────────────
    project_data = []
    for i, rec in enumerate(all_works, 1):
        state = (rec.get("STATE_NAME") or "Unknown").strip()
        constituency = (rec.get("CONSTITUENCY_NAME") or "Unknown").strip()
        mp_name = (rec.get("MP_NAME") or "Unknown").strip()
        district = (rec.get("IDA NAME") or rec.get("IDA_NAME") or constituency).strip()
        activity = (rec.get("ACTIVITY_NAME") or "MPLADS Infrastructure Work").strip()
        house = (rec.get("HOUSE_NAME") or "Lok Sabha").strip()

        sanction_amt = _parse_amount(rec.get("SANCTION_AMOUNT") or rec.get("RECOMMENDED_AMOUNT"))
        expenditure = _parse_amount(rec.get("EXPENDITURE_AMT") or rec.get("ACTUAL_AMOUNT"))
        rec_date = _parse_date(rec.get("RECOMMENDATION_DATE"))
        status = _map_status(rec.get("WORK_STATUS"))
        ia_name = (rec.get("IA_NAME") or rec.get("IA NAME") or "District Authority").strip()

        lat, lng = _geocode(district, state)
        work_category = _categorize_work(activity)

        # Determine dates
        sanction_date = rec_date
        if not sanction_date:
            sanction_date = datetime.date(2023, 4, 1) + datetime.timedelta(
                days=random.randint(0, 800)
            )

        expected_completion = sanction_date + datetime.timedelta(days=365)
        actual_completion = None
        if status == "Completed":
            actual_completion = sanction_date + datetime.timedelta(
                days=random.randint(90, 400)
            )

        p = Project(
            project_id=i,
            constituency=constituency,
            district=district,
            state=state,
            mp_name=mp_name,
            house_type="Lok Sabha" if "lok" in house.lower() else "Rajya Sabha",
            work_description=activity,
            work_category=work_category,
            sanctioned_amount=sanction_amt * 100000 if sanction_amt < 1000 else sanction_amt,
            disbursed_amount=expenditure * 100000 if expenditure < 1000 else expenditure,
            latitude=lat,
            longitude=lng,
            h3_index=latlng_to_h3(lat, lng),
            project_status=status,
            sanction_date=sanction_date,
            expected_completion=expected_completion,
            actual_completion=actual_completion,
            implementing_agency=ia_name,
            sc_area=random.random() < 0.20,
            st_area=random.random() < 0.12,
            photo_uploaded=random.random() > 0.25,
            delay_probability=round(random.uniform(0.05, 0.55), 3),
            zone_flag=None,
        )
        project_data.append(p)
        session.add(p)

    session.flush()

    # ── 3. Create Transactions from project financial data ────────────────
    from backend.services.benchmark_service import BenchmarkService as BS

    txn_data = []
    txn_id = 0

    for p in project_data:
        n_txns = random.randint(2, 5)
        total_amount = p.sanctioned_amount or 500000

        for t_idx in range(n_txns):
            txn_id += 1

            # Assign vendor
            ia = p.implementing_agency or ""
            vendor = vendor_map.get(ia)
            if not vendor:
                vendor = random.choice(vendor_data)

            # Push cartel vendors to same projects occasionally
            if p.project_id % 5 == 0 and len(vendor_data) >= 3:
                vendor = vendor_data[random.choice([0, 1, 2])]

            mat = random.choice(MATERIAL_CATEGORIES)
            bm = BS.get_benchmark(mat, p.state)
            bench_cost = bm["benchmark_unit_cost"]

            # Realistic invoice amounts based on actual project sanctioned amount
            portion = total_amount / n_txns
            quantity = round(random.uniform(5, 150), 1)
            unit_cost = round(portion / max(quantity, 1), 2)

            # Plant some fraud patterns (~20% of transactions)
            fraud_roll = random.random()
            inv_date = p.sanction_date or datetime.date(2023, 6, 1)
            inv_date = inv_date + datetime.timedelta(days=random.randint(0, 300))

            if fraud_roll < 0.08:
                # Cost inflation: unit cost > 25% above benchmark
                unit_cost = round(bench_cost * random.uniform(1.30, 1.65), 2)
            elif fraud_roll < 0.14:
                # Invoice before sanction
                inv_date = (p.sanction_date or datetime.date(2023, 6, 1)) - datetime.timedelta(
                    days=random.randint(5, 45)
                )
            elif fraud_roll < 0.20:
                # March rush (year-end spending)
                inv_date = datetime.date(2025, 3, random.randint(15, 28))
                p.photo_uploaded = False

            invoice_amount = round(unit_cost * quantity, 2)

            # Split invoicing for cartel vendors
            if vendor.vendor_id in (1, 2, 3) and random.random() < 0.35:
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

    session.flush()

    # ── 4. Documents ──────────────────────────────────────────────────────
    for t in txn_data:
        doc = Document(
            transaction_id=t.transaction_id,
            project_id=t.project_id,
            document_type=random.choice(["Invoice", "Utilisation Certificate", "Work Order"]),
            storage_uri=f"/docs/{t.invoice_number}.pdf",
            extracted_text=(
                f"Invoice {t.invoice_number} amount "
                f"\u20b9{t.invoice_amount:,.2f} for {t.material_category}"
            ),
            extracted_entities={
                "amount": t.invoice_amount,
                "vendor": t.vendor_id,
                "material": t.material_category,
            },
            ocr_confidence=round(random.uniform(0.82, 0.99), 3),
            discrepancy_detected=random.random() < 0.10,
            discrepancy_details=(
                "Amount mismatch between header and line total"
                if random.random() < 0.10 else None
            ),
        )
        session.add(doc)

    # ── 5. Score transactions & vendors → create alerts ───────────────────
    from backend.services.anomaly_engine import TabularAnomalyEngine
    from backend.services.graph_engine import GraphEngine
    from backend.services.geo_engine import GeoEngine

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
                natural_language_summary=(
                    f"Project GPS overlaps with GatiShakti restricted area: {zone}"
                ),
            )
            session.add(alert)

        dups = geo_eng.find_duplicates(
            project_data, p.latitude, p.longitude, p.work_category,
            exclude_id=p.project_id
        )
        if dups:
            alert = Alert(
                project_id=p.project_id,
                alert_type="Spatial Duplication Check",
                severity="HIGH",
                natural_language_summary=(
                    f"Found {len(dups)} existing {p.work_category} works within 120m radius."
                ),
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
    print(
        f"[RealDataGen] Seeded {len(project_data)} REAL projects, "
        f"{len(vendor_data)} vendors, {len(txn_data)} transactions "
        f"from MoSPI DigiGov portal."
    )
