import os
import time
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from extensions import db
from models.ticket import Ticket, PriorityEnum, Attachment
from models.user import User, RoleEnum

ticket_bp = Blueprint("ticket_bp", __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi', 'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@ticket_bp.route("/tickets", methods=["POST"])
@jwt_required()
def create_ticket():
    data = request.get_json() or {}

    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    priority = data.get("priority", "medium").lower()

    # Validate title
    if not title:
        return jsonify({"error": "Title is required"}), 400

    # Validate priority
    try:
        priority_enum = PriorityEnum(priority)
    except ValueError:
        return jsonify({
            "error": f"Invalid priority. Allowed values: {[p.value for p in PriorityEnum]}"
        }), 400

    # Identify customer from JWT
    current_user_id = get_jwt_identity()
    customer = User.query.get(current_user_id)
    if not customer or customer.role != RoleEnum.customer:
        return jsonify({"error": "Only customers can create tickets"}), 403

    # Create ticket
    ticket = Ticket(
        title=title,
        description=description,
        priority=priority_enum,
        created_by_id=customer.id,
        department_id=None
    )

    db.session.add(ticket)
    db.session.commit()

    return jsonify({
        "message": "Ticket created successfully",
        "ticket": {
            "id": ticket.id,
            "title": ticket.title,
            "priority": ticket.priority.value,
            "status": ticket.status.value,
            "created_by": customer.name
        }
    }), 201

@ticket_bp.route("/tickets/<int:ticket_id>/attachments", methods=["POST"])
@jwt_required()
def upload_attachment(ticket_id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Check if ticket exists
    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify({"error": "Ticket not found"}), 404

    # Check if file part is in request
    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files["file"]

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": f"File type not allowed. Allowed types: {ALLOWED_EXTENSIONS}"}), 400

    filename = secure_filename(file.filename)
    upload_folder = current_app.config.get("UPLOAD_FOLDER", "uploads")
    os.makedirs(upload_folder, exist_ok=True)

    unique_filename = f"{int(time.time())}_{filename}"
    filepath = os.path.join(upload_folder, unique_filename)

    file.save(filepath)

    # Save attachment record in DB
    attachment = Attachment(
        ticket_id=ticket.id,
        filename=filename,
        file_path=filepath,
        content_type=file.content_type,
        size=file.content_length if file.content_length else None,
        uploaded_by_id=user.id
    )

    db.session.add(attachment)
    db.session.commit()

    return jsonify({
        "message": "Attachment uploaded successfully",
        "attachment": {
            "id": attachment.id,
            "filename": attachment.filename,
            "content_type": attachment.content_type,
            "size": attachment.size
        }
    }), 201
