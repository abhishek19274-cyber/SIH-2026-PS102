"""XGBoost-AFT inspired delay predictor (transparent demo).

Produces a survival-style delay probability and a coarse expected
completion date from IA history, season, category, and size.
"""
from datetime import timedelta
from collections import defaultdict
from backend.services.explainer import ExplainerService


CATEGORY_BASE = {
    "Road Construction": 0.38,
    "Drinking Water": 0.18,
    "Solar Street Light": 0.12,
    "Community Hall": 0.24,
    "Sanitation Block": 0.22,
    "School Infrastructure": 0.16,
    "Borewell Drilling": 0.20,
    "Drainage System": 0.32,
    "Park Development": 0.18,
    "Health Infrastructure": 0.20,
}

MONSOON_MONTHS = {6, 7, 8, 9}


class TimelineEngine:
    def __init__(self):
        self.explainer = ExplainerService

    def ia_completion_rate(self, projects, agency):
        subset = [p for p in projects if p.implementing_agency == agency]
        if not subset:
            return 0.55
        done = sum(1 for p in subset if p.project_status == "Completed")
        return done / max(len(subset), 1)

    def score_project(self, project, all_projects):
        contribs = []
        base = CATEGORY_BASE.get(project.work_category, 0.22)
        contribs.append({
            "feature": "work_category_prior",
            "impact": base * 0.4,
            "description": f"{project.work_category} historically slower than lighting/education works.",
        })
        ia_rate = self.ia_completion_rate(all_projects, project.implementing_agency)
        if ia_rate < 0.5:
            contribs.append({
                "feature": "implementing_agency_completion_rate",
                "impact": 0.22,
                "description": f"{project.implementing_agency} completes only {ia_rate * 100:.0f}% of assigned works on record.",
            })
        if project.sanction_date and project.sanction_date.month in MONSOON_MONTHS:
            contribs.append({
                "feature": "monsoon_sanction_season",
                "impact": 0.16,
                "description": "Sanctioned in monsoon window — earthwork / road laying typically stalls.",
            })
        if (project.sanctioned_amount or 0) >= 3_000_000:
            contribs.append({
                "feature": "large_ticket_size",
                "impact": 0.12,
                "description": "Sanctioned amount ≥ ₹30 lakh — multi-vendor coordination risk.",
            })
        if project.project_status == "In Progress" and project.expected_completion:
            # already past expected?
            pass
        shap = self.explainer.generate_shap_waterfall(0.10, contribs)
        delay_p = shap["final_score"]
        extra_days = int(30 + delay_p * 180)
        predicted = None
        if project.expected_completion:
            predicted = (project.expected_completion + timedelta(days=extra_days - 30)).isoformat()
        curve = []
        for month in range(0, 19):
            t = month
            # Weibull-ish survival: P(delay > t months)
            p = max(0.02, min(0.98, delay_p * (1.15 ** (t / 6))))
            if t == 0:
                p = delay_p
            curve.append({"month": t, "p_still_incomplete": round(min(p, 0.97), 3)})
        return {
            "delay_probability": delay_p,
            "predicted_completion": predicted,
            "shap": shap,
            "survival_curve": curve,
            "warning": delay_p >= 0.70,
        }
