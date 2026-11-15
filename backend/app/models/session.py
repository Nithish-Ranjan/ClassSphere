import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class SessionStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class OperatingMode(str, enum.Enum):
    SIMULATION = "SIMULATION"
    CONNECTED = "CONNECTED"


class ClassSession(Base):
    __tablename__ = "class_sessions"

    id = Column(Integer, primary_key=True, index=True)
    timetable_id = Column(Integer, ForeignKey("timetables.id", ondelete="SET NULL"), nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False)
    room_number = Column(String(64), nullable=False)
    scheduled_start = Column(DateTime, nullable=False)
    scheduled_end = Column(DateTime, nullable=False)
    actual_start = Column(DateTime, nullable=True)
    actual_end = Column(DateTime, nullable=True)
    status = Column(Enum(SessionStatus), default=SessionStatus.SCHEDULED, nullable=False)
    mode = Column(Enum(OperatingMode), default=OperatingMode.SIMULATION, nullable=False)
    topic = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    timetable = relationship("Timetable", back_populates="class_sessions")
    subject = relationship("Subject", back_populates="class_sessions")
    section = relationship("Section", back_populates="class_sessions")
    faculty = relationship("Faculty", back_populates="class_sessions")
    attendance_session = relationship("AttendanceSession", back_populates="class_session", uselist=False)
    class_logs = relationship("ClassLog", back_populates="class_session", cascade="all, delete-orphan", order_by="ClassLog.timestamp")
    activity_events = relationship("ActivityEvent", back_populates="class_session", cascade="all, delete-orphan")
    incident_records = relationship("IncidentRecord", back_populates="class_session", cascade="all, delete-orphan")
    camera_sessions = relationship("CameraSession", back_populates="class_session", cascade="all, delete-orphan")


class ClassLog(Base):
    __tablename__ = "class_logs"

    id = Column(Integer, primary_key=True, index=True)
    class_session_id = Column(Integer, ForeignKey("class_sessions.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(64), nullable=False)  # CLASS_STARTED, ATTENDANCE_STARTED, ATTENDANCE_FINALIZED, CAMERA_CONNECTED, INCIDENT_ACKNOWLEDGED, CLASS_ENDED
    description = Column(Text, nullable=False)
    source = Column(String(32), default="SYSTEM", nullable=False)  # SYSTEM, FACULTY, CAMERA, VERIFICATION
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    class_session = relationship("ClassSession", back_populates="class_logs")
