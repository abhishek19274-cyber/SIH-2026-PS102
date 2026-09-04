import os
import sys
from flask import Flask, jsonify

# Ensure backend package is importable
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, os.pardir))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.config import Config
from backend.models import db, Project, Vendor, Transaction, Document, Alert
from backend.utils.audit_logger import AuditLogger

def create_app():
    # Templates in ../templates, static in ../static
    app = Flask(
        __name__,
        template_folder=os.path.join(BASE_DIR, "..", "frontend"),
        static_folder=os.path.join(BASE_DIR, "..", "frontend")
    )
    app.config.from_object(Config)

    try:
        from flask_cors import CORS
        CORS(app)
    except ImportError:
        pass

    db.init_app(app)

    with app.app_context():
        db.create_all()
        # Seed demo data if DB is empty
        if Project.query.first() is None:
            from backend.data.synthetic_generator import generate_demo_data
            from backend.services.benchmark_service import BenchmarkService
            generate_demo_data(db.session, BenchmarkService)

    @app.route('/api/health')
    def health():
        return jsonify({"status": "ok", "version": "1.0.0-prototype"})

    # Blueprints
    from backend.routes.projects import bp as projects_bp
    from backend.routes.vendors import bp as vendors_bp
    from backend.routes.transactions import bp as transactions_bp
    from backend.routes.alerts import bp as alerts_bp
    from backend.routes.nl_query import bp as nl_query_bp
    from backend.routes.dashboards import bp as dashboards_bp
    from backend.routes.documents import bp as documents_bp
    from backend.routes.dashboard import bp as dashboard_bp
    from backend.routes.antigravity import bp as antigravity_bp

    app.register_blueprint(projects_bp, url_prefix='/api/projects')
    app.register_blueprint(vendors_bp, url_prefix='/api/vendors')
    app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
    app.register_blueprint(alerts_bp, url_prefix='/api/alerts')
    app.register_blueprint(nl_query_bp, url_prefix='/api/nl_query')
    app.register_blueprint(dashboards_bp, url_prefix='/api/dashboards')
    app.register_blueprint(documents_bp, url_prefix='/api/documents')
    app.register_blueprint(dashboard_bp, url_prefix='/')
    app.register_blueprint(antigravity_bp, url_prefix='/antigravity')

    return app

if __name__ == '__main__':
    flask_app = create_app()
    flask_app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)), debug=True)

