import os
import time
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from extensions import db
from models.ticket import Ticket, PriorityEnum, Attachment
from models.user import User, RoleEnum


agent_bp = Blueprint("agent_bp", __name__)

# ========================
# Agent: Get Assigned Tickets (with attachments)
# ========================
@agent_bp.route("/agent/tickets", methods=["GET"])
@jwt_required()
def get_agent_tickets():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user or user.role != RoleEnum.agent:
        return jsonify({"error": "Only agents can view assigned tickets"}), 403

    tickets = Ticket.query.filter_by(assigned_to_id=user.id).all()

    return jsonify({
        "tickets": [
            {
                "id": t.id,
                "title": t.title,
                "priority": t.priority.value,
                "status": t.status.value,
                "created_by": User.query.get(t.created_by_id).name if t.created_by_id else None,
                "assigned_to": user.name,
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