from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.academic import Student
from app.models.session import ClassSession
from app.models.event import ActivityEvent, EventType, EventReviewStatus
from app.core.dependencies import get_current_user, require_faculty
from app.schemas.event import ActivityEventOut, StudentActivitySummaryOut, ActivityComparisonOut

router = APIRouter(prefix="/api/events", tags=["Class Intelligence & Activity"])


@router.get("/classroom/{class_session_id}", response_model=List[ActivityEventOut])
async def get_classroom_activity_events(
    class_session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(ActivityEvent).where(
        ActivityEvent.class_session_id == class_session_id
    ).order_by(ActivityEvent.timestamp.desc()).options(
        selectinload(ActivityEvent.student).selectinload(Student.user)
    )
    result = await db.execute(query)
    events = result.scalars().all()

    items = []
    for e in events:
        items.append(ActivityEventOut(
            id=e.id,
            class_session_id=e.class_session_id,
            student_id=e.student_id,
            student_name=e.student.user.full_name if e.student and e.student.user else None,
            roll_number=e.student.roll_number if e.student else None,
            event_type=e.event_type.value,
            confidence=e.confidence,
            timestamp=e.timestamp,
            model_version=e.model_version,
            review_status=e.review_status.value,
            is_simulated=e.is_simulated
        ))
    return items


@router.get("/individual/{class_session_id}", response_model=List[StudentActivitySummaryOut])
async def get_individual_activity_summary(
    class_session_id: int,
    current_user: User = Depends(require_faculty),
    db: AsyncSession = Depends(get_db)
):
    """
    PRD FR-05: Individual Activity Table
    Displays: Student ID/Name, Phone event count, Talking event count, Total recorded events, Review status.
    Privacy statement: 'Events only. No scores. No labels.'
    """
    cs = await db.get(ClassSession, class_session_id)
    if not cs:
        raise HTTPException(status_code=404, detail="Class session not found")

    # Fetch students in section
    st_q = select(Student).where(Student.section_id == cs.section_id).options(
        selectinload(Student.user)
    )
    st_res = await db.execute(st_q)
    students = st_res.scalars().all()

    # Fetch all activity events for this class session
    ev_q = select(ActivityEvent).where(ActivityEvent.class_session_id == class_session_id)
    ev_res = await db.execute(ev_q)
    all_events = ev_res.scalars().all()

    summary_list = []
    for s in students:
        s_events = [e for e in all_events if e.student_id == s.id]
        phone_count = sum(1 for e in s_events if e.event_type == EventType.PHONE_USAGE)
        talking_count = sum(1 for e in s_events if e.event_type == EventType.TALKING)
        last_time = max([e.timestamp for e in s_events]) if s_events else None

        has_unreviewed = any(e.review_status == EventReviewStatus.UNREVIEWED for e in s_events)
        status_label = "Pending Review" if has_unreviewed else "Reviewed"

        summary_list.append(StudentActivitySummaryOut(
            student_id=s.id,
            student_name=s.user.full_name if s.user else "Student",
            roll_number=s.roll_number,
            phone_event_count=phone_count,
            talking_event_count=talking_count,
            total_recorded_events=len(s_events),
            last_event_time=last_time,
            review_status=status_label
        ))

    return summary_list


@router.get("/comparison", response_model=ActivityComparisonOut)
async def get_overall_activity_comparison(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    PRD FR-06: Activity Comparison across periods
    Derives from recorded data with clearly marked simulation indicator.
    """
    now = datetime.utcnow()
    last_week_start = now - timedelta(days=14)
    this_week_start = now - timedelta(days=7)

    q = select(ActivityEvent).where(ActivityEvent.timestamp >= last_week_start)
    res = await db.execute(q)
    events = res.scalars().all()

    prev_phone = sum(1 for e in events if e.timestamp < this_week_start and e.event_type == EventType.PHONE_USAGE)
    curr_phone = sum(1 for e in events if e.timestamp >= this_week_start and e.event_type == EventType.PHONE_USAGE)

    prev_talking = sum(1 for e in events if e.timestamp < this_week_start and e.event_type == EventType.TALKING)
    curr_talking = sum(1 for e in events if e.timestamp >= this_week_start and e.event_type == EventType.TALKING)

    phone_delta = round(((curr_phone - prev_phone) / max(prev_phone, 1) * 100), 1)
    talking_delta = round(((curr_talking - prev_talking) / max(prev_talking, 1) * 100), 1)

    total_curr = curr_phone + curr_talking
    total_prev = prev_phone + prev_talking
    total_delta = round(((total_curr - total_prev) / max(total_prev, 1) * 100), 1)

    return ActivityComparisonOut(
        period_label="This Week vs Last Week",
        current_phone_events=curr_phone,
        previous_phone_events=prev_phone,
        phone_pct_change=phone_delta,
        current_talking_events=curr_talking,
        previous_talking_events=prev_talking,
        talking_pct_change=talking_delta,
        total_current=total_curr,
        total_previous=total_prev,
        total_pct_change=total_delta,
        is_simulated=True
    )
