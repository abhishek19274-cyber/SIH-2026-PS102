"""Role-based dashboard aggregation endpoints."""
from collections import defaultdict
from flask import Blueprint, jsonify, request
from backend.models import db, Project, Vendor, Transaction, Alert

bp = Blueprint("dashboards", __name__)


def _inr_cr(value):
    return round((value or 0) / 10_000_000, 2)


def _inr_lakh(value):
    return round((value or 0) / 100_000, 2)


def _project_filter(q):
    state = request.args.get("state")
    district = request.args.get("district")
    constituency = request.args.get("constituency")
    mp_name = request.args.get("mp_name")
    if state:
        q = q.filter(Project.state.ilike(f"%{state}%"))
    if district:
        q = q.filter(Project.district.ilike(f"%{district}%"))
    if constituency:
        q = q.filter(Project.constituency.ilike(f"%{constituency}%"))
    if mp_name:
        q = q.filter(Project.mp_name.ilike(f"%{mp_name}%"))
    return q


def _kpis(projects, vendors, transactions, alerts):
    sanctioned = sum(p.sanctioned_amount or 0 for p in projects)
    disbursed = sum(p.disbursed_amount or 0 for p in projects)
    sc = sum(p.sanctioned_amount or 0 for p in projects if p.sc_area)
    st = sum(p.sanctioned_amount or 0 for p in projects if p.st_area)
    flagged = [t for t in transactions if t.is_flagged]
    cartels = {v.cartel_group_id for v in vendors if v.cartel_group_id}
    return {
        "total_projects": len(projects),
        "high_risk_projects": sum(1 for p in projects if (p.composite_risk_score or 0) >= 0.60),
        "delayed_projects": sum(1 for p in projects if (p.delay_probability or 0) >= 0.60),
        "total_sanctioned_inr": round(sanctioned, 0),
        "total_disbursed_inr": round(disbursed, 0),
        "utilisation_pct": round(disbursed / sanctioned * 100, 1) if sanctioned else 0,
        "sanctioned_cr": _inr_cr(sanctioned),
        "disbursed_cr": _inr_cr(disbursed),
        "sc_share_pct": round(sc / sanctioned * 100, 1) if sanctioned else 0,
        "st_share_pct": round(st / sanctioned * 100, 1) if sanctioned else 0,
        "sc_mandate_pct": 15.0,
        "st_mandate_pct": 7.5,
        "flagged_transactions": len(flagged),
        "flag_rate_pct": round(len(flagged) / len(transactions) * 100, 1) if transactions else 0,
        "cartel_rings_detected": len(cartels),
        "pending_alerts": sum(1 for a in alerts if a.disposition == "PENDING"),
        "critical_alerts": sum(1 for a in alerts if a.severity == "CRITICAL"),
    }


def _state_heatmap(projects):
    buckets = defaultdict(lambda: {"count": 0, "risk": 0.0, "sanctioned": 0.0, "alerts": 0})
    for p in projects:
        b = buckets[p.state]
        b["count"] += 1
        b["risk"] += p.composite_risk_score or 0
        b["sanctioned"] += p.sanctioned_amount or 0
    return [
        {
            "state": state,
            "projects": b["count"],
            "avg_risk": round(b["risk"] / b["count"], 3) if b["count"] else 0,
            "sanctioned_cr": _inr_cr(b["sanctioned"]),
        }
        for state, b in sorted(buckets.items(), key=lambda kv: kv[1]["risk"] / max(kv[1]["count"], 1), reverse=True)
    ]


def _status_pipeline(projects):
    order = ["Recommended", "Sanctioned", "In Progress", "Completed"]
    counts = defaultdict(int)
    for p in projects:
        counts[p.project_status or "Sanctioned"] += 1
    return [{"status": s, "count": counts.get(s, 0)} for s in order]


@bp.route("/ministry", methods=["GET"])
def ministry():
    projects = Project.query.all()
    vendors = Vendor.query.all()
    transactions = Transaction.query.all()
    alerts = Alert.query.order_by(Alert.created_at.desc()).limit(200).all()
    top_projects = sorted(projects, key=lambda p: p.composite_risk_score or 0, reverse=True)[:10]
    top_vendors = sorted(vendors, key=lambda v: v.lifetime_risk_score or 0, reverse=True)[:10]
    return jsonify({
        "role": "ministry",
        "kpis": _kpis(projects, vendors, transactions, alerts),
        "heatmap": _state_heatmap(projects),
        "pipeline": _status_pipeline(projects),
        "top_risk_projects": [p.to_dict() for p in top_projects],
        "top_risk_vendors": [v.to_dict() for v in top_vendors],
        "recent_alerts": [a.to_dict() for a in alerts[:12]],
        "projects": [p.to_dict() for p in projects],
    })


