"""Tabular financial anomaly engine (EIF + SilIF inspired, demo implementation).

The demo does not ship a trained isolation forest. Instead it reconstructs the
same feature space the blueprint describes and scores each invoice with a
transparent, calibrated composite that SHAP can decompose.
"""
from datetime import timedelta
from backend.services.benchmark_service import BenchmarkService
from backend.services.explainer import ExplainerService


SCRUTINY_THRESHOLD = 500000.0  # ₹5 lakh


class TabularAnomalyEngine:
    def __init__(self):
        self.benchmark = BenchmarkService
        self.explainer = ExplainerService

    def score_transaction(self, transaction, project, vendor, sibling_invoices):
        state = project.state if project else "Maharashtra"
        bm = self.benchmark.get_benchmark(transaction.material_category, state)
        bench = bm["benchmark_unit_cost"] or 1.0
        unit_dev = (transaction.unit_cost - bench) / bench

        contribs = []
        signals = []
        reasons = []

        # Feature 1 — unit cost vs eSankhyiki
        if unit_dev > 0.12:
            impact = min(0.42, 0.12 + unit_dev * 0.55)
            contribs.append({
                "feature": "unit_cost_deviation_from_benchmark",
                "impact": impact,
                "description": (
                    f"Unit cost ₹{transaction.unit_cost:,.0f}/{bm['unit']} is "
                    f"{unit_dev * 100:.0f}% above eSankhyiki {state} average ₹{bench:,.0f}."
                ),
            })
            signals.append(f"unit cost {unit_dev * 100:.0f}% above regional average")
            reasons.append("Cost inflation vs eSankhyiki")
        elif unit_dev < -0.35:
            contribs.append({
                "feature": "implausibly_low_unit_cost",
                "impact": 0.12,
                "description": "Unit cost far below market — possible under-invoicing / quality substitution.",
            })

        # Feature 2 — split invoices just below ₹5 lakh
        near_threshold = 0.90 * SCRUTINY_THRESHOLD <= transaction.invoice_amount < SCRUTINY_THRESHOLD
        window = [
            t for t in sibling_invoices
            if t.vendor_id == transaction.vendor_id
            and abs((t.transaction_date - transaction.transaction_date).days) <= 2
            and 0.90 * SCRUTINY_THRESHOLD <= t.invoice_amount < SCRUTINY_THRESHOLD
        ]
        if near_threshold and len(window) >= 2:
            impact = min(0.28, 0.10 + 0.05 * len(window))
            contribs.append({
                "feature": "invoice_split_below_scrutiny_threshold",
                "impact": impact,
                "description": (
                    f"{len(window)} invoices from the same vendor in 48h, each just below ₹5 lakh "
                    f"(this invoice ₹{transaction.invoice_amount:,.0f})."
                ),
            })
            signals.append(f"{len(window)} near-threshold invoices in 48 hours")
            reasons.append("Split invoicing")

        # Feature 3 — invoice before sanction
        if project and project.sanction_date and transaction.transaction_date < project.sanction_date:
            days = (project.sanction_date - transaction.transaction_date).days
            contribs.append({
                "feature": "invoice_before_sanction_flag",
                "impact": 0.30,
                "description": f"Invoice dated {days} days before official sanction order.",
            })
            signals.append(f"invoice precedes sanction by {days} days")
            reasons.append("Backdated invoice")

        # Feature 4 — March rush with no photos
        if transaction.transaction_date and transaction.transaction_date.month == 3:
            impact = 0.18 if not (project and project.photo_uploaded) else 0.08
            contribs.append({
                "feature": "march_expenditure_ratio",
                "impact": impact,
                "description": "Year-end (March) spend spike"
                + (" with no geo-tagged progress photo." if impact > 0.1 else "."),
            })
            signals.append("March expenditure spike")
            reasons.append("Fund-parking / year-end rush")

        # Feature 5 — photo gap on large disbursement
        if project and not project.photo_uploaded and transaction.invoice_amount > 200000:
            contribs.append({
                "feature": "photo_upload_gap",
                "impact": 0.14,
                "description": "No geo-tagged photograph uploaded against a high-value stage payment.",
            })
            signals.append("missing progress photograph")
            reasons.append("Evidence gap")

        shap = self.explainer.generate_shap_waterfall(0.08, contribs)
        score = shap["final_score"]
        flagged = score >= 0.45 or bool(reasons)
        flag_reason = " + ".join(reasons) if reasons else None
        narrative = None
        if flagged:
            entity = vendor.business_name if vendor else f"Invoice {transaction.invoice_number}"
            narrative = self.explainer.format_narrative(
                flag_reason or "Financial anomaly",
                entity,
                signals or ["composite tabular score exceeded operating threshold"],
            )
        return {
            "anomaly_score": score,
            "is_flagged": flagged,
            "flag_reason": flag_reason,
            "shap": shap,
            "narrative": narrative,
            "benchmark": bm,
            "signals": signals,
        }

    def score_all(self, transactions, projects_by_id, vendors_by_id):
        by_vendor = {}
        for t in transactions:
            by_vendor.setdefault(t.vendor_id, []).append(t)
        results = {}
        for t in transactions:
            project = projects_by_id.get(t.project_id)
            vendor = vendors_by_id.get(t.vendor_id)
            siblings = by_vendor.get(t.vendor_id, [])
            results[t.transaction_id] = self.score_transaction(t, project, vendor, siblings)
        return results
