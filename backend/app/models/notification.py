import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class NotificationCategory(str, enum.Enum):
    ATTENDANCE = "ATTENDANCE"
    INCIDENT = "INCIDENT"
    SYSTEM = "SYSTEM"
    CAMERA = "CAMERA"
    ACADEMIC = "ACADEMIC"


class DeliveryStatus(str, enum.Enum):
    DELIVERED = "DELIVERED"
    PENDING = "PENDING"
    FAILED = "FAILED"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role_target = Column(String(32), nullable=True)  # STUDENT, FACULTY, HOD, ALL
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(Enum(NotificationCategory), default=NotificationCategory.SYSTEM, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    delivery_status = Column(Enum(DeliveryStatus), default=DeliveryStatus.DELIVERED, nullable=False)
    link_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="notifications")
