import os
import time
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from extensions import db
from models.ticket import Ticket, PriorityEnum, Attachment
from models.user import User, RoleEnum

customer_bp = Blueprint("customer_bp", __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi', 'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@customer_bp.route("/customer_raise/tickets", methods=["POST"])
@jwt_required()
def create_ticket():
    data = request.get_json() or {}

    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    priority = data.get("priority", "medium")  # don't force .lower()

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

#=========-=-=-=-==-====----=-=-=-=-=-==-==========-----------------================----------------===============-------------
@customer_bp.route("/tickets/<int:ticket_id>/attachments", methods=["POST"])
@jwt_required()
def upload_attachments(ticket_id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Ensure ticket exists and belongs to this user
    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify({"error": "Ticket not found"}), 404

    if ticket.created_by_id != user.id:
        return jsonify({"error": "You can only upload to your own tickets"}), 403

    # Multiple files support
    files = request.files.getlist("files")
    if not files or len(files) == 0:
        return jsonify({"error": "No files uploaded"}), 400

    # Base upload folder
    base_upload_folder = current_app.config.get("UPLOAD_FOLDER", "uploads")

    # Ticket-specific subfolder
    ticket_folder = os.path.join(base_upload_folder, f"ticket_{ticket.id}")
    os.makedirs(ticket_folder, exist_ok=True)

    uploaded_attachments = []
    for file in files:
        if file.filename == '':
            continue

        if not allowed_file(file.filename):
            return jsonify({
                "error": f"File type not allowed for {file.filename}. "
                         f"Allowed types: {ALLOWED_EXTENSIONS}"
            }), 400

        filename = secure_filename(file.filename)
        unique_filename = f"{int(time.time())}_{filename}"
        filepath = os.path.join(ticket_folder, unique_filename)
        file.save(filepath)

        # safer size calculation
        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)

        attachment = Attachment(
            ticket_id=ticket.id,
            filename=filename,
            file_path=filepath,
            content_type=file.content_type,
            size=size,
            uploaded_by_id=user.id
        )
        db.session.add(attachment)
        uploaded_attachments.append({
            "ticket_id": ticket.id,
            "filename": attachment.filename,
            "content_type": attachment.content_type,
            "size": attachment.size
        })

    db.session.commit()

    return jsonify({
        "message": "Files uploaded successfully",
        "attachments": uploaded_attachments
    }), 201

# ========================
# Customer: Get Own Tickets (with attachments)
# ========================
@customer_bp.route("/customer/tickets", methods=["GET"])
@jwt_required()
def get_customer_tickets():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user or user.role != RoleEnum.customer:
        return jsonify({"error": "Only customers can view their tickets"}), 403

    tickets = Ticket.query.filter_by(created_by_id=user.id).all()

    return jsonify({
        "tickets": [
            {
                "id": t.id,
                "title": t.title,
                "priority": t.priority.value,
                "status": t.status.value,
                "assigned_to": User.query.get(t.assigned_to_id).name if t.assigned_to_id else None,
                "attachments": [
                    {
                        "id": a.id,
                        "filename": a.filename,
                        "content_type": a.content_type,
                        "size": a.size,
                        "uploaded_by": User.query.get(a.uploaded_by_id).name if a.uploaded_by_id else None
                    }
                    for a in t.attachments
                ]
            }
            for t in tickets
        ]
    }), 200