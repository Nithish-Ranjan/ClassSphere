from datetime import datetime, date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.academic import Faculty, Subject, Section, Timetable, Student, Enrollment
from app.models.session import ClassSession, ClassLog, SessionStatus
from app.models.attendance import AttendanceSession, AttendanceRecord, AttendanceStatus
from app.models.event import ActivityEvent, IncidentRecord, IncidentStatus
from app.models.camera import Camera
from app.core.dependencies import require_faculty
from app.schemas.academic import ClassSessionOut, ClassLogOut

router = APIRouter(prefix="/api/faculty", tags=["Faculty Portal"])


async def _get_faculty_for_user(user: User, db: AsyncSession) -> Faculty:
    q = select(Faculty).where(Faculty.user_id == user.id).options(
        selectinload(Faculty.department)
    )
    res = await db.execute(q)
    fac = res.scalar_one_or_none()
    if not fac:
        raise HTTPException(status_code=404, detail="Faculty profile not found")
    return fac


@router.get("/dashboard")
async def get_faculty_dashboard(
    current_user: User = Depends(require_faculty),
    db: AsyncSession = Depends(get_db)
):
    faculty = await _get_faculty_for_user(current_user, db)

    # Fetch classes handled by faculty
    q = select(ClassSession).where(
        ClassSession.faculty_id == faculty.id
    ).order_by(ClassSession.scheduled_start.desc()).options(
        selectinload(ClassSession.subject),
        selectinload(ClassSession.section),
        selectinload(ClassSession.attendance_session).selectinload(AttendanceSession.records)
    )
    res = await db.execute(q)
    all_sessions = res.scalars().all()

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    today_sessions = [s for s in all_sessions if today_start <= s.scheduled_start < today_end]
    active_sessions = [s for s in all_sessions if s.status == SessionStatus.ACTIVE]
    completed_sessions = [s for s in all_sessions if s.status == SessionStatus.COMPLETED]

    # Active incidents
    inc_q = select(IncidentRecord).where(
        IncidentRecord.status.in_([IncidentStatus.PENDING_FACULTY_REVIEW, IncidentStatus.ESCALATED_TO_HOD])
    )
    inc_res = await db.execute(inc_q)
    active_incidents = len(inc_res.scalars().all())

    # Format classes
    class_cards = []
    for s in today_sessions:
        att = s.attendance_session
        records = att.records if att else []
        present = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
        late = sum(1 for r in records if r.status == AttendanceStatus.LATE)
        pending = sum(1 for r in records if r.status == AttendanceStatus.MANUAL_REVIEW)

        class_cards.append({
            "id": s.id,
            "subject_name": s.subject.name,
            "subject_code": s.subject.code,
            "section_name": s.section.name,
            "room_number": s.room_number,
            "scheduled_time": f"{s.scheduled_start.strftime('%I:%M %p')} - {s.scheduled_end.strftime('%I:%M %p')}",
            "status": s.status.value,
            "attendance_taken": att is not None,
            "present_count": present,
            "late_count": late,
            "pending_review_count": pending,
            "total_enrolled": len(records)
        })

    return {
        "faculty_name": current_user.full_name,
        "designation": faculty.designation,
        "department": faculty.department.name if faculty.department else "",
        "today_classes_count": len(today_sessions),
        "active_classes_count": len(active_sessions),
        "completed_classes_count": len(completed_sessions),
        "active_safety_alerts": active_incidents,
        "today_classes": class_cards
    }


@router.get("/daily-overview")
async def get_faculty_daily_overview(
    current_user: User = Depends(require_faculty),
    db: AsyncSession = Depends(get_db)
):
    faculty = await _get_faculty_for_user(current_user, db)

    # Timeline of classes for the day
    q = select(ClassSession).where(
        ClassSession.faculty_id == faculty.id
    ).order_by(ClassSession.scheduled_start).options(
        selectinload(ClassSession.subject),
        selectinload(ClassSession.section),
        selectinload(ClassSession.attendance_session).selectinload(AttendanceSession.records)
    )
    res = await db.execute(q)
    sessions = res.scalars().all()

    timeline = []
    for s in sessions:
        att = s.attendance_session
        records = att.records if att else []
        present = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
        total = len(records)
        att_pct = round((present / total * 100), 1) if total > 0 else 0.0

        timeline.append({
            "session_id": s.id,
            "subject_code": s.subject.code,
            "subject_name": s.subject.name,
            "section_name": s.section.name,
            "room_number": s.room_number,
            "scheduled_start": s.scheduled_start.strftime("%I:%M %p"),
            "scheduled_end": s.scheduled_end.strftime("%I:%M %p"),
            "status": s.status.value,
            "attendance_percentage": att_pct,
            "total_students": total,
            "has_attendance_session": att is not None
        })

    return {
        "faculty_name": current_user.full_name,
        "date": datetime.utcnow().strftime("%A, %B %d, %Y"),
        "timeline": timeline
    }


