from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import enum

from extensions import db  # import db from extensions.py

class RoleEnum(enum.Enum):
    super_admin = "super_admin"
    admin = "admin"
    agent = "agent"
    customer = "customer"

# rest of your models here...

class Department(db.Model):
    __tablename__ = "departments"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Department {self.name}>"

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(RoleEnum), nullable=False, default=RoleEnum.customer)
    is_active = db.Column(db.Boolean, default=True)

    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)


    department_id = db.Column(db.Integer, db.ForeignKey("departments.id"), nullable=True)
    department = db.relationship("Department", backref=db.backref("users", lazy="dynamic"))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def is_admin(self):
        return self.role in {RoleEnum.admin, RoleEnum.super_admin}

    def is_super_admin(self):
        return self.role == RoleEnum.super_admin
    
    def assign_department(self, department):
        """
        Assigns a department to the user if allowed by their role.
        """
        if self.role == RoleEnum.customer:
            raise ValueError("Customers cannot be assigned to a department.")
        self.department = department

    def __repr__(self):
        return f"<User {self.email} ({self.role.value})>"
