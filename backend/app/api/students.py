from datetime import datetime, date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.academic import Student, Faculty, Subject, Section, Timetable, Enrollment
from app.models.session import ClassSession, SessionStatus
from app.models.attendance import AttendanceRecord, AttendanceSession, AttendanceStatus
from app.models.event import ActivityEvent, EventType
from app.core.dependencies import require_student
from app.schemas.academic import TimetableOut, ClassSessionOut
from app.schemas.attendance import SubjectAttendanceOut, AttendanceRecordOut, WhatIfRequest, WhatIfResponse
from app.schemas.event import ActivityEventOut, ActivityComparisonOut

router = APIRouter(prefix="/api/students", tags=["Student Portal"])


async def _get_student_for_user(user: User, db: AsyncSession) -> Student:
    query = select(Student).where(Student.user_id == user.id).options(
        selectinload(Student.department),
        selectinload(Student.section)
    )
    res = await db.execute(query)
    student = res.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student


@router.get("/dashboard")
async def get_student_dashboard(
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    student = await _get_student_for_user(current_user, db)

    # Calculate overall attendance
    rec_query = select(AttendanceRecord).where(AttendanceRecord.student_id == student.id)
    rec_res = await db.execute(rec_query)
    records = rec_res.scalars().all()

    total_classes = len(records)
    attended_classes = sum(1 for r in records if r.status in [AttendanceStatus.PRESENT, AttendanceStatus.LATE])
    overall_percentage = round((attended_classes / total_classes * 100), 1) if total_classes > 0 else 100.0

    # Next upcoming class
    now = datetime.utcnow()
    next_session_q = select(ClassSession).where(
        ClassSession.section_id == student.section_id,
        ClassSession.scheduled_start >= now - timedelta(hours=1)
    ).order_by(ClassSession.scheduled_start).limit(1).options(
        selectinload(ClassSession.subject),
        selectinload(ClassSession.faculty).selectinload(Faculty.user)  # faculty user
    )
    next_session_res = await db.execute(next_session_q)
    next_session = next_session_res.scalar_one_or_none()

    next_class_info = None
    if next_session:
        faculty_name = next_session.faculty.user.full_name if next_session.faculty and next_session.faculty.user else "Staff"
        next_class_info = {
            "id": next_session.id,
            "subject_name": next_session.subject.name,
            "subject_code": next_session.subject.code,
            "room_number": next_session.room_number,
            "scheduled_start": next_session.scheduled_start.isoformat(),
            "scheduled_end": next_session.scheduled_end.isoformat(),
            "status": next_session.status.value,
            "faculty_name": faculty_name
        }

    return {
        "student_id": student.id,
        "roll_number": student.roll_number,
        "full_name": current_user.full_name,
        "department_name": student.department.name if student.department else "",
        "section_name": student.section.name if student.section else "",
        "overall_attendance_pct": overall_percentage,
        "total_classes": total_classes,
        "attended_classes": attended_classes,
        "next_class": next_class_info,
        "status_summary": "Good Standing" if overall_percentage >= 75.0 else "Action Required (Low Attendance)"
    }


@router.get("/class-companion")
async def get_class_companion(
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    student = await _get_student_for_user(current_user, db)
    now = datetime.utcnow()

    # Look for active or closest upcoming/recent session for today
    q = select(ClassSession).where(
        ClassSession.section_id == student.section_id
    ).order_by(ClassSession.scheduled_start.desc()).limit(5).options(
        selectinload(ClassSession.subject),
        selectinload(ClassSession.faculty),
        selectinload(ClassSession.attendance_session)
    )
    res = await db.execute(q)
    sessions = res.scalars().all()

    # Find the session currently active or closest to now
    current_session = None
    for s in sessions:
        if s.status == SessionStatus.ACTIVE:
            current_session = s
            break
    if not current_session and sessions:
        current_session = sessions[0]

    if not current_session:
        return {"active": False, "message": "No active class sessions right now."}

    # Check attendance status of student in this session
    attendance_status = "NOT_TAKEN"
    has_session = current_session.attendance_session is not None
    if has_session:
        rec_q = select(AttendanceRecord).where(
            AttendanceRecord.attendance_session_id == current_session.attendance_session.id,
            AttendanceRecord.student_id == student.id
        )
        rec_res = await db.execute(rec_q)
        rec = rec_res.scalar_one_or_none()
        if rec:
            attendance_status = rec.status.value
        else:
            attendance_status = "PENDING_CHECKIN"

    return {
        "active": True,
        "session_id": current_session.id,
        "subject_name": current_session.subject.name,
        "subject_code": current_session.subject.code,
        "room_number": current_session.room_number,
        "scheduled_time": f"{current_session.scheduled_start.strftime('%I:%M %p')} - {current_session.scheduled_end.strftime('%I:%M %p')}",
        "actual_start": current_session.actual_start.isoformat() if current_session.actual_start else None,
        "session_status": current_session.status.value,
        "attendance_taken": has_session,
        "my_attendance_status": attendance_status,
        "topic": current_session.topic or "Standard Curriculum Session",
        "mode": current_session.mode.value
    }


@router.get("/attendance/subject-wise", response_model=List[SubjectAttendanceOut])
async def get_subject_wise_attendance(
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    student = await _get_student_for_user(current_user, db)

    # Get student enrolled subjects
    enr_q = select(Enrollment).where(Enrollment.student_id == student.id).options(
        selectinload(Enrollment.subject)
    )
    enr_res = await db.execute(enr_q)
    enrollments = enr_res.scalars().all()

    output = []
    for enr in enrollments:
        subj = enr.subject
        # Query attendance records for this student and subject
        rec_q = select(AttendanceRecord).join(ClassSession, AttendanceRecord.class_session_id == ClassSession.id).where(
            AttendanceRecord.student_id == student.id,
            ClassSession.subject_id == subj.id
        )
        rec_res = await db.execute(rec_q)
        records = rec_res.scalars().all()

        conducted = len(records)
        attended = sum(1 for r in records if r.status in [AttendanceStatus.PRESENT, AttendanceStatus.LATE])
        missed = conducted - attended
        pct = round((attended / conducted * 100), 1) if conducted > 0 else 100.0

        status_flag = "ON_TRACK" if pct >= 80.0 else ("AT_RISK" if pct >= 75.0 else "CRITICAL")

        output.append(SubjectAttendanceOut(
            subject_id=subj.id,
            subject_code=subj.code,
            subject_name=subj.name,
            faculty_name="Assigned Professor",
            credits=subj.credits,
            classes_conducted=conducted,
            classes_attended=attended,
            classes_missed=missed,
            attendance_percentage=pct,
            status=status_flag
        ))

    return output


@router.get("/attendance/history")
async def get_attendance_history(
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    student = await _get_student_for_user(current_user, db)

    q = select(AttendanceRecord).where(
        AttendanceRecord.student_id == student.id
    ).order_by(AttendanceRecord.marked_at.desc()).options(
        selectinload(AttendanceRecord.attendance_session).selectinload(AttendanceSession.class_session).selectinload(ClassSession.subject)
    )
    res = await db.execute(q)
    records = res.scalars().all()

    items = []
    for r in records:
        cs = r.attendance_session.class_session if r.attendance_session else None
        items.append({
            "id": r.id,
            "subject_name": cs.subject.name if cs and cs.subject else "Class Session",
            "subject_code": cs.subject.code if cs and cs.subject else "N/A",
            "room_number": cs.room_number if cs else "A-101",
            "status": r.status.value,
            "confidence_score": r.confidence_score,
            "verified_by_photo": r.verified_by_photo,
            "manual_override": r.manual_override,
            "override_reason": r.override_reason,
            "marked_at": r.marked_at.isoformat()
        })
    return items


@router.post("/attendance/what-if", response_model=WhatIfResponse)
async def simulate_what_if(
    req: WhatIfRequest,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    student = await _get_student_for_user(current_user, db)

    subj = await db.get(Subject, req.subject_id)
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")

    rec_q = select(AttendanceRecord).join(ClassSession, AttendanceRecord.class_session_id == ClassSession.id).where(
        AttendanceRecord.student_id == student.id,
        ClassSession.subject_id == subj.id
    )
    rec_res = await db.execute(rec_q)
    records = rec_res.scalars().all()

    curr_conducted = len(records)
    curr_attended = sum(1 for r in records if r.status in [AttendanceStatus.PRESENT, AttendanceStatus.LATE])
    curr_pct = round((curr_attended / curr_conducted * 100), 1) if curr_conducted > 0 else 100.0

    # Calculate simulation
    sim_conducted = curr_conducted + req.simulate_classes_present + req.simulate_classes_absent
    sim_attended = curr_attended + req.simulate_classes_present
    proj_pct = round((sim_attended / sim_conducted * 100), 1) if sim_conducted > 0 else 100.0
    delta = round(proj_pct - curr_pct, 1)

    note = "Simulation does not alter actual academic records. Safe projection."
    if proj_pct < 75.0:
        note += " Warning: Attendance drops below the mandatory 75% institutional threshold."

    return WhatIfResponse(
        subject_id=subj.id,
        subject_name=subj.name,
        current_conducted=curr_conducted,
        current_attended=curr_attended,
        current_percentage=curr_pct,
        simulated_conducted=sim_conducted,
        simulated_attended=sim_attended,
        projected_percentage=proj_pct,
        percentage_delta=delta,
        simulation_note=note
    )


@router.get("/activity")
async def get_my_activity(
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    """
    FR-05 Privacy Statement: 'Events only. No scores. No labels.'
    Does not produce behavioural grades or disciplinary conclusions.
    """
    student = await _get_student_for_user(current_user, db)

    q = select(ActivityEvent).where(
        ActivityEvent.student_id == student.id
    ).order_by(ActivityEvent.timestamp.desc()).limit(50)

    res = await db.execute(q)
    events = res.scalars().all()

    phone_count = sum(1 for e in events if e.event_type == EventType.PHONE_USAGE)
    talking_count = sum(1 for e in events if e.event_type == EventType.TALKING)

    return {
        "privacy_notice": "Events only. No scores. No labels.",
        "phone_events_count": phone_count,
        "talking_events_count": talking_count,
        "total_recorded_events": len(events),
        "events": [
            {
                "id": e.id,
                "event_type": e.event_type.value,
                "confidence": e.confidence,
                "timestamp": e.timestamp.isoformat(),
                "model_version": e.model_version,
                "review_status": e.review_status.value,
                "is_simulated": bool(e.is_simulated)
            }
            for e in events
        ]
    }


@router.get("/activity/comparison", response_model=ActivityComparisonOut)
async def get_my_activity_comparison(
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    student = await _get_student_for_user(current_user, db)

    now = datetime.utcnow()
    last_week_start = now - timedelta(days=14)
    this_week_start = now - timedelta(days=7)

    q = select(ActivityEvent).where(
        ActivityEvent.student_id == student.id,
        ActivityEvent.timestamp >= last_week_start
    )
    res = await db.execute(q)
    events = res.scalars().all()

    prev_phone = sum(1 for e in events if e.timestamp < this_week_start and e.event_type == EventType.PHONE_USAGE)
    curr_phone = sum(1 for e in events if e.timestamp >= this_week_start and e.event_type == EventType.PHONE_USAGE)

    prev_talking = sum(1 for e in events if e.timestamp < this_week_start and e.event_type == EventType.TALKING)
    curr_talking = sum(1 for e in events if e.timestamp >= this_week_start and e.event_type == EventType.TALKING)

    phone_delta_pct = round(((curr_phone - prev_phone) / max(prev_phone, 1) * 100), 1)
    talking_delta_pct = round(((curr_talking - prev_talking) / max(prev_talking, 1) * 100), 1)

    total_curr = curr_phone + curr_talking
    total_prev = prev_phone + prev_talking
    total_delta_pct = round(((total_curr - total_prev) / max(total_prev, 1) * 100), 1)

    return ActivityComparisonOut(
        period_label="This Week vs Last Week",
        current_phone_events=curr_phone,
        previous_phone_events=prev_phone,
        phone_pct_change=phone_delta_pct,
        current_talking_events=curr_talking,
        previous_talking_events=prev_talking,
        talking_pct_change=talking_delta_pct,
        total_current=total_curr,
        total_previous=total_prev,
        total_pct_change=total_delta_pct,
        is_simulated=True
    )
