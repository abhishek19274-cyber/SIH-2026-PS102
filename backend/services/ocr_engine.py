"""LayoutLMv3-style document parser (deterministic demo).

Real LayoutLMv3 is too heavy for a laptop demo. This engine extracts
structured invoice fields from a canned / uploaded text blob and
cross-checks them against portal entries.
"""
import re
from datetime import datetime
from backend.services.explainer import ExplainerService


class OCREngine:
    def __init__(self):
        self.explainer = ExplainerService

    def parse_text(self, raw_text: str, document_type="Invoice"):
        text = raw_text or ""
        amount = self._first_money(text)
        date = self._first_date(text)
        gstin = self._first_gstin(text)
        invoice_no = self._first(r"(?:Invoice|Inv)[\s#:.-]*([A-Z0-9/-]+)", text)
        merchant = self._first(r"(?:M/s|M/S|Merchant|Vendor)[:\s]+([A-Za-z0-9 .,&'-]+)", text)
        return {
            "merchant_name": merchant,
            "invoice_date": date,
            "invoice_number": invoice_no,
            "total_amount": amount,
            "gstin_number": gstin,
            "document_type": document_type,
        }

    def cross_check(self, entities, portal_amount=None, portal_date=None, portal_gstin=None, sanction_date=None):
        discrepancies = []
        contribs = []
        if portal_amount and entities.get("total_amount"):
            delta = abs(entities["total_amount"] - portal_amount)
            if delta > 1000:
                discrepancies.append(
                    f"Invoice total ₹{entities['total_amount']:,.0f} vs portal ₹{portal_amount:,.0f}"
                )
                contribs.append({
                    "feature": "amount_mismatch_vs_portal",
                    "impact": 0.32,
                    "description": discrepancies[-1],
                })
        inv_date = self._parse_date(entities.get("invoice_date"))
        sanc = sanction_date
        if inv_date and sanc and inv_date < sanc:
            days = (sanc - inv_date).days
            discrepancies.append(f"Invoice date precedes sanction by {days} days (backdating)")
            contribs.append({
                "feature": "invoice_date_before_sanction",
                "impact": 0.38,
                "description": discrepancies[-1],
            })
        if portal_gstin and entities.get("gstin_number") and entities["gstin_number"] != portal_gstin:
            discrepancies.append("GSTIN on document does not match registered vendor")
            contribs.append({
                "feature": "gstin_mismatch",
                "impact": 0.28,
                "description": discrepancies[-1],
            })
        shap = self.explainer.generate_shap_waterfall(0.05, contribs)
        return {
            "discrepancy_detected": bool(discrepancies),
            "discrepancy_details": " | ".join(discrepancies) if discrepancies else None,
            "shap": shap,
            "ocr_confidence": 0.93 if entities.get("total_amount") else 0.71,
        }

    @staticmethod
    def _first(pattern, text):
        m = re.search(pattern, text, re.I)
        return m.group(1).strip() if m else None

    @staticmethod
    def _first_money(text):
        m = re.search(r"₹\s*([\d,]+(?:\.\d+)?)", text)
        if not m:
            m = re.search(r"(?:Total|Amount)[:\s]+([\d,]+(?:\.\d+)?)", text, re.I)
        if not m:
            return None
        return float(m.group(1).replace(",", ""))

    @staticmethod
    def _first_date(text):
        m = re.search(r"(\d{4}-\d{2}-\d{2}|\d{2}[/-]\d{2}[/-]\d{4})", text)
        return m.group(1) if m else None

    @staticmethod
    def _first_gstin(text):
        m = re.search(r"\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z])\b", text)
        return m.group(1) if m else None

    @staticmethod
    def _parse_date(value):
        if not value:
            return None
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
            try:
                return datetime.strptime(value, fmt).date()
            except ValueError:
                continue
        return None
