"""Dashboard rendering route."""
from flask import Blueprint, render_template

bp = Blueprint("dashboard", __name__)


@bp.route("/", methods=["GET"])
def index():
    return render_template("dashboard.html")
