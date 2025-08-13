from flask import Flask
from flask_cors import CORS
from config import config_by_name
from extensions import db, migrate, jwt  # import extensions from extensions.py

# In-memory blacklist for revoked tokens (can replace with Redis or DB later)
jwt_blacklist = set()


def create_app(config_name="development"):
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app)

    # JWT token revocation check
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        return jwt_payload["jti"] in jwt_blacklist

    # Import all models so migrations detect them
    import models # This loads User, Ticket, etc., via models/__init__.py

    # Register blueprints
    from routes import register_routes
    register_routes(app)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
