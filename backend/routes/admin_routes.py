
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.ticket import Ticket
from models.user import User, RoleEnum, Department
from werkzeug.security import generate_password_hash

admin_bp = Blueprint("admin_bp", __name__)



# --------------------------------------
# Route: Create Agent (Only Admin)
# --------------------------------------
 
@admin_bp.route("/admin/create-agent", methods=["POST"])
@jwt_required()
def create_agent():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
 
    # Ensure only admins can create agents
    if not user or user.role != RoleEnum.admin:
        return jsonify({"error": "Only admins can create agents"}), 403
 
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid or missing JSON body"}), 400
 
    # Validate required fields (no username)
    required_fields = ["name", "password", "email"]
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"'{field}' is required"}), 400
 
    department_id = user.department_id
    if not department_id:
        return jsonify({"error": "Admin is not assigned to any department"}), 400
 
    # Check for duplicate email
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already exists"}), 409
 
    # Hash password
    hashed_password = generate_password_hash(data["password"])
 
    # Create new agent
    new_agent = User(
        name=data["name"],
        email=data["email"],
        password_hash=hashed_password,
        role=RoleEnum.agent,
        is_active=True,
        created_by=current_user_id,
        department_id=department_id  # agent tied to admin’s department
    )
 
    db.session.add(new_agent)
    db.session.commit()
 
    department = Department.query.get(department_id)
 
    return jsonify({
        "message": "Agent created successfully",
        "agent_email": new_agent.email,
        "assigned_department": department.name
    }), 201
 
 
 
# -------------------------------
# Route: Get Agents (Admin & Superadmin)
# -------------------------------
@admin_bp.route('/admin/agents', methods=['GET'])
@jwt_required()
def get_agents():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
 
    # Allow only Admins and Superadmins
    if not user or user.role not in [RoleEnum.admin, RoleEnum.super_admin]:
        return jsonify({'error': 'Unauthorized'}), 403
 
    # Base query: only agents
    query = User.query.filter_by(role=RoleEnum.agent)
 
    # If admin → limit to their own department (default, inherited when created)
    if user.role == RoleEnum.admin:
        query = query.filter(User.department_id == user.department_id)
 
    # Optional filter: by name
    name_filter = request.args.get('name')
    if name_filter:
        query = query.filter(User.name.ilike(f"%{name_filter}%"))
 
    # ⚡ Removed manual department_id filter from query params
    # Because department is auto-tied to admin's department
 
    agents = query.all()
 
    result = []
    for agent in agents:
        result.append({
            'id': agent.id,
            'name': agent.name,
            'email': agent.email,
            'role': agent.role.value,
            'department': agent.department.name if agent.department else None,
            'is_active': agent.is_active,
            'created_at': agent.created_at.strftime('%Y-%m-%d %H:%M:%S') if agent.created_at else None,
            'created_by': agent.created_by
        })
 
    return jsonify({'agents': result}), 200
 
 
# --------------------------------------
# Route: Assign Ticket to Agent (Admin only)
# --------------------------------------
 
@admin_bp.route("/admin/tickets/<int:ticket_id>/assign", methods=["PUT"])
@jwt_required()
def assign_ticket_to_agent(ticket_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    # Only Admins can assign tickets
    if not user or user.role != RoleEnum.admin:
        return jsonify({"error": "Only admins can assign tickets"}), 403

    data = request.get_json() or {}
    agent_id = data.get("agent_id")

    if not agent_id:
        return jsonify({"error": "agent_id is required"}), 400

    # Check if ticket exists
    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify({"error": "Ticket not found"}), 404

    # Prevent reassignment if already assigned
    if ticket.assigned_to_id:
        return jsonify({"error": "Ticket is already assigned"}), 400

    # Ensure ticket belongs to admin's department, or assign if not set
    if ticket.department_id:
        if ticket.department_id != user.department_id:
            return jsonify({"error": "You can only assign tickets in your department"}), 403
    else:
        # If no department assigned yet, default to admin's department
        ticket.department_id = user.department_id

    # Validate agent
    agent = User.query.get(agent_id)
    if not agent or agent.role != RoleEnum.agent:
        return jsonify({"error": "Invalid agent"}), 400
    if agent.department_id != user.department_id:
        return jsonify({"error": "Agent must belong to your department"}), 400

    # Assign ticket
    ticket.assigned_to_id = agent.id
    db.session.commit()

    return jsonify({
        "message": "Ticket assigned successfully",
        "ticket": {
            "id": ticket.id,
            "title": ticket.title,
            "assigned_to": agent.name,
            "assigned_to_role": agent.role.value,
            "department": agent.department.name if agent.department else None
        }
    }), 200

 

# --------------------------------------
# Route: Get List Assigned and Unassigned  Ticket to  Admin only
# --------------------------------------

@admin_bp.route("/admin/tickets", methods=["GET"])
@jwt_required()
def get_tickets_for_admin():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    # Only admins can access this
    if not user or user.role != RoleEnum.admin:
        return jsonify({"error": "Only admins can view tickets"}), 403

    # Query unassigned tickets (with no assigned_to_id) in admin’s department
    unassigned_tickets = Ticket.query.filter(
        Ticket.department_id == user.department_id,
        Ticket.assigned_to_id.is_(None)
    ).all()

    # Query assigned tickets (with assigned_to_id not null) in admin’s department
    assigned_tickets = Ticket.query.filter(
        Ticket.department_id == user.department_id,
        Ticket.assigned_to_id.isnot(None)
    ).all()

    # Serialize both lists
    def serialize_ticket(ticket):
        return {
            "id": ticket.id,
            "title": ticket.title,
            "description": ticket.description,
            "department": ticket.department.name if ticket.department else None,
            "assigned_to": ticket.assigned_to.name if ticket.assigned_to else None,
            "status": ticket.status.value if ticket.status else None,
            "created_at": ticket.created_at.strftime('%Y-%m-%d %H:%M:%S') if ticket.created_at else None
        }

    return jsonify({
        "unassigned_tickets": [serialize_ticket(t) for t in unassigned_tickets],
        "assigned_tickets": [serialize_ticket(t) for t in assigned_tickets]
    }), 200
