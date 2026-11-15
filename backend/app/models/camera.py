import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class CameraMode(str, enum.Enum):
    SIMULATION = "SIMULATION"
    CONNECTED = "CONNECTED"


class CameraStatus(str, enum.Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    RECONNECTING = "RECONNECTING"
    ERROR = "ERROR"


class StreamHealth(str, enum.Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    DOWN = "DOWN"


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    room_number = Column(String(64), nullable=False)
    ip_or_rtsp_url = Column(String(255), nullable=False)
    mode = Column(Enum(CameraMode), default=CameraMode.SIMULATION, nullable=False)
    status = Column(Enum(CameraStatus), default=CameraStatus.ONLINE, nullable=False)
    stream_health = Column(Enum(StreamHealth), default=StreamHealth.HEALTHY, nullable=False)
    fps = Column(Float, default=24.0, nullable=False)
    resolution = Column(String(32), default="1920x1080", nullable=False)
    last_heartbeat = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_frame_timestamp = Column(DateTime, default=datetime.utcnow, nullable=True)
    error_message = Column(Text, nullable=True)
    data_source = Column(String(32), default="SIMULATED", nullable=False)

    camera_sessions = relationship("CameraSession", back_populates="camera")
    activity_events = relationship("ActivityEvent", back_populates="camera")
    incident_records = relationship("IncidentRecord", back_populates="camera")


class CameraSession(Base):
    __tablename__ = "camera_sessions"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False)
    class_session_id = Column(Integer, ForeignKey("class_sessions.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    total_frames_processed = Column(Integer, default=0, nullable=False)
    fps_average = Column(Float, default=0.0, nullable=False)
    status = Column(String(32), default="ACTIVE", nullable=False)

    camera = relationship("Camera", back_populates="camera_sessions")
    class_session = relationship("ClassSession", back_populates="camera_sessions")
