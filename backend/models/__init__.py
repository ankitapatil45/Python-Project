# models/__init__.py

# Import the db instance created in app.py
from app import db

# Import models so SQLAlchemy knows them
from .user import User, Department, RoleEnum
from .ticket import Ticket, Comment, Attachment, TicketStatusEnum, PriorityEnum
from .kb_article import KBArticle
from .audit_log import AuditLog
from .settings import Setting

# Optional modules (import only if you have these files)
try:
    from .analytics import *
except ImportError:
    pass

try:
    from .front_page import *
except ImportError:
    pass

# This ensures that when you do `from app.models import *`, everything is available
__all__ = [
    "db",
    "User", "Department", "RoleEnum",
    "Ticket", "Comment", "Attachment", "TicketStatusEnum", "PriorityEnum",
    "KBArticle",
    "AuditLog",
    "Setting"
]
