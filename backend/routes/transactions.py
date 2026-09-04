"""Transactions API blueprint."""
from flask import Blueprint, jsonify, request
from backend.models import db, Transaction, Project, Vendor, Alert
from backend.services.anomaly_engine import TabularAnomalyEngine

bp = Blueprint("transactions", __name__)
_anomaly = TabularAnomalyEngine()


@bp.route("/", methods=["GET"])
def list_transactions():
    project_id = request.args.get("project_id", type=int)
    vendor_id = request.args.get("vendor_id", type=int)
    flagged_only = request.args.get("flagged") == "1"
    q = Transaction.query
    if project_id:
        q = q.filter(Transaction.project_id == project_id)
    if vendor_id:
        q = q.filter(Transaction.vendor_id == vendor_id)
    if flagged_only:
        q = q.filter(Transaction.is_flagged == True)
    txns = q.order_by(Transaction.anomaly_score.desc()).limit(500).all()
    return jsonify([t.to_dict() for t in txns])


@bp.route("/<int:tid>", methods=["GET"])
def get_transaction(tid):
    t = Transaction.query.get_or_404(tid)
    data = t.to_dict()
    project = Project.query.get(t.project_id)
    vendor = Vendor.query.get(t.vendor_id)
    siblings = Transaction.query.filter_by(project_id=t.project_id).all()
    scored = _anomaly.score_transaction(t, project, vendor, siblings)
    data["scoring"] = scored
    return jsonify(data)


@bp.route("/evaluate", methods=["POST"])
def evaluate():
    body = request.get_json(force=True) or {}
    tid = body.get("transaction_id")
    if tid:
        t = Transaction.query.get_or_404(tid)
        project = Project.query.get(t.project_id)
        vendor = Vendor.query.get(t.vendor_id)
        siblings = Transaction.query.filter_by(vendor_id=t.vendor_id).all()
        scored = _anomaly.score_transaction(t, project, vendor, siblings)
        t.anomaly_score = scored["anomaly_score"]
        t.is_flagged = scored["is_flagged"]
        t.flag_reason = scored["flag_reason"]
        if scored["is_flagged"] and scored.get("narrative"):
            existing = Alert.query.filter_by(
                project_id=t.project_id, vendor_id=t.vendor_id, alert_type=scored["flag_reason"]
            ).first()
            if not existing:
                db.session.add(Alert(
                    project_id=t.project_id,
                    vendor_id=t.vendor_id,
                    alert_type=scored["flag_reason"] or "Financial Anomaly",
                    severity="CRITICAL" if scored["anomaly_score"] >= 0.70 else "HIGH",
                    shap_explanation=scored["shap"],
                    natural_language_summary=scored["narrative"],
                ))
        db.session.commit()
        return jsonify({"transaction": t.to_dict(), "scoring": scored})

    return jsonify({"error": "transaction_id is required for demo evaluate"}), 400


@bp.route("/stats", methods=["GET"])
def stats():
    total = Transaction.query.count()
    flagged = Transaction.query.filter(Transaction.is_flagged == True).count()
    total_value = db.session.query(db.func.sum(Transaction.invoice_amount)).scalar() or 0
    flagged_value = db.session.query(
        db.func.sum(Transaction.invoice_amount)
    ).filter(Transaction.is_flagged == True).scalar() or 0
    return jsonify({
        "total_transactions": total,
        "flagged_transactions": flagged,
        "total_value_inr": round(total_value, 0),
        "flagged_value_inr": round(flagged_value, 0),
        "flag_rate_pct": round(flagged / total * 100, 1) if total else 0,
    })
