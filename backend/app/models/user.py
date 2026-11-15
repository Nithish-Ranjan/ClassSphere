import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class RoleEnum(str, enum.Enum):
    STUDENT = "STUDENT"
    FACULTY = "FACULTY"
    HOD = "HOD"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    institutional_id = Column(String(64), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone_number = Column(String(32), nullable=True)
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.STUDENT)
    is_active = Column(Boolean, default=True, nullable=False)
    is_phone_verified = Column(Boolean, default=False, nullable=False)
    avatar_url = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    student_profile = relationship("Student", back_populates="user", uselist=False, cascade="all, delete-orphan")
    faculty_profile = relationship("Faculty", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(128), nullable=False)
    resource = Column(String(128), nullable=False)
    ip_address = Column(String(64), nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="audit_logs")
