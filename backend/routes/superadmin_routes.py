# superadmin_route.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.ticket import Ticket
from models.user import User, RoleEnum, Department
from werkzeug.security import generate_password_hash
 
superadmin_bp = Blueprint("superadmin_bp", __name__)
 
 
 
#--------------------------------------------
# Route: Add New Department (Superadmin only)
#--------------------------------------------
 
@superadmin_bp.route("/departments", methods=["POST"])
@jwt_required()
def add_department():
    # Get current logged-in user
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
 
    # Ensure only superadmins can access
    if not user or user.role != RoleEnum.super_admin:
        return jsonify({"error": "Only superadmins can add departments"}), 403
 
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid or missing JSON body"}), 400
 
    # Validate required field
    if not data.get("name"):
        return jsonify({"error": "'name' is required"}), 400
 
    # Check for duplicate department
    if Department.query.filter_by(name=data["name"].strip()).first():
        return jsonify({"error": f"Department '{data['name']}' already exists"}), 409
 
    # Create new department
    new_department = Department(
        name=data["name"].strip(),
        description=data.get("description", None)
    )
 
    db.session.add(new_department)
    db.session.commit()
 
    return jsonify({
        "message": "Department created successfully",
        "department": {
            "id": new_department.id,
            "name": new_department.name,
            "description": new_department.description,
            "created_at": new_department.created_at
        }
    }), 201
 
 
 
 
#-----------------------------------------------
# Route: To get all departments (superadmin only)
#------------------------------------------------
 
@superadmin_bp.route("/departments", methods=["GET"])
@jwt_required()
def get_departments():
    # Get current logged-in user
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
 
    if not user or user.role != RoleEnum.super_admin:  #  use enum instead of string if you already have RoleEnum
        return jsonify({"error": "Access denied, superadmin only"}), 403
 
    # Fetch all departments
    departments = Department.query.all()
    department_list = [
        {
            "id": dept.id,
            "name": dept.name,
            "description": dept.description,
            "created_at": dept.created_at
        }
        for dept in departments
    ]
 
    return jsonify({"departments": department_list}), 200
 
 
 
#----------------------------------------------------------
# Route: Get All Tickets (for super_admin only)
#----------------------------------------------------------    
 
@superadmin_bp.route("/tickets", methods=["GET"])
@jwt_required()
def get_all_tickets():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
 
    # Only superadmins can access this
    if not user or user.role != RoleEnum.super_admin:
        return jsonify({"error": "Access denied"}), 403
 
    tickets = Ticket.query.all()
 
    result = []
    for t in tickets:
        result.append({
            "id": t.id,
            "title": t.title,
            "priority": t.priority.value if hasattr(t.priority, "value") else t.priority,
            "status": t.status.value if hasattr(t.status, "value") else t.status,
            "created_by": t.created_by.name if t.created_by else None,
            "assigned_to": t.assigned_to.name if t.assigned_to else None,
            "department": t.department.name if t.department else None,
            "created_at": t.created_at.strftime('%Y-%m-%d %H:%M:%S') if t.created_at else None
        })
 
    return jsonify({"tickets": result}), 200
 
 
 
 
#-----------------------------------------------------------------------------------------
# Route: Assign department, admin (default), optionally agent to ticket (super_admin only)
#-----------------------------------------------------------------------------------------
 
@superadmin_bp.route("/tickets/<int:ticket_id>/assign", methods=["PUT"])
@jwt_required()
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
    ticket.assigned_to_id = admin_user.id  # default assign admin
 
    if agent_user:
        ticket.assigned_to_id = agent_user.id  # override with agent if provided
 
    db.session.commit()
 
    assigned_user = User.query.get(ticket.assigned_to_id)
 
    return jsonify({
        "message": "Ticket assigned successfully",
        "ticket": {
            "id": ticket.id,
            "title": ticket.title,
            "assigned_to": assigned_user.name,
            "assigned_to_role": assigned_user.role.value,
            "department": department.name
        }
    }), 201
 
 
 
 
#--------------------------------------
# Route: Create Admin (Only Superadmin)
#---------------------------------------
 
@superadmin_bp.route('/superadmin/create-admin', methods=['POST'])
@jwt_required()
def create_admin():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
 
    # Ensure only superadmins can create admins
    if not user or user.role != RoleEnum.super_admin:
        return jsonify({'error': 'Only superadmins can create admins'}), 403
 
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid or missing JSON body'}), 400
 
    # Validate required fields
    required_fields = ['name', 'password', 'department', 'email']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f"'{field}' is required"}), 400
 
    # Get department by name
    dept_name = data['department'].strip()
    department = Department.query.filter_by(name=dept_name).first()
    if not department:
        return jsonify({'error': f"Invalid department name: '{dept_name}'"}), 400
 
    # Ensure no existing admin for this department
    if User.query.filter_by(role=RoleEnum.admin, department_id=department.id).first():
        return jsonify({'error': f"An admin already exists for '{dept_name}'"}), 409
 
    # Check duplicate email
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409
 
    # Hash password
    hashed_password = generate_password_hash(data['password'])
 
    # Create new admin
    new_admin = User(
        name=data['name'],
        email=data['email'],
        password_hash=hashed_password,
        role=RoleEnum.admin,
        is_active=True,
        department_id=department.id,   #  Department assigned here
        created_by=current_user_id
    )
 
    db.session.add(new_admin)
    db.session.commit()
 
    return jsonify({
        'message': 'Admin created successfully',
        'admin_email': new_admin.email,
        'assigned_department': department.name,
        'created_by': user.name
    }), 201
 
 
 
