from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class CameraOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    room_number: str
    ip_or_rtsp_url: str
    mode: str
    status: str
    stream_health: str
    fps: float
    resolution: str
    last_heartbeat: datetime
    error_message: Optional[str] = None


class CameraStreamState(BaseModel):
    mode: str
    simulation_label: str
    frame_id: int
    timestamp: str
    camera_id: int
    camera_name: str
    room_number: str
    stream_health: str
    fps: float
    resolution: str
    persons_count: int
    persons: List[Dict[str, Any]]
    active_events: List[Dict[str, Any]]
    diagnostics: Dict[str, Any]
