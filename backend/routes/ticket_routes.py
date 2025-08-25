import os
import time 
import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from extensions import db
from models.ticket import Ticket, PriorityEnum, Attachment, Comment, TicketStatusEnum
from models.user import User, RoleEnum

UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")  
os.makedirs(UPLOAD_FOLDER, exist_ok=True)  # create folder if not exists

ticket_bp = Blueprint("ticket_bp", __name__)


@ticket_bp.route("/<int:ticket_id>/chat", methods=["GET"])
@jwt_required()
def get_ticket_chat(ticket_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify({"error": "Ticket not found"}), 404

    # Authorization check
    if user.id != ticket.created_by_id and user.id != ticket.assigned_to_id:
        return jsonify({"error": "Access denied"}), 403

    # Ticket details
    ticket_data = {
        "id": ticket.id,
        "title": ticket.title,
        "description": ticket.description,
        "priority": ticket.priority.value if ticket.priority else None,
        "status": ticket.status.value if ticket.status else None,
        "created_at": ticket.created_at.isoformat(),
        "attachments": [
            {
                "id": att.id,
                "filename": att.filename,
                "content_type": att.content_type,
                "size": att.size
            }
            for att in ticket.attachments if att.comment_id is None  # only initial ticket attachments
        ]
    }

    # Chat messages (comments)
    comments = Comment.query.filter_by(ticket_id=ticket.id).order_by(Comment.created_at.asc()).all()
    comments_data = []
    for c in comments:
        comments_data.append({
            "id": c.id,
            "user": c.user.name,
            "body": c.body,
            "created_at": c.created_at.isoformat(),
            "attachments": [
                {
                    "id": a.id,
                    "filename": a.filename,
                    "content_type": a.content_type,
                    "size": a.size
                }
                for a in c.attachments
            ]
        })

    return jsonify({
        "ticket": ticket_data,
        "messages": comments_data
    }), 200




@ticket_bp.route("/<int:ticket_id>/messages", methods=["POST"])
@jwt_required()
def add_message(ticket_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify({"error": "Ticket not found"}), 404

    # Authorization check
    if user.id != ticket.created_by_id and user.id != ticket.assigned_to_id:
        return jsonify({"error": "Access denied"}), 403

    text = request.form.get("text", "").strip()
    files = request.files.getlist("files")

    if not text and not files:
        return jsonify({"error": "Message cannot be empty"}), 400

    # Save comment
    comment = Comment(ticket_id=ticket.id, user_id=user.id, body=text)
    db.session.add(comment)
    db.session.flush()

    # Save attachments
    for file in files:
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)

        attachment = Attachment(
            ticket_id=ticket.id,
            comment_id=comment.id,
            filename=filename,
            file_path=file_path,
            content_type=file.content_type,
            size=os.path.getsize(file_path),
            uploaded_by_id=user.id
        )
        db.session.add(attachment)

    db.session.commit()

    return jsonify({
        "id": comment.id,
        "ticket_id": ticket.id,
        "user": user.name,
        "text": comment.body,
        "attachments": [a.filename for a in comment.attachments],
        "created_at": comment.created_at.isoformat()
    }), 201




@ticket_bp.route("/tickets/<int:ticket_id>/resolve", methods=["POST"])
@jwt_required()
def resolve_ticket(ticket_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify({"error": "Ticket not found"}), 404

    # Only agent can resolve
    if user.role != RoleEnum.agent:
        return jsonify({"error": "Only agents can resolve tickets"}), 403

    ticket.status = TicketStatusEnum.resolved
    ticket.resolved_at = datetime.datetime.utcnow()
    db.session.commit()

    return jsonify({
        "message": "Ticket marked as resolved. Waiting for customer confirmation.",
        "ticket_id": ticket.id,
        "status": ticket.status.value
    }), 200


@ticket_bp.route("/tickets/<int:ticket_id>/confirm", methods=["POST"])
@jwt_required()
def confirm_resolved(ticket_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify({"error": "Ticket not found"}), 404

    # Only customer can confirm
    
    if user.role != RoleEnum.customer:    
        return jsonify({"error": "Only customers can confirm resolution"}), 403

    data = request.get_json()
    rating = data.get("rating")

    if rating and (rating < 1 or rating > 5):
        return jsonify({"error": "Rating must be between 1 and 5"}), 400

    ticket.status = TicketStatusEnum.closed
    ticket.rating = rating
    db.session.commit()

    return jsonify({
        "message": "Ticket confirmed and closed",
        "ticket_id": ticket.id,
        "status": ticket.status.value,
        "rating": ticket.rating
    }), 200


@ticket_bp.route("/tickets/<int:ticket_id>/reopen", methods=["POST"])
@jwt_required()
def reopen_ticket(ticket_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify({"error": "Ticket not found"}), 404

    if user.role != RoleEnum.customer:
        return jsonify({"error": "Only customers can reopen tickets"}), 403

    ticket.status = TicketStatusEnum.in_progress
    ticket.rating = None  # reset rating
    ticket.resolved_at = None
    db.session.commit()

    return jsonify({
        "message": "Ticket reopened by customer",
        "ticket_id": ticket.id,
        "status": ticket.status.value
    }), 200
