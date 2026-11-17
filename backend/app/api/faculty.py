from datetime import datetime, date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from pydantic import BaseModel, Field
from app.database import get_db
from app.models.user import User, AuditLog
from app.models.academic import Faculty, Subject, Section, Timetable, Student, Enrollment, FacultyAssignment, Room
from app.models.session import ClassSession, ClassLog, SessionStatus, OperatingMode
from app.models.attendance import AttendanceSession, AttendanceRecord, AttendanceStatus
from app.models.event import ActivityEvent, IncidentRecord, IncidentStatus
from app.models.camera import Camera
from app.core.dependencies import require_faculty
from app.schemas.academic import ClassSessionOut, ClassLogOut

router = APIRouter(prefix="/api/faculty", tags=["Faculty Portal"])


class StartSessionRequest(BaseModel):
    subject_id: int
    section_id: int
    room_number: str
    session_id: Optional[int] = None
    topic: Optional[str] = "Classroom Lecture"


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


@router.get("/authorized-classes")
async def get_faculty_authorized_classes(
    current_user: User = Depends(require_faculty),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns authorized assignments, scheduled class sessions, and rooms for the logged-in faculty.
    Ensures faculty only select authorized curriculum combinations.
    """
    faculty = await _get_faculty_for_user(current_user, db)

    # 1. Fetch authorized curriculum assignments
    assign_q = select(FacultyAssignment).where(
        FacultyAssignment.faculty_id == faculty.id
    ).options(
        selectinload(FacultyAssignment.subject),
        selectinload(FacultyAssignment.section)
    )
    assign_res = await db.execute(assign_q)
    assignments = assign_res.scalars().all()

    # 2. Fetch today's scheduled class sessions for this faculty
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    sess_q = select(ClassSession).where(
        ClassSession.faculty_id == faculty.id,
        ClassSession.scheduled_start >= today_start,
        ClassSession.scheduled_start < today_end
    ).order_by(ClassSession.scheduled_start).options(
        selectinload(ClassSession.subject),
        selectinload(ClassSession.section)
    )
    sess_res = await db.execute(sess_q)
    scheduled_sessions = sess_res.scalars().all()

    # 3. Available rooms
    room_res = await db.execute(select(Room).where(Room.is_active == True).order_by(Room.room_number))
    rooms = room_res.scalars().all()

    return {
        "faculty_id": faculty.id,
        "faculty_name": current_user.full_name,
        "authorized_assignments": [
            {
                "assignment_id": a.id,
                "subject_id": a.subject_id,
                "subject_code": a.subject.code if a.subject else "",
                "subject_name": a.subject.name if a.subject else "",
                "section_id": a.section_id,
                "section_name": a.section.name if a.section else "",
                "academic_term": a.academic_term
            }
            for a in assignments
        ],
        "scheduled_sessions": [
            {
                "session_id": s.id,
                "subject_id": s.subject_id,
                "subject_code": s.subject.code if s.subject else "",
                "subject_name": s.subject.name if s.subject else "",
                "section_id": s.section_id,
                "section_name": s.section.name if s.section else "",
                "room_number": s.room_number,
                "scheduled_start": s.scheduled_start.strftime("%I:%M %p"),
                "scheduled_end": s.scheduled_end.strftime("%I:%M %p"),
                "status": s.status.value,
                "topic": s.topic
            }
            for s in scheduled_sessions
        ],
        "authorized_rooms": [
            {"id": r.id, "room_number": r.room_number, "building": r.building}
            for r in rooms
        ]
    }


@router.post("/classes/start-session")
async def start_class_session(
    req: StartSessionRequest,
    current_user: User = Depends(require_faculty),
    db: AsyncSession = Depends(get_db)
):
    """
    Starts an authorized live class session.
    Backend validates faculty credentials and assignment authorization.
    Transitions session to ACTIVE and writes class log.
    """
    faculty = await _get_faculty_for_user(current_user, db)

    # Validate that faculty is authorized for this subject and section
    assign_q = select(FacultyAssignment).where(
        FacultyAssignment.faculty_id == faculty.id,
        FacultyAssignment.subject_id == req.subject_id,
        FacultyAssignment.section_id == req.section_id
    )
    assign_res = await db.execute(assign_q)
    if not assign_res.scalar_one_or_none():
        # Check if also in Timetable
        tt_q = select(Timetable).where(
            Timetable.faculty_id == faculty.id,
            Timetable.subject_id == req.subject_id,
            Timetable.section_id == req.section_id
        )
        tt_res = await db.execute(tt_q)
        if not tt_res.scalar_one_or_none():
            raise HTTPException(
                status_code=403,
                detail=f"Unauthorized: You are not assigned to teach Subject ID {req.subject_id} for Section ID {req.section_id}."
            )

    now = datetime.utcnow()
    target_session = None

    if req.session_id:
        target_session = await db.get(ClassSession, req.session_id)
        if not target_session or target_session.faculty_id != faculty.id:
            raise HTTPException(status_code=404, detail="Scheduled class session not found or unauthorized.")

    if not target_session:
        # Check if an existing SCHEDULED session exists today for this slot
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        existing_q = select(ClassSession).where(
            ClassSession.faculty_id == faculty.id,
            ClassSession.subject_id == req.subject_id,
            ClassSession.section_id == req.section_id,
            ClassSession.scheduled_start >= today_start,
            ClassSession.scheduled_start < today_end,
            ClassSession.status.in_([SessionStatus.SCHEDULED, SessionStatus.ACTIVE])
        )
        existing_res = await db.execute(existing_q)
        target_session = existing_res.scalar_one_or_none()

    if target_session:
        target_session.status = SessionStatus.ACTIVE
        target_session.actual_start = now
        target_session.room_number = req.room_number
        if req.topic:
            target_session.topic = req.topic
    else:
        # Create authorized session for this class
        target_session = ClassSession(
            subject_id=req.subject_id,
            section_id=req.section_id,
            faculty_id=faculty.id,
            room_number=req.room_number,
            scheduled_start=now,
            scheduled_end=now + timedelta(hours=1),
            actual_start=now,
            status=SessionStatus.ACTIVE,
            mode=OperatingMode.SIMULATION,
            topic=req.topic or "Interactive Class Session"
        )
        db.add(target_session)
        await db.flush()

    # Log class start
    log = ClassLog(
        class_session_id=target_session.id,
        event_type="CLASS_STARTED",
        description=f"Faculty {current_user.full_name} initiated live class session in {req.room_number}.",
        source="FACULTY",
        timestamp=now
    )
    db.add(log)

    audit = AuditLog(
        user_id=current_user.id,
        action="CLASS_SESSION_STARTED",
        resource=f"ClassSession:{target_session.id}",
        details=f"Faculty started class for Subject {req.subject_id} in {req.room_number}"
    )
    db.add(audit)
    await db.commit()

    return {
        "session_id": target_session.id,
        "status": "ACTIVE",
        "subject_id": target_session.subject_id,
        "section_id": target_session.section_id,
        "room_number": target_session.room_number,
        "started_at": target_session.actual_start.isoformat(),
        "topic": target_session.topic,
        "message": "Class session is now ACTIVE. You can now verify attendance and monitor the classroom feed."
    }


@router.post("/classes/{session_id}/end")
async def end_class_session(
    session_id: int,
    current_user: User = Depends(require_faculty),
    db: AsyncSession = Depends(get_db)
):
    faculty = await _get_faculty_for_user(current_user, db)
    session = await db.get(ClassSession, session_id)
    if not session or session.faculty_id != faculty.id:
        raise HTTPException(status_code=404, detail="Class session not found or unauthorized.")

    now = datetime.utcnow()
    session.status = SessionStatus.COMPLETED
    session.actual_end = now

    log = ClassLog(
        class_session_id=session.id,
        event_type="CLASS_ENDED",
        description=f"Faculty {current_user.full_name} concluded class session.",
        source="FACULTY",
        timestamp=now
    )
    db.add(log)

    audit = AuditLog(
        user_id=current_user.id,
        action="CLASS_SESSION_ENDED",
        resource=f"ClassSession:{session.id}",
        details=f"Class session concluded at {now.isoformat()}"
    )
    db.add(audit)
    await db.commit()

    return {
        "session_id": session.id,
        "status": "COMPLETED",
        "concluded_at": session.actual_end.isoformat(),
        "message": "Class session has been concluded."
    }

