import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class EventType(str, enum.Enum):
    PHONE_USAGE = "PHONE_USAGE"
    TALKING = "TALKING"
    OTHER = "OTHER"


class EventReviewStatus(str, enum.Enum):
    UNREVIEWED = "UNREVIEWED"
    VERIFIED = "VERIFIED"
    DISMISSED = "DISMISSED"


class IncidentType(str, enum.Enum):
    SUDDEN_FALL = "SUDDEN_FALL"
    UNUSUAL_EVENT = "UNUSUAL_EVENT"


class IncidentStatus(str, enum.Enum):
    PENDING_FACULTY_REVIEW = "PENDING_FACULTY_REVIEW"
    ACKNOWLEDGED_FACULTY = "ACKNOWLEDGED_FACULTY"
    DISMISSED_FACULTY = "DISMISSED_FACULTY"
    ESCALATED_TO_HOD = "ESCALATED_TO_HOD"
    RESOLVED_HOD = "RESOLVED_HOD"
    DISMISSED_HOD = "DISMISSED_HOD"


class ActivityEvent(Base):
    __tablename__ = "activity_events"

    id = Column(Integer, primary_key=True, index=True)
    class_session_id = Column(Integer, ForeignKey("class_sessions.id", ondelete="CASCADE"), nullable=False)
    camera_id = Column(Integer, ForeignKey("cameras.id", ondelete="SET NULL"), nullable=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="SET NULL"), nullable=True)
    event_type = Column(Enum(EventType), nullable=False)
    confidence = Column(Float, nullable=False)  # 0.0 - 1.0
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    frame_snapshot_url = Column(String(512), nullable=True)
    model_version = Column(String(64), default="yolo-activity-v1.0", nullable=False)
    bounding_box = Column(String(128), nullable=True)  # [x, y, w, h] json string
    review_status = Column(Enum(EventReviewStatus), default=EventReviewStatus.UNREVIEWED, nullable=False)
    is_simulated = Column(Integer, default=1, nullable=False)  # 1 = Simulated, 0 = Verified camera
    data_source = Column(String(32), default="SIMULATED", nullable=False)

    class_session = relationship("ClassSession", back_populates="activity_events")
    camera = relationship("Camera", back_populates="activity_events")
    student = relationship("Student", back_populates="activity_events")


class IncidentRecord(Base):
    __tablename__ = "incident_records"

    id = Column(Integer, primary_key=True, index=True)
    class_session_id = Column(Integer, ForeignKey("class_sessions.id", ondelete="CASCADE"), nullable=False)
    camera_id = Column(Integer, ForeignKey("cameras.id", ondelete="SET NULL"), nullable=True)
    incident_type = Column(Enum(IncidentType), nullable=False)
    confidence = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    evidence_snapshot_url = Column(String(512), nullable=True)
    status = Column(Enum(IncidentStatus), default=IncidentStatus.PENDING_FACULTY_REVIEW, nullable=False)
    faculty_notes = Column(Text, nullable=True)
    hod_decision = Column(Text, nullable=True)
    acknowledged_by_faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="SET NULL"), nullable=True)
    resolved_by_hod_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_simulated = Column(Integer, default=1, nullable=False)
    data_source = Column(String(32), default="SIMULATED", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    class_session = relationship("ClassSession", back_populates="incident_records")
    camera = relationship("Camera", back_populates="incident_records")
    review_actions = relationship("ReviewAction", back_populates="incident", cascade="all, delete-orphan")


class ReviewAction(Base):
    __tablename__ = "review_actions"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incident_records.id", ondelete="CASCADE"), nullable=True)
    activity_event_id = Column(Integer, ForeignKey("activity_events.id", ondelete="CASCADE"), nullable=True)
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(64), nullable=False)  # ACKNOWLEDGE, DISMISS, ESCALATE, OVERRIDE
    reason = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    incident = relationship("IncidentRecord", back_populates="review_actions")


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(128), nullable=False)
    task_type = Column(String(64), nullable=False)  # PERSON_DETECTION, FACE_VERIFICATION, PHONE_DETECTION, TALKING_ESTIMATION, FALL_DETECTION
    version = Column(String(32), nullable=False)
    source = Column(String(128), nullable=False)
    dataset = Column(String(128), nullable=False)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    false_positive_rate = Column(Float, nullable=True)
    false_negative_rate = Column(Float, nullable=True)
    processing_time_ms = Column(Float, nullable=True)
    limitations = Column(Text, nullable=True)
    is_active = Column(Integer, default=1, nullable=False)
