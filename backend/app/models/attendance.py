import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Enum, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class AttendanceStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    LATE = "LATE"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    MANUAL_REVIEW = "MANUAL_REVIEW"
    DISPUTED = "DISPUTED"


class AttendanceSessionStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"
    FINALIZED = "FINALIZED"


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(Integer, primary_key=True, index=True)
    class_session_id = Column(Integer, ForeignKey("class_sessions.id", ondelete="CASCADE"), unique=True, nullable=False)
    verification_challenge = Column(String(64), nullable=False)  # 6-digit challenge code or unique token
    created_by_faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(AttendanceSessionStatus), default=AttendanceSessionStatus.ACTIVE, nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    closed_at = Column(DateTime, nullable=True)
    classroom_photo_url = Column(String(512), nullable=True)
    detected_faces_count = Column(Integer, default=0, nullable=False)
    verified_matches_count = Column(Integer, default=0, nullable=False)
    pending_reviews_count = Column(Integer, default=0, nullable=False)

    class_session = relationship("ClassSession", back_populates="attendance_session")
    attempts = relationship("AttendanceAttempt", back_populates="attendance_session", cascade="all, delete-orphan")
    records = relationship("AttendanceRecord", back_populates="attendance_session", cascade="all, delete-orphan")


class AttendanceAttempt(Base):
    __tablename__ = "attendance_attempts"

    id = Column(Integer, primary_key=True, index=True)
    attendance_session_id = Column(Integer, ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    attempt_type = Column(String(32), default="QR_CHECKIN", nullable=False)  # QR_CHECKIN, PHOTO_VERIFY, MANUAL
    challenge_token = Column(String(64), nullable=False)
    ip_address = Column(String(64), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(32), default="VALID", nullable=False)  # VALID, INVALID, DUPLICATE

    attendance_session = relationship("AttendanceSession", back_populates="attempts")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    attendance_session_id = Column(Integer, ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False)
    class_session_id = Column(Integer, ForeignKey("class_sessions.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(AttendanceStatus), default=AttendanceStatus.PENDING_VERIFICATION, nullable=False)
    confidence_score = Column(Float, nullable=True)  # Match confidence between 0.0 and 1.0
    verified_by_photo = Column(Boolean, default=False, nullable=False)
    matched_candidate_box = Column(String(128), nullable=True)  # Bounding box JSON
    manual_override = Column(Boolean, default=False, nullable=False)
    override_reason = Column(Text, nullable=True)
    override_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verification_method = Column(String(64), default="CCTV_FACE_MATCH", nullable=False)
    verification_status = Column(String(32), default="VERIFIED", nullable=False)
    data_source = Column(String(32), default="SIMULATED", nullable=False)
    marked_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    attendance_session = relationship("AttendanceSession", back_populates="records")
    student = relationship("Student", back_populates="attendance_records")

    __table_args__ = (
        UniqueConstraint("attendance_session_id", "student_id", name="uq_attendance_session_student"),
    )


class IdentityReference(Base):
    __tablename__ = "identity_references"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    reference_photo_url = Column(String(512), nullable=False)
    embedding_vector = Column(Text, nullable=True)  # JSON serialized vector representation
    quality_score = Column(Float, default=1.0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    consented_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    student = relationship("Student", back_populates="identity_references")