@router.get("/classes/{class_id}/dashboard")
async def get_complete_class_dashboard(
    class_id: int,
    current_user: User = Depends(require_faculty),
    db: AsyncSession = Depends(get_db)
):
    """
    PRD FR-10: Complete Class Dashboard
    Answers: 'What is happening in this classroom, and what requires attention?'
    """
    s_q = select(ClassSession).where(ClassSession.id == class_id).options(
        selectinload(ClassSession.subject),
        selectinload(ClassSession.section),
        selectinload(ClassSession.faculty).selectinload(Faculty.user),
        selectinload(ClassSession.attendance_session).selectinload(AttendanceSession.records).selectinload(AttendanceRecord.student).selectinload(Student.user),
        selectinload(ClassSession.class_logs)
    )
    s_res = await db.execute(s_q)
    session = s_res.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Class session not found")

    att = session.attendance_session
    records = att.records if att else []

    present = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
    late = sum(1 for r in records if r.status == AttendanceStatus.LATE)
    absent = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
    pending = sum(1 for r in records if r.status == AttendanceStatus.MANUAL_REVIEW)

    # Activity events count for this session
    ev_q = select(ActivityEvent).where(ActivityEvent.class_session_id == session.id)
    ev_res = await db.execute(ev_q)
    events = ev_res.scalars().all()

    # Active safety alerts for this session
    inc_q = select(IncidentRecord).where(
        IncidentRecord.class_session_id == session.id,
        IncidentRecord.status.in_([IncidentStatus.PENDING_FACULTY_REVIEW, IncidentStatus.ESCALATED_TO_HOD])
    )
    inc_res = await db.execute(inc_q)
    active_incidents = inc_res.scalars().all()

    # Camera status
    cam_q = select(Camera).where(Camera.room_number == session.room_number)
    cam_res = await db.execute(cam_q)
    camera = cam_res.scalar_one_or_none()

    return {
        "session_id": session.id,
        "subject_name": session.subject.name,
        "subject_code": session.subject.code,
        "section_name": session.section.name,
        "room_number": session.room_number,
        "faculty_name": session.faculty.user.full_name if session.faculty and session.faculty.user else "Faculty",
        "scheduled_timing": f"{session.scheduled_start.strftime('%I:%M %p')} - {session.scheduled_end.strftime('%I:%M %p')}",
        "actual_timing": session.actual_start.strftime("%I:%M %p") if session.actual_start else "Not started",
        "session_status": session.status.value,
        "mode": session.mode.value,
        "topic": session.topic,
        "attendance_summary": {
            "session_active": att is not None,
            "verification_challenge": att.verification_challenge if att else None,
            "present_count": present,
            "late_count": late,
            "absent_count": absent,
            "unverified_count": pending,
            "total_enrolled": len(records),
            "attendance_rate": round(((present + late) / len(records) * 100), 1) if records else 0.0
        },
        "activity_summary": {
            "total_events": len(events),
            "phone_events": sum(1 for e in events if e.event_type.value == "PHONE_USAGE"),
            "talking_events": sum(1 for e in events if e.event_type.value == "TALKING")
        },
        "camera_status": {
            "camera_name": camera.name if camera else f"CAM-{session.room_number}",
            "status": camera.status.value if camera else "ONLINE",
            "mode": camera.mode.value if camera else "SIMULATION",
            "health": camera.stream_health.value if camera else "HEALTHY",
            "fps": camera.fps if camera else 24.0
        },
        "active_alerts_count": len(active_incidents),
        "active_alerts": [
            {
                "id": inc.id,
                "type": inc.incident_type.value,
                "confidence": inc.confidence,
                "timestamp": inc.timestamp.isoformat(),
                "status": inc.status.value
            }
            for inc in active_incidents
        ],
        "timeline_logs": [
            {
                "id": log.id,
                "event_type": log.event_type,
                "description": log.description,
                "source": log.source,
                "timestamp": log.timestamp.strftime("%I:%M:%S %p")
            }
            for log in session.class_logs
        ]
    }


@router.get("/classes/{class_id}/logs", response_model=List[ClassLogOut])
async def get_class_logs(
    class_id: int,
    current_user: User = Depends(require_faculty),
    db: AsyncSession = Depends(get_db)
):
    q = select(ClassLog).where(ClassLog.class_session_id == class_id).order_by(ClassLog.timestamp)
    res = await db.execute(q)
    return res.scalars().all()
