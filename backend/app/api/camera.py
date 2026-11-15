from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
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
from app.schemas.camera import CameraOut

router = APIRouter(prefix="/api/cameras", tags=["Camera Centre"])


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

    # Load enrolled students in this room's active session for accurate association
    students_q = select(Student).options(selectinload(Student.user)).limit(24)
    students_res = await db.execute(students_q)
    students = students_res.scalars().all()
    roster = [{"id": s.id, "roll_number": s.roll_number, "name": s.user.full_name if s.user else ""} for s in students]

    # Get engine for this room
    engine = simulation_engines.get(camera.room_number)
    if not engine:
        engine = simulation_engines.get("A-101")

    state = engine.generate_current_frame_state(student_roster=roster)
    state["camera_id"] = camera.id
    state["camera_name"] = camera.name
    state["room_number"] = camera.room_number
    state["mode"] = camera.mode.value
    state["status"] = camera.status.value
    state["stream_health"] = camera.stream_health.value

    return state


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
