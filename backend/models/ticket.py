from datetime import datetime
import enum
from . import db
from .user import User, Department

class TicketStatusEnum(enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"

class PriorityEnum(enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"

class Ticket(db.Model):
    __tablename__ = "tickets"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.Enum(TicketStatusEnum), default=TicketStatusEnum.open, nullable=False)
    priority = db.Column(db.Enum(PriorityEnum), default=PriorityEnum.medium, nullable=False)

    created_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_by = db.relationship("User", foreign_keys=[created_by_id], backref=db.backref("created_tickets", lazy="dynamic"))

    assigned_to_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    assigned_to = db.relationship("User", foreign_keys=[assigned_to_id], backref=db.backref("assigned_tickets", lazy="dynamic"))

    department_id = db.Column(db.Integer, db.ForeignKey("departments.id"), nullable=True)
    department = db.relationship("Department", backref=db.backref("tickets", lazy="dynamic"))

    sla_due = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    comments = db.relationship("Comment", backref="ticket", lazy="dynamic", cascade="all, delete-orphan")
    attachments = db.relationship("Attachment", backref="ticket", lazy="dynamic", cascade="all, delete-orphan")

    resolved_at = db.Column(db.DateTime, nullable=True)
    rating = db.Column(db.Integer, nullable=True)  # 1–5 stars

    def __repr__(self):
        return f"<Ticket {self.id} - {self.title[:30]}>"

class Comment(db.Model):
    __tablename__ = "comments"
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("tickets.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    user = db.relationship("User")
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # 🔗 Add this relationship
    attachments = db.relationship("Attachment", backref="comment", lazy=True)

    def __repr__(self):
        return f"<Comment {self.id} on Ticket {self.ticket_id}>"


class Attachment(db.Model):
    __tablename__ = "attachments"
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("tickets.id"), nullable=False)
    comment_id = db.Column(db.Integer, db.ForeignKey("comments.id"), nullable=True)
    filename = db.Column(db.String(512), nullable=False)
    file_path = db.Column(db.String(1024), nullable=False)
    content_type = db.Column(db.String(255), nullable=True)
    size = db.Column(db.Integer, nullable=True)
    uploaded_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    uploaded_by = db.relationship("User")
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Attachment {self.filename} for Ticket {self.ticket_id}>"
