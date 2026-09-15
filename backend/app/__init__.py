from flask import Flask, jsonify
from flask_cors import CORS
from .config import Config
from .database import get_db
from .utils.seeder import seed_database

# Import Blueprints
from .routes.auth import auth_bp
from .routes.accounts import accounts_bp
from .routes.transactions import transactions_bp
from .routes.manager import manager_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS for React frontend (default vite dev server is http://localhost:5173)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize Database & Seed data
    with app.app_context():
        get_db()
        seed_database()

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(accounts_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(manager_bp)

    @app.route("/api/health", methods=["GET"])
    def health_check():
        db = get_db()
        return jsonify({
            "status": "healthy",
            "service": "Apex Banking System REST API",
            "version": "1.0.0",
            "database_connected": True
        }), 200

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"error": "Internal server error"}), 500

    return app