@bp.route("/district", methods=["GET"])
def district():
    district_name = request.args.get("district", "Pune")
    projects = _project_filter(Project.query).all()
    if not projects:
        projects = Project.query.filter(Project.district.ilike(f"%{district_name}%")).all()
    project_ids = {p.project_id for p in projects}
    vendors = Vendor.query.all()
    transactions = [t for t in Transaction.query.all() if t.project_id in project_ids]
    alerts = [a for a in Alert.query.order_by(Alert.created_at.desc()).all()
              if a.project_id in project_ids or (a.vendor_id and any(
                  t.vendor_id == a.vendor_id and t.project_id in project_ids for t in transactions
              ))]
    pending = [p for p in projects if p.project_status in ("Sanctioned", "Recommended")]
    return jsonify({
        "role": "district",
        "district": district_name,
        "kpis": _kpis(projects, vendors, transactions, alerts),
        "pending_sanctions": [p.to_dict() for p in pending],
        "pipeline": _status_pipeline(projects),
        "projects": [p.to_dict() for p in projects],
        "alerts": [a.to_dict() for a in alerts[:40]],
        "sc_st": {
            "sc_share_pct": _kpis(projects, vendors, transactions, alerts)["sc_share_pct"],
            "st_share_pct": _kpis(projects, vendors, transactions, alerts)["st_share_pct"],
            "sc_mandate_pct": 15.0,
            "st_mandate_pct": 7.5,
        },
    })


@bp.route("/mp", methods=["GET"])
def mp_view():
    mp_name = request.args.get("mp_name")
    q = Project.query
    if mp_name:
        q = q.filter(Project.mp_name.ilike(f"%{mp_name}%"))
    else:
        first = Project.query.first()
        mp_name = first.mp_name if first else "Hon'ble MP"
        q = Project.query.filter_by(mp_name=mp_name)
    projects = q.all()
    if not projects:
        projects = Project.query.limit(8).all()
        if projects:
            mp_name = projects[0].mp_name
    project_ids = {p.project_id for p in projects}
    vendors = Vendor.query.all()
    transactions = [t for t in Transaction.query.all() if t.project_id in project_ids]
    alerts = [a for a in Alert.query.all() if a.project_id in project_ids]
    entitlement = 5_00_00_000  # ₹5 crore
    spent = sum(p.disbursed_amount or 0 for p in projects)
    committed = sum((p.sanctioned_amount or 0) - (p.disbursed_amount or 0) for p in projects if p.project_status != "Completed")
    available = max(entitlement - spent - max(committed, 0), 0)
    bottlenecks = [p.to_dict() for p in projects if (p.delay_probability or 0) >= 0.45]
    return jsonify({
        "role": "mp",
        "mp_name": mp_name,
        "constituency": projects[0].constituency if projects else None,
        "kpis": _kpis(projects, vendors, transactions, alerts),
        "budget": {
            "entitlement_inr": entitlement,
            "spent_inr": round(spent, 0),
            "committed_inr": round(max(committed, 0), 0),
            "available_inr": round(available, 0),
            "spent_cr": _inr_cr(spent),
            "committed_cr": _inr_cr(max(committed, 0)),
            "available_cr": _inr_cr(available),
        },
        "pipeline": _status_pipeline(projects),
        "bottlenecks": bottlenecks,
        "projects": [p.to_dict() for p in projects],
        "alerts": [a.to_dict() for a in alerts],
    })


@bp.route("/citizen", methods=["GET"])
@bp.route("/public", methods=["GET"])
def citizen():
    projects = Project.query.all()
    public = []
    for p in projects:
        public.append({
            "project_id": p.project_id,
            "constituency": p.constituency,
            "district": p.district,
            "state": p.state,
            "mp_name": p.mp_name,
            "work_description": p.work_description,
            "work_category": p.work_category,
            "sanctioned_amount": p.sanctioned_amount,
            "disbursed_amount": p.disbursed_amount,
            "project_status": p.project_status,
            "latitude": p.latitude,
            "longitude": p.longitude,
            "photo_uploaded": p.photo_uploaded,
            "expected_completion": p.expected_completion.isoformat() if p.expected_completion else None,
            "actual_completion": p.actual_completion.isoformat() if p.actual_completion else None,
        })
    sanctioned = sum(p.sanctioned_amount or 0 for p in projects)
    completed = sum(1 for p in projects if p.project_status == "Completed")
    return jsonify({
        "role": "citizen",
        "kpis": {
            "total_projects": len(projects),
            "completed_projects": completed,
            "in_progress": sum(1 for p in projects if p.project_status == "In Progress"),
            "total_sanctioned_inr": round(sanctioned, 0),
            "sanctioned_cr": _inr_cr(sanctioned),
            "photo_coverage_pct": round(sum(1 for p in projects if p.photo_uploaded) / len(projects) * 100, 1) if projects else 0,
        },
        "pipeline": _status_pipeline(projects),
        "projects": public,
        "note": "Public transparency view — investigative risk scores and vendor PII are withheld.",
    })
