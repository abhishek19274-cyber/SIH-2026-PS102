class ExplainerService:
    """SHAP-style attribution + audit-ready narrative."""

    @staticmethod
    def generate_shap_waterfall(base_val: float, feature_contributions: list):
        running = base_val
        steps = []
        for item in feature_contributions:
            impact = float(item.get("impact", 0))
            start = running
            running += impact
            steps.append({
                "feature": item.get("feature", ""),
                "impact": round(impact, 3),
                "start_value": round(start, 3),
                "end_value": round(running, 3),
                "description": item.get("description", ""),
            })
        return {
            "base_value": round(base_val, 3),
            "final_score": round(min(max(running, 0.0), 1.0), 3),
            "attributions": steps,
        }

    @staticmethod
    def format_narrative(typology: str, entity_name: str, signals: list):
        reasons = "; ".join(signals)
        return (
            f"Alert flagged for {entity_name} regarding [{typology}]. "
            f"Key driving indicators: {reasons}. "
            f"Requires mandatory review by District Authority prior to PFMS stage release."
        )
