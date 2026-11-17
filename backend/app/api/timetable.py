from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, Field

from app.database import get_db
from app.models.user import User
from app.models.academic import Department, Subject, Section, Faculty, Room, Timetable, TimetableSet
from app.core.dependencies import require_hod, get_current_user
from app.services.timetable_service import (
    parse_timetable_csv,
    parse_timetable_xlsx,
    get_mapping_catalogs,
    compute_auto_mappings,
    validate_timetable_entries,
    publish_validated_timetable
)

router = APIRouter(prefix="/api/timetable", tags=["Timetable Management"])


class ValidateTimetableRequest(BaseModel):
    department_id: int
    section_id: int
    academic_year: str
    semester: int
    raw_entries: List[Dict[str, Any]]
    mappings: Dict[str, Any]


class PublishTimetableRequest(BaseModel):
    department_id: int
    section_id: int
    academic_year: str
    semester: int
    entries: List[Dict[str, Any]]
    notes: Optional[str] = None


@router.get("/catalogs")
async def get_catalogs(
    department_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves authoritative catalogs (departments, sections, subjects, faculty, rooms)."""
    return await get_mapping_catalogs(db, department_id)


@router.get("/template")
async def get_timetable_template():
    """Provides standard institutional CSV template for timetable upload."""
    sample_csv = (
        "academic_year,semester,department,section,day,start_time,end_time,subject,faculty,room\n"
        "2026-2027,6,CSE,Section A,Monday,09:30,10:30,CS301,Dr. Ramesh Kulkarni,Hall A-101\n"
        "2026-2027,6,CSE,Section A,Monday,11:00,12:00,CS302,Dr. Ramesh Kulkarni,Hall A-101\n"
        "2026-2027,6,CSE,Section A,Tuesday,09:30,10:30,CS303,Prof. Dr. Arvind Swaminathan,Hall A-101\n"
        "2026-2027,6,CSE,Section A,Wednesday,14:00,16:00,CS301,Dr. Ramesh Kulkarni,Lab B-204\n"
        "2026-2027,6,CSE,Section A,Thursday,10:00,11:00,CS304,Dr. Ramesh Kulkarni,Hall C-305\n"
        "2026-2027,6,CSE,Section A,Friday,11:30,12:30,CS302,Dr. Ramesh Kulkarni,Hall A-101\n"
    )
    return {
        "template_csv": sample_csv,
        "filename": "ClassSphere_Timetable_Template.csv",
        "description": "Standard institutional timetable schema with 10 required/optional columns."
    }


@router.post("/parse")
async def parse_timetable_file(
    file: Optional[UploadFile] = File(None),
    csv_text: Optional[str] = Form(None),
    department_id: Optional[int] = Form(None),
    current_user: User = Depends(require_hod),
    db: AsyncSession = Depends(get_db)
):
    """
    Parses an uploaded CSV or XLSX timetable file and suggests entity mappings.
    """
    entries = []
    if file:
        filename = file.filename.lower() if file.filename else ""
        content = await file.read()
        if filename.endswith(".xlsx") or filename.endswith(".xls"):
            try:
                entries = parse_timetable_xlsx(content)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to parse Excel file: {str(e)}")
        else:
            try:
                text = content.decode("utf-8-sig")
                entries = parse_timetable_csv(text)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")
    elif csv_text:
        try:
            entries = parse_timetable_csv(csv_text)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse CSV content: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Either a file upload or csv_text must be provided.")

    if not entries:
        raise HTTPException(status_code=400, detail="No valid timetable rows found in the provided file.")

    catalogs = await get_mapping_catalogs(db, department_id)
    suggested_mappings = compute_auto_mappings(entries, catalogs)

    return {
        "total_parsed_rows": len(entries),
        "raw_entries": entries,
        "suggested_mappings": suggested_mappings,
        "catalogs": catalogs
    }


@router.post("/validate")
async def validate_timetable(
    req: ValidateTimetableRequest,
    current_user: User = Depends(require_hod),
    db: AsyncSession = Depends(get_db)
):
    """
    Validates proposed timetable data, checking for all conflict types:
    - Faculty overlap
    - Section overlap
    - Room overlap
    - Invalid time ranges
    - Unknown/unmapped subjects, faculty, or rooms
    - External conflicts with existing published timetables
    """
    result = await validate_timetable_entries(
        db=db,
        department_id=req.department_id,
        section_id=req.section_id,
        academic_year=req.academic_year,
        semester=req.semester,
        raw_entries=req.raw_entries,
        mappings=req.mappings
    )
    return result


@router.post("/publish")
async def publish_timetable(
    req: PublishTimetableRequest,
    current_user: User = Depends(require_hod),
    db: AsyncSession = Depends(get_db)
):
    """
    Publishes an approved timetable version:
    - Deactivates previous timetables
    - Increments timetable version number
    - Generates upcoming ClassSession instances
    - Updates audit log
    """
    if not req.entries:
        raise HTTPException(status_code=400, detail="Cannot publish an empty timetable.")

    for idx, e in enumerate(req.entries):
        if not e.get("subject_id") or not e.get("faculty_id") or not e.get("room_number") or e.get("day_of_week") is None:
            raise HTTPException(
                status_code=400,
                detail=f"Entry at index {idx} has unmapped fields or invalid day_of_week. Please resolve all mappings before publishing."
            )

    result = await publish_validated_timetable(
        db=db,
        department_id=req.department_id,
        section_id=req.section_id,
        academic_year=req.academic_year,
        semester=req.semester,
        entries=req.entries,
        user_id=current_user.id,
        notes=req.notes
    )
    return result


@router.get("/section/{section_id}")
async def get_section_timetable(
    section_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetches the published active timetable for a section and version history."""
    # Active timetable set
    set_q = select(TimetableSet).where(
        TimetableSet.section_id == section_id,
        TimetableSet.status == "PUBLISHED"
    ).order_by(TimetableSet.version_number.desc())
    set_res = await db.execute(set_q)
    active_set = set_res.scalar_one_or_none()

    # Timetable periods
    periods_q = select(Timetable).where(
        Timetable.section_id == section_id,
        Timetable.is_active == True
    ).order_by(Timetable.day_of_week, Timetable.start_time).options(
        selectinload(Timetable.subject),
        selectinload(Timetable.faculty).selectinload(Faculty.user)
    )
    periods_res = await db.execute(periods_q)
    periods = periods_res.scalars().all()

    # All version history
    hist_q = select(TimetableSet).where(
        TimetableSet.section_id == section_id
    ).order_by(TimetableSet.version_number.desc()).options(selectinload(TimetableSet.created_by))
    hist_res = await db.execute(hist_q)
    history = hist_res.scalars().all()

    return {
        "section_id": section_id,
        "active_version": active_set.version_number if active_set else 1,
        "published_at": active_set.published_at.isoformat() if active_set and active_set.published_at else None,
        "notes": active_set.notes if active_set else "Standard Section Timetable",
        "periods": [
            {
                "id": p.id,
                "day_of_week": p.day_of_week,
                "start_time": p.start_time.strftime("%H:%M"),
                "end_time": p.end_time.strftime("%H:%M"),
                "subject_code": p.subject.code if p.subject else "",
                "subject_name": p.subject.name if p.subject else "",
                "faculty_name": p.faculty.user.full_name if p.faculty and p.faculty.user else "Faculty",
                "room_number": p.room_number,
            }
            for p in periods
        ],
        "version_history": [
            {
                "id": h.id,
                "version_number": h.version_number,
                "status": h.status,
                "academic_year": h.academic_year,
                "semester": h.semester,
                "published_at": h.published_at.isoformat() if h.published_at else None,
                "created_by": h.created_by.full_name if h.created_by else "System",
                "notes": h.notes
            }
            for h in history
        ]
    }


@router.get("/faculty/{faculty_id}")
async def get_faculty_schedule_timetable(
    faculty_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetches the weekly teaching schedule for a faculty member derived from published timetables."""
    periods_q = select(Timetable).where(
        Timetable.faculty_id == faculty_id,
        Timetable.is_active == True
    ).order_by(Timetable.day_of_week, Timetable.start_time).options(
        selectinload(Timetable.subject),
        selectinload(Timetable.section)
    )
    periods_res = await db.execute(periods_q)
    periods = periods_res.scalars().all()

    return [
        {
            "id": p.id,
            "day_of_week": p.day_of_week,
            "start_time": p.start_time.strftime("%H:%M"),
            "end_time": p.end_time.strftime("%H:%M"),
            "subject_code": p.subject.code if p.subject else "",
            "subject_name": p.subject.name if p.subject else "",
            "section_name": p.section.name if p.section else "",
            "room_number": p.room_number,
        }
        for p in periods
    ]
