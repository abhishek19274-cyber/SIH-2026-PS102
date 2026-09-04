from flask import Blueprint, send_from_directory
import os
bp = Blueprint("antigravity", __name__)
BASE = os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

@bp.route("/")
def index():
    return send_from_directory(os.path.join(BASE, "frontend", "antigravity"), "index.html")

@bp.route("/assets/<path:filename>")
def assets(filename):
    return send_from_directory(os.path.join(BASE, "frontend", "antigravity", "assets"), filename)
