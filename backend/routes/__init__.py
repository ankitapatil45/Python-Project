from flask import Blueprint

# import your blueprints here
#from .Superadmin_route import superadmin_bp
from .auth import auth_bp
from .ticket_routes import ticket_bp
from routes.superadmin_route import superadmin_bp



def register_routes(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(ticket_bp)
    app.register_blueprint(superadmin_bp)

