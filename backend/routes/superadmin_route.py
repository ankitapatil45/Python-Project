# superadmin_route.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.ticket import Ticket
from models.user import User, RoleEnum, Department

superadmin_bp = Blueprint("superadmin_bp", __name__)

# Route: List all unassigned tickets (for super_admin only)
@superadmin_bp.route("/tickets/unassigned", methods=["GET"])
@jwt_required()
def get_unassigned_tickets():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user or user.role != RoleEnum.super_admin:
        return jsonify({"error": "Access denied"}), 403

    tickets = Ticket.query.filter(Ticket.assigned_to_id == None).all()

    result = []
    for t in tickets:
        result.append({
            "id": t.id,
            "title": t.title,
            "priority": t.priority.value,
            "status": t.status.value,
            "created_by": t.created_by.name,
            "department_id": t.department_id
        })

    return jsonify(result)


# Route: Assign department, admin (default), optionally agent to ticket (super_admin only)
def assign_ticket(ticket_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user or user.role != RoleEnum.super_admin:
        return jsonify({"error": "Access denied"}), 403

    data = request.get_json() or {}
    department_id = data.get("department_id")
    agent_id = data.get("agent_id")  # optional

    if not department_id:
        return jsonify({"error": "department_id is required"}), 400

    department = Department.query.get(department_id)
    if not department:
        return jsonify({"error": "Department not found"}), 404

    # Find an admin for this department automatically
    admin_user = User.query.filter_by(role=RoleEnum.admin, department_id=department_id).first()
    if not admin_user:
        return jsonify({"error": "No admin found for this department"}), 404

    # Validate optional agent
    if agent_id:
        agent_user = User.query.get(agent_id)
        if not agent_user or agent_user.role != RoleEnum.agent or agent_user.department_id != department_id:
            return jsonify({"error": "Invalid agent user"}), 400
    else:
        agent_user = None

    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify({"error": "Ticket not found"}), 404

    ticket.department_id = department_id
    ticket.assigned_to_id = admin_user.id  # auto-assign admin

    if agent_user:
        ticket.assigned_to_id = agent_user.id  # assign agent if provided

    db.session.commit()

    return jsonify({
        "message": "Ticket assigned successfully",
        "ticket": {
            "id": ticket.id,
            "title": ticket.title,
            "assigned_to": User.query.get(ticket.assigned_to_id).name,
            "assigned_to_role": User.query.get(ticket.assigned_to_id).role.value,
            "department": department.name
        }
    })

