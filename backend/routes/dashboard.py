"""Serve the Vite-built React SPA (frontend/dist)."""
import os
from flask import Blueprint, abort, send_from_directory

bp = Blueprint("dashboard", __name__)
BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir, os.pardir))
DIST = os.path.join(BASE, "frontend", "dist")

# These prefixes belong to other blueprints. Never SPA-fallback them.
_RESERVED = ("api/", "antigravity")


@bp.route("/", defaults={"path": ""})
@bp.route("/<path:path>")
def index(path):
    if path.startswith(_RESERVED):
        abort(404)

    if path and os.path.isfile(os.path.join(DIST, path)):
        return send_from_directory(DIST, path)

    index_html = os.path.join(DIST, "index.html")
    if not os.path.isfile(index_html):
        return (
            "<!doctype html><title>Frontend not built</title>"
            "<h1>Frontend not built</h1>"
            "<p>From the repo root run:</p>"
            "<pre>cd frontend\nnpm install\nnpm run build</pre>"
            "<p>then restart <code>python run.py</code> and open "
            "<a href='/'>http://localhost:5000</a>.</p>",
            503,
            {"Content-Type": "text/html; charset=utf-8"},
        )
    return send_from_directory(DIST, "index.html")
