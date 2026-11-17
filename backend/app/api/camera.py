from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.academic import Student
from app.models.camera import Camera, CameraMode, CameraStatus, StreamHealth
from app.models.event import ActivityEvent, IncidentRecord, EventType, IncidentType, IncidentStatus
from app.core.dependencies import get_current_user, require_faculty
from app.core.websockets import manager
from app.cv_services.simulation_engine import simulation_engines
from app.cv_services.camera_sources import get_source_adapter
from app.schemas.camera import CameraOut

router = APIRouter(prefix="/api/cameras", tags=["Camera Centre"])


class SetSourceModeRequest(BaseModel):
    source_mode: str  # "SIMULATED", "UPLOADED_IMAGE", "UPLOADED_VIDEO", "RTSP_CONNECTED"
    rtsp_url: Optional[str] = None
    media_url: Optional[str] = None


@router.get("", response_model=List[CameraOut])
async def list_cameras(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Camera).order_by(Camera.room_number)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{camera_id}/stream")
async def get_camera_stream_state(
    camera_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    camera = await db.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    students_q = select(Student).options(selectinload(Student.user)).limit(24)
    students_res = await db.execute(students_q)
    students = students_res.scalars().all()
    roster = [{"id": s.id, "roll_number": s.roll_number, "name": s.user.full_name if s.user else ""} for s in students]

    adapter = get_source_adapter(camera.id, camera.room_number, camera.mode.value, camera.ip_or_rtsp_url)
    health = adapter.get_stream_health()
    state = adapter.get_current_frame(student_roster=roster)

    state["camera_id"] = camera.id
    state["camera_name"] = camera.name
    state["room_number"] = camera.room_number
    state["mode"] = camera.mode.value
    state["status"] = health["status"]
    state["stream_health"] = health["stream_health"]
    state["fps"] = health["fps"]
    state["honest_label"] = health["honest_label"]
    state["simulation_label"] = health["honest_label"]
    state["stream_health_telemetry"] = health

    return state


@router.post("/{camera_id}/set-source")
async def set_camera_source_mode(
    camera_id: int,
    req: SetSourceModeRequest,
    current_user: User = Depends(require_faculty),
    db: AsyncSession = Depends(get_db)
):
    """
    Controls camera media source adapter:
    - SIMULATED
    - UPLOADED_IMAGE
    - UPLOADED_VIDEO
    - RTSP_CONNECTED
    Never misrepresents synthetic or pre-recorded feeds as connected CCTV.
    """
    camera = await db.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    mode_upper = req.source_mode.upper()
    if mode_upper in ["RTSP_CONNECTED", "CONNECTED"]:
        camera.mode = CameraMode.CONNECTED
        camera.ip_or_rtsp_url = req.rtsp_url or "rtsp://192.168.1.120:554/live/ch0"
        camera.fps = 30.0
    else:
        camera.mode = CameraMode.SIMULATION
        if mode_upper == "UPLOADED_IMAGE":
            camera.ip_or_rtsp_url = req.media_url or "/uploads/classroom_photos/sample.jpg"
            camera.fps = 1.0
        elif mode_upper == "UPLOADED_VIDEO":
            camera.ip_or_rtsp_url = req.media_url or "/uploads/classroom_videos/demo.mp4"
            camera.fps = 25.0
        else:
            camera.ip_or_rtsp_url = f"simulated://classroom_{camera.room_number.lower().replace(' ', '_')}"
            camera.fps = 24.0

    await db.commit()

    adapter = get_source_adapter(camera.id, camera.room_number, mode_upper, camera.ip_or_rtsp_url)
    health = adapter.get_stream_health()

    await manager.broadcast_global(
        "CAMERA_STATUS_CHANGED",
        {"camera_id": camera.id, "mode": mode_upper, "status": health["status"]}
    )

    return {
        "camera_id": camera.id,
        "new_mode": mode_upper,
        "honest_label": health["honest_label"],
        "stream_health": health,
        "message": f"Camera source switched to {health['honest_label']}."
    }


@router.post("/{camera_id}/toggle-mode")
async def toggle_camera_mode(
    camera_id: int,
    current_user: User = Depends(require_faculty),
    db: AsyncSession = Depends(get_db)
):
    camera = await db.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    # Toggle mode
    if camera.mode == CameraMode.SIMULATION:
        camera.mode = CameraMode.CONNECTED
        camera.ip_or_rtsp_url = "rtsp://192.168.1.120:554/live/ch0"
    else:
        camera.mode = CameraMode.SIMULATION
        camera.ip_or_rtsp_url = f"simulated://classroom_{camera.room_number.lower().replace(' ', '_')}"

    await db.commit()

    # Broadcast camera status change via WebSocket
    await manager.broadcast_global(
        "CAMERA_STATUS_CHANGED",
        {"camera_id": camera.id, "mode": camera.mode.value, "status": camera.status.value}
    )

    return {
        "camera_id": camera.id,
        "new_mode": camera.mode.value,
        "message": f"Camera switched to {camera.mode.value} mode."
    }


@router.post("/{camera_id}/trigger-simulated-event")
async def trigger_simulated_event(
    camera_id: int,
    event_type: str,  # PHONE_USAGE, TALKING, SUDDEN_FALL
    class_session_id: int = 1,
    current_user: User = Depends(require_faculty),
    db: AsyncSession = Depends(get_db)
):
    """
    Triggers a live simulated event on demand for testing/demo workflows.
    Inserts into database and broadcasts over WebSocket in real time!
    """
    camera = await db.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    # Pick a student
    st_q = select(Student).options(selectinload(Student.user)).limit(1)
    st_res = await db.execute(st_q)
    student = st_res.scalar_one_or_none()

    now = datetime.utcnow()

    if event_type == "SUDDEN_FALL":
        # Emergency safety incident (PRD FR-13)
        incident = IncidentRecord(
            class_session_id=class_session_id,
            camera_id=camera.id,
            incident_type=IncidentType.SUDDEN_FALL,
            confidence=0.89,
            timestamp=now,
            evidence_snapshot_url="/uploads/classroom_photos/incident_fall_sim.jpg",
            status=IncidentStatus.PENDING_FACULTY_REVIEW,
            is_simulated=1
        )
        db.add(incident)
        await db.commit()

        # Broadcast critical alert via WebSocket
        await manager.broadcast_global(
            "SAFETY_INCIDENT_DETECTED",
            {
                "incident_id": incident.id,
                "type": incident.incident_type.value,
                "room_number": camera.room_number,
                "confidence": incident.confidence,
                "timestamp": incident.timestamp.isoformat(),
                "status": incident.status.value,
                "is_simulated": True
            }
        )
        return {"status": "SUCCESS", "incident_id": incident.id, "type": "SUDDEN_FALL"}

    elif event_type in ["PHONE_USAGE", "TALKING"]:
        ev_type = EventType.PHONE_USAGE if event_type == "PHONE_USAGE" else EventType.TALKING
        activity = ActivityEvent(
            class_session_id=class_session_id,
            camera_id=camera.id,
            student_id=student.id if student else None,
            event_type=ev_type,
            confidence=0.88,
            timestamp=now,
            model_version="yolo-activity-sim-v1.0",
            is_simulated=1
        )
        db.add(activity)
        await db.commit()

        # Broadcast event via WebSocket
        await manager.broadcast_to_room(
            class_session_id,
            "ACTIVITY_EVENT_DETECTED",
            {
                "event_id": activity.id,
                "type": activity.event_type.value,
                "student_id": activity.student_id,
                "roll_number": student.roll_number if student else "N/A",
                "student_name": student.user.full_name if student and student.user else "Student",
                "confidence": activity.confidence,
                "timestamp": activity.timestamp.isoformat(),
                "is_simulated": True
            }
        )
        return {"status": "SUCCESS", "event_id": activity.id, "type": event_type}

    raise HTTPException(status_code=400, detail="Invalid event type")
