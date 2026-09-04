"""Projects API blueprint."""
from flask import Blueprint, jsonify, request
from backend.models import db, Project, Alert
from backend.services.timeline_engine import TimelineEngine
from backend.services.geo_engine import GeoEngine
from backend.utils.audit_logger import AuditLogger

bp = Blueprint("projects", __name__)
_timeline = TimelineEngine()
_geo = GeoEngine()


@bp.route("/", methods=["GET"])
def list_projects():
    constituency = request.args.get("constituency")
    state = request.args.get("state")
    status = request.args.get("status")
    district = request.args.get("district")
    mp_name = request.args.get("mp_name")
    q = Project.query
    if constituency:
        q = q.filter(Project.constituency.ilike(f"%{constituency}%"))
    if state:
        q = q.filter(Project.state.ilike(f"%{state}%"))
    if district:
        q = q.filter(Project.district.ilike(f"%{district}%"))
    if mp_name:
        q = q.filter(Project.mp_name.ilike(f"%{mp_name}%"))
    if status:
        q = q.filter(Project.project_status == status)
    projects = q.order_by(Project.composite_risk_score.desc()).limit(200).all()
    return jsonify([p.to_dict() for p in projects])


@bp.route("/<int:pid>", methods=["GET"])
def get_project(pid):
    p = Project.query.get_or_404(pid)
    data = p.to_dict()
    # Attach timeline scoring
    all_projects = Project.query.all()
    tl = _timeline.score_project(p, all_projects)
    data["timeline"] = tl
    # Attach duplicate cluster
    data["geo_duplicates"] = _geo.find_duplicates(
        all_projects, p.latitude, p.longitude, p.work_category, radius_m=120, exclude_id=p.project_id
    )
    return jsonify(data)


@bp.route("/<int:pid>/alerts", methods=["GET"])
def project_alerts(pid):
    Project.query.get_or_404(pid)
    alerts = Alert.query.filter_by(project_id=pid).all()
    return jsonify([a.to_dict() for a in alerts])


@bp.route("/stats", methods=["GET"])
def stats():
    total = Project.query.count()
    high_risk = Project.query.filter(Project.composite_risk_score >= 0.60).count()
    delayed = Project.query.filter(Project.delay_probability >= 0.60).count()
    total_sanctioned = db.session.query(db.func.sum(Project.sanctioned_amount)).scalar() or 0
    total_disbursed = db.session.query(db.func.sum(Project.disbursed_amount)).scalar() or 0
    return jsonify({
        "total_projects": total,
        "high_risk_projects": high_risk,
        "delayed_projects": delayed,
        "total_sanctioned_inr": round(total_sanctioned, 0),
        "total_disbursed_inr": round(total_disbursed, 0),
        "utilisation_pct": round(total_disbursed / total_sanctioned * 100, 1) if total_sanctioned else 0,
    })


@bp.route("/cluster/h3", methods=["GET"])
def h3_cluster():
    projects = Project.query.all()
    clusters = _geo.cluster_by_h3(projects)
    return jsonify(clusters)


@bp.route("/geo-verify", methods=["POST"])
def geo_verify():
    body = request.get_json(force=True) or {}
    lat = body.get("latitude")
    lng = body.get("longitude")
    category = body.get("work_category") or body.get("category")
    radius = float(body.get("radius_m", 120))
    exclude_id = body.get("project_id")
    if lat is None or lng is None:
        return jsonify({"error": "latitude and longitude are required"}), 400
    projects = Project.query.all()
    result = _geo.verify_location(projects, float(lat), float(lng), category, radius, exclude_id)
    AuditLogger.log_event("project", exclude_id or 0, "geo_verify", body.get("actor", "ida_officer"), {
        "latitude": lat, "longitude": lng, "category": category, "hits": len(result["duplicates"]),
    })
    return jsonify(result)


@bp.route("/<int:pid>/survival-curve", methods=["GET"])
def survival_curve(pid):
    p = Project.query.get_or_404(pid)
    scored = _timeline.score_project(p, Project.query.all())
    return jsonify({
        "project_id": pid,
        "delay_probability": scored["delay_probability"],
        "predicted_completion": scored["predicted_completion"],
        "warning": scored["warning"],
        "shap": scored["shap"],
        "survival_curve": scored["survival_curve"],
    })