# --------------------------
# Route: Get All Admins (Superadmin only)
# --------------------------
 
@superadmin_bp.route('/superadmin/admins', methods=['GET'])
@jwt_required()
def get_all_admins():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
 
    # Ensure only superadmins can access
    if not user or user.role != RoleEnum.super_admin:
        return jsonify({'error': 'Only superadmins can view admins'}), 403
 
    # Fetch all admins
    admins = User.query.filter_by(role=RoleEnum.admin).all()
 
    result = []
    for a in admins:
        result.append({
            'id': a.id,
            'name': a.name,
            'email': a.email,
            'role': a.role.value,  
            'department': a.department.name ,
            'is_active': a.is_active,
            'created_at': a.created_at,
            'created_by': a.created_by
        })
 
    return jsonify({'admins': result}), 200
 
 
 
# --------------------------
# Update or Delete Admin (Superadmin only)
# --------------------------
 
@superadmin_bp.route('/superadmin/admin/<int:admin_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def update_or_delete_admin(admin_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
 
    # Ensure only superadmins can access
    if not user or user.role != RoleEnum.super_admin:
        return jsonify({'error': 'Only superadmins can manage admins'}), 403
 
    admin = User.query.get_or_404(admin_id)
 
    # Ensure we are only updating/deleting admins
    if admin.role != RoleEnum.admin:
        return jsonify({'error': 'This user is not an admin'}), 400
 
    if request.method == 'PUT':
        data = request.get_json() or {}
 
        # Update allowed fields
        admin.name = data.get('name', admin.name)
        admin.is_active = data.get('is_active', admin.is_active)
 
        # Update department if provided
        department_name = data.get('department')
        if department_name:
            department = Department.query.filter_by(name=department_name.strip()).first()
            if not department:
                return jsonify({'error': f"Department '{department_name}' not found"}), 404
            admin.department_id = department.id
 
        # Update password if provided
        new_password = data.get('password')
        if new_password:
            admin.password_hash = generate_password_hash(new_password)
 
        db.session.commit()
        return jsonify({'message': 'Admin updated successfully'}), 200
 
    elif request.method == 'DELETE':
        db.session.delete(admin)
        db.session.commit()
        return jsonify({'message': 'Admin deleted successfully'}), 200
 
 
# --------------------------
# Route: Get All Agents (Superadmin only)
# --------------------------
 
@superadmin_bp.route('/superadmin/agents', methods=['GET'])
@jwt_required()
def get_all_agents():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
 
    # Ensure only superadmins can access
    if not user or user.role != RoleEnum.super_admin:
        return jsonify({'error': 'Only superadmins can view agents'}), 403
 
    # Fetch all agents
    agents = User.query.filter_by(role=RoleEnum.agent).all()
 
    result = []
    for agent in agents:
        result.append({
            'id': agent.id,
            'name': agent.name,
            'email': agent.email,
            'role': agent.role.value,   # enum → string
            'department': agent.department.name,
            'is_active': agent.is_active,
            # 'created_at': agent.created_at,
            # 'created_by': agent.created_by
        })
 
    return jsonify({'agents': result}), 200
 
 
# #--------------------------------------
# # Route: Create agent (Only Superadmin)
# #---------------------------------------
 
@superadmin_bp.route('/superadmin/create-agent', methods=['POST'])
@jwt_required()
def create_agent():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
 
    # Ensure only superadmins can create admins
    if not user or user.role != RoleEnum.super_admin:
        return jsonify({'error': 'Only superadmins can create admins'}), 403
 
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid or missing JSON body'}), 400
 
    # Validate required fields
    required_fields = ['name', 'email', 'password', 'department', ]
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f"'{field}' is required"}), 400
 
    # Get department by name
    dept_name = data['department'].strip()
    department = Department.query.filter_by(name=dept_name).first()
    if not department:
        return jsonify({'error': f"Invalid department name: '{dept_name}'"}), 400
 
    # Ensure no existing agent for this department
    if User.query.filter_by(role=RoleEnum.agent, department_id=department.id).first():
        return jsonify({'error': f"An agent already exists for '{dept_name}'"}), 409
 
    # Check duplicate email
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409
 
    # Hash password
    hashed_password = generate_password_hash(data['password'])
 
    # Create new admin
    new_agent = User(
        name=data['name'],
        email=data['email'],
        password_hash=hashed_password,
        role=RoleEnum.agent,
        is_active=True,
        department_id=department.id,   #  Department assigned here
        created_by=current_user_id
    )
 
    db.session.add(new_agent)
    db.session.commit()
 
    return jsonify({
        'message': 'Agent created successfully',
        'agent_email': new_agent.email,
        'assigned_department': department.name,
        'created_by': user.name
    }), 201

 
