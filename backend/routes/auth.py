from flask import Blueprint, request, jsonify

from flask_jwt_extended import (
    create_access_token, create_refresh_token, jwt_required,
    get_jwt_identity, get_jwt
)
from models.user import User, db, RoleEnum # Your User model
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import timedelta


auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

#===================================
#==== Super admin Register=============
#=====================================

@auth_bp.route('/register-superadmin', methods=['POST'])
def register_superadmin():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not name or not email or not password:
        return jsonify({"msg": "Missing required fields"}), 400

    # Check if super_admin count exceeds 2 (note the underscore)
    superadmin_count = User.query.filter_by(role=RoleEnum.super_admin).count()
    if superadmin_count >= 2:
        return jsonify({"msg": "Super admin limit reached"}), 403

    # Check if email already exists
    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "User with this email already exists"}), 409

    new_superadmin = User(
        name=name,
        email=email,
        role=RoleEnum.super_admin,
        is_active=True
    )
    new_superadmin.set_password(password)  # hashes password and stores in password_hash

    db.session.add(new_superadmin)
    db.session.commit()

    return jsonify({"msg": "Super admin registered successfully"}), 201




#=======================
#==== Login=============
#=======================


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"msg": "Missing email or password"}), 400

    user = User.query.filter_by(email=email).first()

    # Check email/password
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"msg": "Bad email or password"}), 401

    # Check if user is active
    if not user.is_active:
        return jsonify({"msg": "User account is inactive. Please contact admin."}), 403

    additional_claims = {
        "role": user.role.value
    }

    # Convert user.id to string for JWT compatibility
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims=additional_claims,
        expires_delta=timedelta(minutes=15)
    )
    refresh_token = create_refresh_token(
        identity=str(user.id),
        additional_claims=additional_claims
    )

    return jsonify(
        access_token=access_token,
        refresh_token=refresh_token,
        name=user.name,
        role=user.role.value
    )




#=============== 
#= LOgout---
#============

# In-memory blacklist (reset on app restart)
jwt_blacklist = set()


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()  # Requires valid access token
def logout():
    jti = get_jwt()['jti']  # JWT ID, unique identifier for token
    jwt_blacklist.add(jti)
    return jsonify({"msg": "Successfully logged out"}), 200
