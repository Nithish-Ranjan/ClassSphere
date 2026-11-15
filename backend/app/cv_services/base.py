import abc
from dataclasses import dataclass
from typing import List, Optional, Tuple
from datetime import datetime


@dataclass
class DetectionBox:
    x: int
    y: int
    width: int
    height: int
    label: str
    confidence: float
    student_id: Optional[int] = None
    roll_number: Optional[str] = None


@dataclass
class FrameMetadata:
    frame_id: int
    timestamp: datetime
    camera_id: Optional[int]
    camera_name: str
    room_number: str
    mode: str  # SIMULATION or CONNECTED
    width: int
    height: int


@dataclass
class FrameAnalysisResult:
    metadata: FrameMetadata
    persons_detected: int
    person_boxes: List[DetectionBox]
    face_boxes: List[DetectionBox]
    phone_detections: List[DetectionBox]
    talking_estimates: List[DetectionBox]
    fall_incidents: List[DetectionBox]
    verified_students: List[Tuple[int, float]]  # (student_id, confidence)
    unmatched_candidates: List[DetectionBox]


class CameraIngestionInterface(abc.ABC):
    @abc.abstractmethod
    async def get_latest_frame(self) -> Tuple[bytes, FrameMetadata]:
        """Fetch latest raw image frame bytes and metadata"""
        pass

    @abc.abstractmethod
    def get_source_status(self) -> dict:
        """Return stream health and connection status"""
        pass