# --------------------------
# Update or Delete Agent (Superadmin only)
# --------------------------
 
@superadmin_bp.route('/superadmin/agent/<int:agent_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def update_or_delete_agent(agent_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
 
    # Ensure only superadmins can access
    if not user or user.role != RoleEnum.super_admin:
        return jsonify({'error': 'Only superadmins can manage agents'}), 403
 
    agent = User.query.get_or_404(agent_id)
 
    # Ensure we are only updating/deleting agents
    if agent.role != RoleEnum.agent:
        return jsonify({'error': 'This user is not an agent'}), 400
 
    if request.method == 'PUT':
        data = request.get_json() or {}
 
        # Update allowed fields
        agent.name = data.get('name', agent.name)
        agent.is_active = data.get('is_active', agent.is_active)
 
        # Update department if provided
        department_name = data.get('department')
        if department_name:
            department = Department.query.filter_by(name=department_name.strip()).first()
            if not department:
                return jsonify({'error': f"Department '{department_name}' not found"}), 404
            agent.department_id = department.id
 
        # Update password if provided
        new_password = data.get('password')
        if new_password:
            agent.password_hash = generate_password_hash(new_password)
 
        db.session.commit()
        return jsonify({'message': 'Agent updated successfully'}), 200
 
    elif request.method == 'DELETE':
        db.session.delete(agent)
        db.session.commit()
        return jsonify({'message': 'Agent deleted successfully'}), 200
 
 
 
 
# --------------------------
# Route: Get All Customers (Superadmin only)
# --------------------------
@superadmin_bp.route('/superadmin/customers', methods=['GET'])
@jwt_required()
def get_all_customers():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
 
    # Ensure only superadmins can access
    if not user or user.role != RoleEnum.super_admin:
        return jsonify({'error': 'Only superadmins can view customers'}), 403
 
    # Fetch all customers
    customers = User.query.filter_by(role=RoleEnum.customer).all()
 
    result = []
    for customer in customers:
        result.append({
            'id': customer.id,
            'name': customer.name,
            'email': customer.email,
            'role': customer.role.value,   # enum → string
            'is_active': customer.is_active,
            'created_at': customer.created_at,
            'created_by': customer.created_by
        })
 
    return jsonify({'customers': result}), 200
 
 
 
# --------------------------
# Update or Delete Customer (Superadmin only)
# --------------------------
 
@superadmin_bp.route('/superadmin/customer/<int:customer_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def update_or_delete_customer(customer_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
 
    # Ensure only superadmins can access
    if not user or user.role != RoleEnum.super_admin:
        return jsonify({'error': 'Only superadmins can manage customers'}), 403
 
    customer = User.query.get_or_404(customer_id)
 
    # Ensure we are only updating/deleting customers
    if customer.role != RoleEnum.customer:
        return jsonify({'error': 'This user is not a customer'}), 400
 
    if request.method == 'PUT':
        data = request.get_json() or {}
 
        # Update allowed fields
        customer.name = data.get('name', customer.name)
        customer.is_active = data.get('is_active', customer.is_active)
 
        # Update email if provided
        customer.email = data.get('email', customer.email)
 
        # Update password if provided
        new_password = data.get('password')
        if new_password:
            customer.password_hash = generate_password_hash(new_password)
 
        db.session.commit()
        return jsonify({'message': 'Customer updated successfully'}), 200
 
    elif request.method == 'DELETE':
        db.session.delete(customer)
        db.session.commit()
        return jsonify({'message': 'Customer deleted successfully'}), 200
 
 
 
 
# --------------------------
# Toggle Admin Status (Superadmin only)
# --------------------------
 
@superadmin_bp.route('/superadmin/admin/<int:admin_id>/toggle-status', methods=['PUT'])
@jwt_required()
def toggle_admin_status(admin_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
 
    # Ensure only superadmins can perform this action
    if not user or user.role != RoleEnum.super_admin:
        return jsonify({'error': 'Only superadmins can perform this action'}), 403
 
    admin = User.query.get_or_404(admin_id)
 
    # Ensure the target user is an admin
    if admin.role != RoleEnum.admin:
        return jsonify({'error': 'Target user is not an admin'}), 400
 
    # Toggle status
    admin.is_active = not admin.is_active
    db.session.commit()
 
    return jsonify({
        'message': f"Admin {'activated' if admin.is_active else 'deactivated'} successfully.",
        'admin': {
            'id': admin.id,
            'name': admin.name,
            'email': admin.email,
            'department': admin.department.name if admin.department else None,
            'is_active': admin.is_active
        }
    }), 200