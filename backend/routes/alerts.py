"""Alerts API blueprint."""
import datetime
from flask import Blueprint, jsonify, request
from backend.models import db, Alert
from backend.utils.audit_logger import AuditLogger

bp = Blueprint("alerts", __name__)


@bp.route("/", methods=["GET"])
def list_alerts():
    severity = request.args.get("severity")
    disposition = request.args.get("disposition")
    state = request.args.get("state")
    q = Alert.query
    if severity:
        q = q.filter(Alert.severity == severity.upper())
    if disposition:
        q = q.filter(Alert.disposition == disposition.upper())
    if state:
        # join via project
        from backend.models import Project
        q = q.join(Project, Alert.project_id == Project.project_id, isouter=True).filter(
            Project.state.ilike(f"%{state}%")
        )
    alerts = q.order_by(Alert.created_at.desc()).limit(500).all()
    return jsonify([a.to_dict() for a in alerts])


@bp.route("/<int:aid>", methods=["GET"])
def get_alert(aid):
    a = Alert.query.get_or_404(aid)
    return jsonify(a.to_dict())


@bp.route("/<int:aid>/disposition", methods=["PATCH"])
def update_disposition(aid):
    a = Alert.query.get_or_404(aid)
    body = request.get_json(force=True)
    new_disp = body.get("disposition", "").upper()
    if new_disp not in ("PENDING", "ACCEPTED", "REJECTED", "ESCALATED"):
        return jsonify({"error": "Invalid disposition"}), 400
    actor = body.get("actor", "ministry_officer")
    a.disposition = new_disp
    a.reviewed_by = actor
    a.reviewed_at = datetime.datetime.utcnow()
    a.review_notes = body.get("notes", "")
    db.session.commit()
    AuditLogger.log_event("alert", aid, f"disposition_set:{new_disp}", actor,
                          {"notes": a.review_notes})
    return jsonify(a.to_dict())


@bp.route("/stats", methods=["GET"])
def stats():
    total = Alert.query.count()
    by_severity = db.session.query(Alert.severity, db.func.count()).group_by(Alert.severity).all()
    by_disposition = db.session.query(Alert.disposition, db.func.count()).group_by(Alert.disposition).all()
    return jsonify({
        "total_alerts": total,
        "by_severity": dict(by_severity),
        "by_disposition": dict(by_disposition),
    })
