"""Document OCR / LayoutLM-style parse blueprint."""
from flask import Blueprint, jsonify, request
from backend.models import db, Document, Transaction, Project, Vendor
from backend.services.ocr_engine import OCREngine
from backend.utils.audit_logger import AuditLogger

bp = Blueprint("documents", __name__)
_ocr = OCREngine()


@bp.route("/", methods=["GET"])
def list_documents():
    project_id = request.args.get("project_id", type=int)
    q = Document.query
    if project_id:
        q = q.filter(Document.project_id == project_id)
    docs = q.limit(200).all()
    return jsonify([d.to_dict() for d in docs])


@bp.route("/parse", methods=["POST"])
def parse():
    body = request.get_json(force=True) or {}
    raw = body.get("text") or body.get("extracted_text") or ""
    doc_type = body.get("document_type", "Invoice")
    entities = _ocr.parse_text(raw, doc_type)

    portal_amount = body.get("portal_amount")
    portal_date = body.get("portal_date")
    portal_gstin = body.get("portal_gstin")
    sanction_date = None
    project_id = body.get("project_id")
    transaction_id = body.get("transaction_id")
    if transaction_id:
        t = Transaction.query.get(transaction_id)
        if t:
            portal_amount = portal_amount if portal_amount is not None else t.invoice_amount
            project_id = project_id or t.project_id
            vendor = Vendor.query.get(t.vendor_id)
            if vendor:
                portal_gstin = portal_gstin or vendor.gstin_number
    if project_id:
        p = Project.query.get(project_id)
        if p:
            sanction_date = p.sanction_date

    check = _ocr.cross_check(entities, portal_amount, portal_date, portal_gstin, sanction_date)
    doc = Document(
        transaction_id=transaction_id,
        project_id=project_id,
        document_type=doc_type,
        extracted_text=raw[:4000],
        extracted_entities=entities,
        ocr_confidence=check["ocr_confidence"],
        discrepancy_detected=check["discrepancy_detected"],
        discrepancy_details=check["discrepancy_details"],
    )
    db.session.add(doc)
    db.session.commit()
    AuditLogger.log_event("document", doc.document_id, "ocr_parse", body.get("actor", "ida_officer"), {
        "discrepancy": check["discrepancy_detected"],
    })
    return jsonify({
        "document": doc.to_dict(),
        "entities": entities,
        "cross_check": check,
    })
