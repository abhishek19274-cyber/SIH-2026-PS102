"""Deterministic NL → SQL for the demo schema (no live LLM required).

Known question templates plus a small keyword compiler. Generated SQL is
SELECT-only and validated before execution.
"""
import re
from backend.utils.validators import is_select_only


TEMPLATES = [
    {
        "match": ["critical", "maharashtra"],
        "sql": (
            "SELECT a.alert_id, a.alert_type, a.severity, a.disposition, p.constituency, p.state, "
            "p.mp_name, v.business_name "
            "FROM alerts a LEFT JOIN projects p ON p.project_id = a.project_id "
            "LEFT JOIN vendors v ON v.vendor_id = a.vendor_id "
            "WHERE a.severity = 'CRITICAL' AND (p.state LIKE '%Maharashtra%' OR v.state LIKE '%Maharashtra%') "
            "ORDER BY a.created_at DESC"
        ),
        "summary": "Critical alerts linked to Maharashtra projects or vendors.",
    },
    {
        "match": ["high risk", "alerts", "pending"],
        "sql": (
            "SELECT a.alert_id, a.alert_type, a.severity, a.disposition, p.constituency, p.mp_name, v.business_name "
            "FROM alerts a LEFT JOIN projects p ON p.project_id = a.project_id "
            "LEFT JOIN vendors v ON v.vendor_id = a.vendor_id "
            "WHERE a.disposition = 'PENDING' ORDER BY CASE a.severity "
            "WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END"
        ),
        "summary": "Pending alerts ordered by severity.",
    },
    {
        "match": ["cartel", "shared bank", "ring"],
        "sql": (
            "SELECT vendor_id, business_name, lifetime_risk_score, cartel_group_id, state "
            "FROM vendors WHERE cartel_group_id IS NOT NULL ORDER BY lifetime_risk_score DESC"
        ),
        "summary": "Vendors currently clustered into suspected cartel rings.",
    },
    {
        "match": ["wardha"],
        "sql": (
            "SELECT project_id, work_description, project_status, sanctioned_amount, composite_risk_score, mp_name "
            "FROM projects WHERE lower(constituency) LIKE '%wardha%' OR lower(district) LIKE '%wardha%'"
        ),
        "summary": "Works in Wardha constituency / district.",
    },
    {
        "match": ["sc/st", "sc st", "scheduled caste", "scheduled tribe"],
        "sql": (
            "SELECT state, "
            "SUM(CASE WHEN sc_area = 1 THEN sanctioned_amount ELSE 0 END) AS sc_inr, "
            "SUM(CASE WHEN st_area = 1 THEN sanctioned_amount ELSE 0 END) AS st_inr, "
            "SUM(sanctioned_amount) AS total_inr "
            "FROM projects GROUP BY state"
        ),
        "summary": "SC/ST earmarked sanctions versus total, by state.",
    },
    {
        "match": ["monsoon"],
        "sql": (
            "SELECT project_id, work_description, constituency, state, delay_probability, "
            "sanction_date, expected_completion, project_status "
            "FROM projects WHERE delay_probability >= 0.45 AND CAST(strftime('%m', sanction_date) AS INTEGER) BETWEEN 6 AND 9 "
            "ORDER BY delay_probability DESC"
        ),
        "summary": "High delay-risk works sanctioned in the monsoon window (Jun–Sep).",
    },
    {
        "match": ["delay", "overdue", "survival"],
        "sql": (
            "SELECT project_id, work_description, constituency, delay_probability, expected_completion, project_status "
            "FROM projects WHERE delay_probability >= 0.5 ORDER BY delay_probability DESC"
        ),
        "summary": "Projects with ≥50% predicted probability of missing the one-year deadline.",
    },
    {
        "match": ["split invoice", "5 lakh", "scrutiny"],
        "sql": (
            "SELECT t.transaction_id, t.invoice_number, t.invoice_amount, t.flag_reason, "
            "v.business_name, p.constituency "
            "FROM transactions t JOIN vendors v ON v.vendor_id = t.vendor_id "
            "JOIN projects p ON p.project_id = t.project_id "
            "WHERE t.is_flagged = 1 AND t.invoice_amount >= 450000 AND t.invoice_amount < 500000 "
            "ORDER BY t.invoice_amount DESC"
        ),
        "summary": "Flagged invoices sitting just below the ₹5 lakh scrutiny threshold.",
    },
    {
        "match": ["vendor", "more than 3", "agencies"],
        "sql": (
            "SELECT v.business_name, COUNT(DISTINCT p.implementing_agency) AS agency_count, "
            "COUNT(t.transaction_id) AS invoices, SUM(t.invoice_amount) AS billed "
            "FROM vendors v JOIN transactions t ON t.vendor_id = v.vendor_id "
            "JOIN projects p ON p.project_id = t.project_id "
            "GROUP BY v.vendor_id HAVING COUNT(DISTINCT p.implementing_agency) >= 3 "
            "ORDER BY agency_count DESC"
        ),
        "summary": "Vendors paid by three or more implementing agencies.",
    },
]


class NLEngine:
    def compile(self, question: str, role="ministry", constituency=None):
        q = (question or "").strip().lower()
        chosen = None
        for tmpl in TEMPLATES:
            if any(m in q for m in tmpl["match"]):
                chosen = tmpl
                break
        if not chosen:
            chosen = {
                "sql": (
                    "SELECT project_id, constituency, state, work_category, project_status, "
                    "composite_risk_score, sanctioned_amount FROM projects "
                    "ORDER BY composite_risk_score DESC LIMIT 25"
                ),
            }
        sql = chosen["sql"]
        if role == "mp" and constituency:
            safe = constituency.replace("'", "")
            if " where " in sql.lower():
                sql = sql + f" AND lower(constituency) = '{safe.lower()}'"
            elif " from projects" in sql.lower():
                sql = sql.replace(" FROM projects", f" FROM projects WHERE lower(constituency) = '{safe.lower()}'", 1)
        if not is_select_only(sql):
            return {"ok": False, "error": "Generated SQL failed SELECT-only guardrail.", "sql": sql}
        return {"ok": True, "sql": sql, "summary": chosen["summary"], "question": question}

    def narrate(self, rows, summary):
        n = len(rows or [])
        return f"{summary} Returned {n} row{'s' if n != 1 else ''} from the demo ledger."
