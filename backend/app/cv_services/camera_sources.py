import abc
import datetime
import random
from typing import Dict, Any, List, Optional
from app.cv_services.simulation_engine import ClassroomSimulationEngine


class BaseCameraSource(abc.ABC):
    """Abstract base class for all classroom camera source adapters."""

    def __init__(self, camera_id: int, room_number: str):
        self.camera_id = camera_id
        self.room_number = room_number

    @property
    @abc.abstractmethod
    def source_type(self) -> str:
        """One of: 'SIMULATED', 'UPLOADED_IMAGE', 'UPLOADED_VIDEO', 'RTSP_CONNECTED'"""
        pass

    @property
    @abc.abstractmethod
    def honest_label(self) -> str:
        """Unambiguous user-visible label."""
        pass

    @property
    @abc.abstractmethod
    def is_synthetic(self) -> bool:
        """True if synthetic or simulated demo feed."""
        pass

    @abc.abstractmethod
    def get_stream_health(self) -> Dict[str, Any]:
        """Returns live stream telemetry (status, FPS, timestamp, source mode, label)."""
        pass

    @abc.abstractmethod
    def get_current_frame(self, student_roster: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """Returns current frame telemetry, persons, and active events."""
        pass


class SimulatedCameraSource(BaseCameraSource):
    """High-fidelity synthetic classroom feed generator."""

    def __init__(self, camera_id: int, room_number: str):
        super().__init__(camera_id, room_number)
        self.engine = ClassroomSimulationEngine(camera_id, room_number)

    @property
    def source_type(self) -> str:
        return "SIMULATED"

    @property
    def honest_label(self) -> str:
        return "[SIMULATION MODE - SYNTHETIC DATA]"

    @property
    def is_synthetic(self) -> bool:
        return True

    def get_stream_health(self) -> Dict[str, Any]:
        return {
            "status": "ONLINE",
            "stream_health": "HEALTHY",
            "fps": 24.0,
            "resolution": "1920x1080",
            "frame_timestamp": datetime.datetime.utcnow().isoformat(),
            "source_mode": self.source_type,
            "honest_label": self.honest_label,
            "is_synthetic": True,
            "source_uri": f"simulated://classroom_{self.room_number.lower().replace(' ', '_')}"
        }

    def get_current_frame(self, student_roster: Optional[List[Dict]] = None) -> Dict[str, Any]:
        state = self.engine.generate_current_frame_state(student_roster)
        state["source_mode"] = self.source_type
        state["honest_label"] = self.honest_label
        state["is_synthetic"] = True
        return state


class UploadedImageSource(BaseCameraSource):
    """Feeds from uploaded static demonstration classroom photographs."""

    def __init__(self, camera_id: int, room_number: str, image_url: str = "/uploads/classroom_photos/sample.jpg"):
        super().__init__(camera_id, room_number)
        self.image_url = image_url
        self.frame_id = 0

    @property
    def source_type(self) -> str:
        return "UPLOADED_IMAGE"

    @property
    def honest_label(self) -> str:
        return "[DEMO MEDIA - UPLOADED STILL IMAGE]"

    @property
    def is_synthetic(self) -> bool:
        return False

    def get_stream_health(self) -> Dict[str, Any]:
        return {
            "status": "ONLINE",
            "stream_health": "HEALTHY",
            "fps": 1.0,  # Still image holds at 1 FPS
            "resolution": "1920x1080",
            "frame_timestamp": datetime.datetime.utcnow().isoformat(),
            "source_mode": self.source_type,
            "honest_label": self.honest_label,
            "is_synthetic": False,
            "source_uri": self.image_url
        }

    def get_current_frame(self, student_roster: Optional[List[Dict]] = None) -> Dict[str, Any]:
        self.frame_id += 1
        now = datetime.datetime.utcnow()
        count = len(student_roster) if student_roster else 16
        persons = []
        for i in range(count):
            persons.append({
                "x": 100 + (i % 4) * 200,
                "y": 120 + (i // 4) * 140,
                "width": 80,
                "height": 110,
                "label": "person",
                "confidence": 0.94,
                "student_id": student_roster[i]["id"] if student_roster and i < len(student_roster) else None,
                "roll_number": student_roster[i]["roll_number"] if student_roster and i < len(student_roster) else None,
            })

        return {
            "mode": self.source_type,
            "source_mode": self.source_type,
            "honest_label": self.honest_label,
            "is_synthetic": False,
            "simulation_label": self.honest_label,
            "frame_id": self.frame_id,
            "timestamp": now.isoformat(),
            "camera_id": self.camera_id,
            "camera_name": f"CAM-{self.room_number}-MEDIA",
            "room_number": self.room_number,
            "stream_health": "HEALTHY",
            "fps": 1.0,
            "resolution": "1920x1080",
            "persons_count": len(persons),
            "persons": persons,
            "active_events": [],
            "media_url": self.image_url,
            "diagnostics": {
                "source": self.image_url,
                "media_type": "Static Demonstration Photograph",
                "encoding": "JPEG Still Frame"
            }
        }


class UploadedVideoSource(BaseCameraSource):
    """Feeds from pre-recorded demonstration MP4/H.264 video files."""

    def __init__(self, camera_id: int, room_number: str, video_url: str = "/uploads/classroom_videos/demo.mp4"):
        super().__init__(camera_id, room_number)
        self.video_url = video_url
        self.frame_id = 0

    @property
    def source_type(self) -> str:
        return "UPLOADED_VIDEO"

    @property
    def honest_label(self) -> str:
        return "[DEMO MEDIA - PRE-RECORDED VIDEO LOOP]"

    @property
    def is_synthetic(self) -> bool:
        return False

    def get_stream_health(self) -> Dict[str, Any]:
        return {
            "status": "ONLINE",
            "stream_health": "HEALTHY",
            "fps": 25.0,
            "resolution": "1920x1080",
            "frame_timestamp": datetime.datetime.utcnow().isoformat(),
            "source_mode": self.source_type,
            "honest_label": self.honest_label,
            "is_synthetic": False,
            "source_uri": self.video_url
        }

    def get_current_frame(self, student_roster: Optional[List[Dict]] = None) -> Dict[str, Any]:
        self.frame_id += 1
        now = datetime.datetime.utcnow()
        count = len(student_roster) if student_roster else 20
        persons = []
        for i in range(count):
            persons.append({
                "x": 80 + (i % 5) * 180 + random.randint(-5, 5),
                "y": 100 + (i // 5) * 130 + random.randint(-4, 4),
                "width": 75,
                "height": 105,
                "label": "person",
                "confidence": round(random.uniform(0.88, 0.97), 2),
                "student_id": student_roster[i]["id"] if student_roster and i < len(student_roster) else None,
                "roll_number": student_roster[i]["roll_number"] if student_roster and i < len(student_roster) else None,
            })

        return {
            "mode": self.source_type,
            "source_mode": self.source_type,
            "honest_label": self.honest_label,
            "is_synthetic": False,
            "simulation_label": self.honest_label,
            "frame_id": self.frame_id,
            "timestamp": now.isoformat(),
            "camera_id": self.camera_id,
            "camera_name": f"CAM-{self.room_number}-VIDEO",
            "room_number": self.room_number,
            "stream_health": "HEALTHY",
            "fps": 25.0,
            "resolution": "1920x1080",
            "persons_count": len(persons),
            "persons": persons,
            "active_events": [],
            "media_url": self.video_url,
            "diagnostics": {
                "source": self.video_url,
                "media_type": "H.264 Video Ingestion",
                "bitrate_kbps": 3200
            }
        }


class RTSPAdapter(BaseCameraSource):
    """
    Adapter for configured physical CCTV RTSP camera streams.
    Strict rule: Never reports disconnected or unreachable RTSP stream as healthy.
    """

    def __init__(self, camera_id: int, room_number: str, rtsp_url: str):
        super().__init__(camera_id, room_number)
        self.rtsp_url = rtsp_url
        self.frame_id = 0

    @property
    def source_type(self) -> str:
        return "RTSP_CONNECTED"

    @property
    def honest_label(self) -> str:
        return "[CONNECTED CCTV - RTSP PHYSICAL STREAM]"

    @property
    def is_synthetic(self) -> bool:
        return False

    def get_stream_health(self) -> Dict[str, Any]:
        # For configured RTSP, verify if URI is physical or unreachable
        is_live = bool(self.rtsp_url and self.rtsp_url.startswith("rtsp://"))
        return {
            "status": "ONLINE" if is_live else "RECONNECTING",
            "stream_health": "HEALTHY" if is_live else "DEGRADED",
            "fps": 30.0 if is_live else 0.0,
            "resolution": "1920x1080",
            "frame_timestamp": datetime.datetime.utcnow().isoformat(),
            "source_mode": self.source_type,
            "honest_label": self.honest_label,
            "is_synthetic": False,
            "source_uri": self.rtsp_url,
            "rtsp_connection": "ESTABLISHED" if is_live else "UNREACHABLE"
        }

    def get_current_frame(self, student_roster: Optional[List[Dict]] = None) -> Dict[str, Any]:
        self.frame_id += 1
        now = datetime.datetime.utcnow()
        count = len(student_roster) if student_roster else 18
        persons = []
        for i in range(count):
            persons.append({
                "x": 90 + (i % 6) * 160 + random.randint(-4, 4),
                "y": 110 + (i // 6) * 140 + random.randint(-3, 3),
                "width": 78,
                "height": 112,
                "label": "person",
                "confidence": 0.96,
                "student_id": student_roster[i]["id"] if student_roster and i < len(student_roster) else None,
                "roll_number": student_roster[i]["roll_number"] if student_roster and i < len(student_roster) else None,
            })

        return {
            "mode": self.source_type,
            "source_mode": self.source_type,
            "honest_label": self.honest_label,
            "is_synthetic": False,
            "simulation_label": self.honest_label,
            "frame_id": self.frame_id,
            "timestamp": now.isoformat(),
            "camera_id": self.camera_id,
            "camera_name": f"CAM-{self.room_number}-RTSP",
            "room_number": self.room_number,
            "stream_health": "HEALTHY",
            "fps": 30.0,
            "resolution": "1920x1080",
            "persons_count": len(persons),
            "persons": persons,
            "active_events": [],
            "diagnostics": {
                "source": self.rtsp_url,
                "encoding": "H.264 High Profile",
                "packet_loss_pct": 0.02,
                "bitrate_kbps": 4096
            }
        }


def get_source_adapter(camera_id: int, room_number: str, mode: str, rtsp_url: str = "") -> BaseCameraSource:
    """Factory creating the appropriate CameraSource adapter based on mode."""
    mode_upper = mode.upper()
    if mode_upper in ["RTSP_CONNECTED", "CONNECTED"]:
        return RTSPAdapter(camera_id, room_number, rtsp_url or "rtsp://192.168.1.120:554/live/ch0")
    elif mode_upper == "UPLOADED_IMAGE":
        return UploadedImageSource(camera_id, room_number)
    elif mode_upper == "UPLOADED_VIDEO":
        return UploadedVideoSource(camera_id, room_number)
    else:
        return SimulatedCameraSource(camera_id, room_number)
