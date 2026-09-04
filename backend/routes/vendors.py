"""Vendors API blueprint."""
from flask import Blueprint, jsonify, request
from backend.models import db, Vendor, Transaction, Project
from backend.services.graph_engine import GraphEngine
from backend.utils.audit_logger import AuditLogger

bp = Blueprint("vendors", __name__)
_graph = GraphEngine()


def _build_graph():
    vendors = Vendor.query.all()
    transactions = Transaction.query.all()
    projects = Project.query.all()
    return _graph.build(vendors, transactions, projects), vendors, transactions, projects


@bp.route("/", methods=["GET"])
def list_vendors():
    state = request.args.get("state")
    min_risk = float(request.args.get("min_risk", 0))
    q = Vendor.query
    if state:
        q = q.filter(Vendor.state.ilike(f"%{state}%"))
    if min_risk > 0:
        q = q.filter(Vendor.lifetime_risk_score >= min_risk)
    vendors = q.order_by(Vendor.lifetime_risk_score.desc()).limit(200).all()
    return jsonify([v.to_dict() for v in vendors])


@bp.route("/<int:vid>", methods=["GET"])
def get_vendor(vid):
    v = Vendor.query.get_or_404(vid)
    data = v.to_dict()
    graph, vendors, transactions, projects = _build_graph()
    scored = _graph.score_vendor(vid, graph)
    if scored:
        data["graph_score"] = scored
    return jsonify(data)


@bp.route("/network", methods=["GET"])
@bp.route("/audit-network", methods=["GET"])
def network():
    vendors = Vendor.query.all()
    transactions = Transaction.query.all()
    projects = Project.query.all()
    payload = _graph.network_payload(vendors, transactions, projects)
    return jsonify(payload)


@bp.route("/stats", methods=["GET"])
def stats():
    total = Vendor.query.count()
    high_risk = Vendor.query.filter(Vendor.lifetime_risk_score >= 0.50).count()
    cartel = db.session.query(Vendor.cartel_group_id).filter(
        Vendor.cartel_group_id.isnot(None)).distinct().count()
    return jsonify({
        "total_vendors": total,
        "high_risk_vendors": high_risk,
        "cartel_rings_detected": cartel,
    })
