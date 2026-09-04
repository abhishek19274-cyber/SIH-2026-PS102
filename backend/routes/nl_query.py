"""Natural Language Query API blueprint."""
from flask import Blueprint, jsonify, request
from backend.models import db, Project, Vendor, Transaction, Alert
from backend.services.nl_engine import NLEngine
from backend.utils.audit_logger import AuditLogger
from sqlalchemy import text

bp = Blueprint("nl_query", __name__)
_nl = NLEngine()


@bp.route("/", methods=["POST"])
def query():
    body = request.get_json(force=True)
    question = body.get("question")
    role = body.get("role", "ministry")
    constituency = body.get("constituency")
    if not question:
        return jsonify({"error": "No question provided"}), 400

    compiled = _nl.compile(question, role, constituency)
    if not compiled["ok"]:
        return jsonify({
            "ok": False,
            "sql": None,
            "rows": [],
            "narrative": "I'm sorry, I couldn't understand that query or it violates security policies.",
            "error": compiled.get("error"),
        })

    sql = compiled["sql"]
    try:
        result = db.session.execute(text(sql))
        columns = list(result.keys())
        rows = []
        for row in result.fetchall():
            item = {}
            for col, val in zip(columns, row):
                if hasattr(val, "isoformat"):
                    val = val.isoformat()
                item[col] = val
            rows.append(item)
        narrative = _nl.narrate(rows, compiled["summary"])
        AuditLogger.log_event("nl_query", 0, "execute_query", "user",
                              {"question": question, "sql": sql, "row_count": len(rows)})
        return jsonify({
            "ok": True,
            "sql": sql,
            "rows": rows,
            "narrative": narrative,
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "ok": False,
            "sql": sql,
            "rows": [],
            "narrative": "An error occurred while executing the query.",
            "error": str(e),
        }), 500
