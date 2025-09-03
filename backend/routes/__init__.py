from flask import Blueprint

# import your blueprints here
from .superadmin_routes import superadmin_bp
from .auth import auth_bp
from .ticket_routes import ticket_bp
from .superadmin_routes import superadmin_bp
from .admin_routes import admin_bp
from .customer_routes import customer_bp
from .agent_routes import agent_bp
from .ticket_routes import ticket_bp




def register_routes(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(ticket_bp)
    app.register_blueprint(superadmin_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(customer_bp)
    app.register_blueprint(agent_bp)

