import csv
import io
import re
from datetime import datetime, date, time, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.academic import (
    Department, Subject, Section, Faculty, Room,
    Timetable, TimetableSet, FacultyAssignment, Student, Enrollment
)
from app.models.user import User, AuditLog
from app.models.session import ClassSession, SessionStatus, OperatingMode

DAYS_MAP = {
    "monday": 0, "mon": 0, "0": 0,
    "tuesday": 1, "tue": 1, "tues": 1, "1": 1,
    "wednesday": 2, "wed": 2, "2": 2,
    "thursday": 3, "thu": 3, "thur": 3, "thurs": 3, "3": 3,
    "friday": 4, "fri": 4, "4": 4,
    "saturday": 5, "sat": 5, "5": 5,
    "sunday": 6, "sun": 6, "6": 6,
}

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def parse_time_str(val: str) -> time:
    """Parses various time representations into datetime.time."""
    cleaned = str(val).strip().upper()
    for fmt in ("%H:%M", "%H:%M:%S", "%I:%M %p", "%I:%M%p", "%I %p"):
        try:
            return datetime.strptime(cleaned, fmt).time()
        except ValueError:
            pass
    match = re.match(r"^(\d{1,2}):(\d{2})$", cleaned)
    if match:
        h, m = int(match.group(1)), int(match.group(2))
        return time(h, m)
    raise ValueError(f"Invalid time format: '{val}'. Expected HH:MM or HH:MM AM/PM")


def parse_day_str(val: str) -> int:
    """Parses a day string into an integer 0..6 (Monday = 0)."""
    cleaned = str(val).strip().lower()
    if cleaned in DAYS_MAP:
        return DAYS_MAP[cleaned]
    raise ValueError(f"Invalid day representation: '{val}'. Expected Monday..Sunday or Mon..Sun")


def parse_timetable_csv(csv_text: str) -> List[Dict[str, Any]]:
    """
    Parses CSV text into a structured list of raw timetable entries.
    Expected headers:
    academic_year, semester, department, section, day, start_time, end_time, subject, faculty, room
    """
    f = io.StringIO(csv_text.strip())
    reader = csv.DictReader(f)
    if not reader.fieldnames:
        raise ValueError("CSV file is empty or missing headers.")

    # Normalize header names (lowercase, stripped, replace spaces/dashes with underscores)
    normalized_headers = {h: re.sub(r"[\s\-]+", "_", h.strip().lower()) for h in reader.fieldnames if h}

    required_canonical = ["day", "start_time", "end_time", "subject", "faculty", "room"]
    parsed_entries = []

    for idx, row in enumerate(reader, start=2):
        normalized_row = {normalized_headers.get(k, k): (v.strip() if v else "") for k, v in row.items() if k}
        # Ignore empty lines
        if not any(normalized_row.values()):
            continue

        # Extract values with fallbacks
        day_raw = normalized_row.get("day", "")
        start_raw = normalized_row.get("start_time", normalized_row.get("start", ""))
        end_raw = normalized_row.get("end_time", normalized_row.get("end", ""))
        subject_raw = normalized_row.get("subject", normalized_row.get("subject_code", normalized_row.get("course", "")))
        faculty_raw = normalized_row.get("faculty", normalized_row.get("faculty_name", normalized_row.get("faculty_id", "")))
        room_raw = normalized_row.get("room", normalized_row.get("room_number", normalized_row.get("classroom", "")))
        acad_year = normalized_row.get("academic_year", normalized_row.get("year", ""))
        semester_raw = normalized_row.get("semester", normalized_row.get("sem", ""))
        dept_raw = normalized_row.get("department", normalized_row.get("dept", ""))
        section_raw = normalized_row.get("section", normalized_row.get("sec", ""))

        parsed_entries.append({
            "row_number": idx,
            "academic_year": acad_year,
            "semester": semester_raw,
            "department": dept_raw,
            "section": section_raw,
            "day_raw": day_raw,
            "start_time_raw": start_raw,
            "end_time_raw": end_raw,
            "subject_raw": subject_raw,
            "faculty_raw": faculty_raw,
            "room_raw": room_raw,
        })

    return parsed_entries


def parse_timetable_xlsx(file_bytes: bytes) -> List[Dict[str, Any]]:
    """Parses Excel XLSX timetable data into structured rows."""
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
    sheet = wb.active
    rows = list(sheet.iter_rows(values_only=True))
    if not rows or len(rows) < 2:
        raise ValueError("Excel file is empty or missing headers.")

    raw_headers = [str(c or "").strip() for c in rows[0]]
    normalized_headers = [re.sub(r"[\s\-]+", "_", h.lower()) for h in raw_headers]

    parsed_entries = []
    for idx, r in enumerate(rows[1:], start=2):
        if not any(r):
            continue
        row_dict = {}
        for col_idx, header in enumerate(normalized_headers):
            if col_idx < len(r):
                val = r[col_idx]
                if isinstance(val, (datetime, time)):
                    row_dict[header] = val.strftime("%H:%M")
                else:
                    row_dict[header] = str(val or "").strip()

        day_raw = row_dict.get("day", "")
        start_raw = row_dict.get("start_time", row_dict.get("start", ""))
        end_raw = row_dict.get("end_time", row_dict.get("end", ""))
        subject_raw = row_dict.get("subject", row_dict.get("subject_code", row_dict.get("course", "")))
        faculty_raw = row_dict.get("faculty", row_dict.get("faculty_name", row_dict.get("faculty_id", "")))
        room_raw = row_dict.get("room", row_dict.get("room_number", row_dict.get("classroom", "")))

        parsed_entries.append({
            "row_number": idx,
            "academic_year": row_dict.get("academic_year", ""),
            "semester": row_dict.get("semester", ""),
            "department": row_dict.get("department", ""),
            "section": row_dict.get("section", ""),
            "day_raw": day_raw,
            "start_time_raw": start_raw,
            "end_time_raw": end_raw,
            "subject_raw": subject_raw,
            "faculty_raw": faculty_raw,
            "room_raw": room_raw,
        })

    return parsed_entries


async def get_mapping_catalogs(db: AsyncSession, department_id: Optional[int] = None) -> Dict[str, Any]:
    """Retrieves authoritative database catalogs for mapping subjects, faculty, and rooms."""
    # Departments
    dept_res = await db.execute(select(Department).order_by(Department.name))
    departments = dept_res.scalars().all()

    # Subjects
    sub_q = select(Subject)
    if department_id:
        sub_q = sub_q.where(Subject.department_id == department_id)
    sub_res = await db.execute(sub_q.order_by(Subject.code))
    subjects = sub_res.scalars().all()

    # Faculty
    fac_q = select(Faculty).options(selectinload(Faculty.user))
    if department_id:
        fac_q = fac_q.where(Faculty.department_id == department_id)
    fac_res = await db.execute(fac_q)
    faculty_list = fac_res.scalars().all()

    # Rooms
    room_res = await db.execute(select(Room).where(Room.is_active == True).order_by(Room.room_number))
    rooms = room_res.scalars().all()

    # Sections
    sec_q = select(Section)
    if department_id:
        sec_q = sec_q.where(Section.department_id == department_id)
    sec_res = await db.execute(sec_q.order_by(Section.name))
    sections = sec_res.scalars().all()

    return {
        "departments": [{"id": d.id, "code": d.code, "name": d.name} for d in departments],
        "sections": [{"id": s.id, "name": s.name, "academic_year": s.academic_year, "semester": s.semester, "department_id": s.department_id} for s in sections],
        "subjects": [{"id": s.id, "code": s.code, "name": s.name, "credits": s.credits} for s in subjects],
        "faculty": [
            {
                "id": f.id,
                "employee_id": f.employee_id,
                "name": f.user.full_name if f.user else "Unknown",
                "email": f.user.email if f.user else "",
                "designation": f.designation
            }
            for f in faculty_list
        ],
        "rooms": [{"id": r.id, "room_number": r.room_number, "building": r.building, "capacity": r.capacity, "room_type": r.room_type} for r in rooms],
    }


def compute_auto_mappings(raw_entries: List[Dict[str, Any]], catalogs: Dict[str, Any]) -> Dict[str, Any]:
    """Generates suggested mappings for subjects, faculty, and rooms based on exact or fuzzy matches."""
    subjects_cat = catalogs["subjects"]
    faculty_cat = catalogs["faculty"]
    rooms_cat = catalogs["rooms"]

    subject_mappings = {}
    faculty_mappings = {}
    room_mappings = {}

    for row in raw_entries:
        s_raw = row["subject_raw"].strip()
        f_raw = row["faculty_raw"].strip()
        r_raw = row["room_raw"].strip()

        # Subject resolution
        if s_raw and s_raw not in subject_mappings:
            matched_sub = next(
                (s["id"] for s in subjects_cat if s["code"].lower() == s_raw.lower() or s["name"].lower() == s_raw.lower()),
                None
            )
            subject_mappings[s_raw] = matched_sub

        # Faculty resolution
        if f_raw and f_raw not in faculty_mappings:
            matched_fac = next(
                (
                    f["id"] for f in faculty_cat
                    if f["employee_id"].lower() == f_raw.lower()
                    or f["name"].lower() == f_raw.lower()
                    or f["email"].lower() == f_raw.lower()
                    or f_raw.lower() in f["name"].lower()
                ),
                None
            )
            faculty_mappings[f_raw] = matched_fac

        # Room resolution
        if r_raw and r_raw not in room_mappings:
            matched_room = next(
                (r["room_number"] for r in rooms_cat if r["room_number"].lower() == r_raw.lower() or r_raw.lower() in r["room_number"].lower()),
                None
            )
            room_mappings[r_raw] = matched_room

    return {
        "subject_mappings": subject_mappings,
        "faculty_mappings": faculty_mappings,
        "room_mappings": room_mappings,
    }


def _time_overlap(s1: time, e1: time, s2: time, e2: time) -> bool:
    """Checks if two time intervals [s1, e1) and [s2, e2) overlap."""
    return max(s1, s2) < min(e1, e2)


async def validate_timetable_entries(
    db: AsyncSession,
    department_id: int,
    section_id: int,
    academic_year: str,
    semester: int,
    raw_entries: List[Dict[str, Any]],
    mappings: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Validates timetable entries against institutional constraints:
    - Faculty overlap (same faculty teaching multiple classes simultaneously)
    - Section overlap (same section scheduled for multiple classes simultaneously)
    - Room overlap (same room occupied by multiple classes simultaneously)
    - Invalid time ranges (start >= end, outside institutional hours)
    - Unknown/unmapped subjects
    - Unknown/unmapped faculty
    - Unknown/unmapped rooms
    - External conflicts against other active timetables
    """
    subject_map = mappings.get("subject_mappings", {})
    faculty_map = mappings.get("faculty_mappings", {})
    room_map = mappings.get("room_mappings", {})

    catalogs = await get_mapping_catalogs(db, department_id)
    sub_dict = {s["id"]: s for s in catalogs["subjects"]}
    fac_dict = {f["id"]: f for f in catalogs["faculty"]}
    room_dict = {r["room_number"]: r for r in catalogs["rooms"]}

    conflicts: List[Dict[str, Any]] = []
    validated_rows: List[Dict[str, Any]] = []

    for entry in raw_entries:
        row_num = entry["row_number"]
        s_raw = entry["subject_raw"].strip()
        f_raw = entry["faculty_raw"].strip()
        r_raw = entry["room_raw"].strip()
        day_raw = entry["day_raw"].strip()
        start_raw = entry["start_time_raw"].strip()
        end_raw = entry["end_time_raw"].strip()

        # 1. Parse Day
        try:
            day_of_week = parse_day_str(day_raw)
        except Exception as e:
            conflicts.append({
                "type": "INVALID_DAY",
                "severity": "ERROR",
                "row_number": row_num,
                "message": f"Row {row_num}: {str(e)}",
            })
            day_of_week = None

        # 2. Parse Times
        start_t = None
        end_t = None
        try:
            start_t = parse_time_str(start_raw)
        except Exception as e:
            conflicts.append({
                "type": "INVALID_TIME_FORMAT",
                "severity": "ERROR",
                "row_number": row_num,
                "message": f"Row {row_num}: Invalid start time '{start_raw}'.",
            })

        try:
            end_t = parse_time_str(end_raw)
        except Exception as e:
            conflicts.append({
                "type": "INVALID_TIME_FORMAT",
                "severity": "ERROR",
                "row_number": row_num,
                "message": f"Row {row_num}: Invalid end time '{end_raw}'.",
            })

        if start_t and end_t:
            if start_t >= end_t:
                conflicts.append({
                    "type": "INVALID_TIME_RANGE",
                    "severity": "ERROR",
                    "row_number": row_num,
                    "message": f"Row {row_num}: Start time ({start_t.strftime('%H:%M')}) cannot be after or equal to end time ({end_t.strftime('%H:%M')}).",
                })
            # Institutional hours check (08:00 to 19:00)
            if start_t < time(8, 0) or end_t > time(19, 0):
                conflicts.append({
                    "type": "OFF_HOURS_WARNING",
                    "severity": "WARNING",
                    "row_number": row_num,
                    "message": f"Row {row_num}: Class scheduled outside standard institutional operating hours (08:00 AM - 07:00 PM).",
                })

        # 3. Resolve Subject Mapping
        mapped_subject_id = subject_map.get(s_raw)
        if not mapped_subject_id or mapped_subject_id not in sub_dict:
            conflicts.append({
                "type": "UNKNOWN_SUBJECT",
                "severity": "ERROR",
                "row_number": row_num,
                "message": f"Row {row_num}: Unmapped subject '{s_raw}'. Please map to an approved curriculum subject.",
            })

        # 4. Resolve Faculty Mapping
        mapped_faculty_id = faculty_map.get(f_raw)
        if not mapped_faculty_id or mapped_faculty_id not in fac_dict:
            conflicts.append({
                "type": "UNKNOWN_FACULTY",
                "severity": "ERROR",
                "row_number": row_num,
                "message": f"Row {row_num}: Unmapped faculty '{f_raw}'. Please map to an active faculty member.",
            })

        # 5. Resolve Room Mapping
        mapped_room = room_map.get(r_raw)
        if not mapped_room or mapped_room not in room_dict:
            conflicts.append({
                "type": "UNKNOWN_ROOM",
                "severity": "ERROR",
                "row_number": row_num,
                "message": f"Row {row_num}: Unmapped or unauthorized room '{r_raw}'. Please map to an approved institutional room.",
            })

        validated_rows.append({
            "row_number": row_num,
            "day_of_week": day_of_week,
            "day_name": DAY_NAMES[day_of_week] if day_of_week is not None else day_raw,
            "start_time": start_t.strftime("%H:%M") if start_t else start_raw,
            "end_time": end_t.strftime("%H:%M") if end_t else end_raw,
            "start_t": start_t,
            "end_t": end_t,
            "subject_id": mapped_subject_id,
            "subject_code": sub_dict[mapped_subject_id]["code"] if mapped_subject_id in sub_dict else s_raw,
            "subject_name": sub_dict[mapped_subject_id]["name"] if mapped_subject_id in sub_dict else s_raw,
            "faculty_id": mapped_faculty_id,
            "faculty_name": fac_dict[mapped_faculty_id]["name"] if mapped_faculty_id in fac_dict else f_raw,
            "faculty_employee_id": fac_dict[mapped_faculty_id]["employee_id"] if mapped_faculty_id in fac_dict else "",
            "room_number": mapped_room if mapped_room else r_raw,
            "is_valid": True,
        })

    # Internal Overlap Detection (within this proposed timetable)
    for i in range(len(validated_rows)):
        r1 = validated_rows[i]
        if r1["day_of_week"] is None or not r1["start_t"] or not r1["end_t"]:
            continue
        for j in range(i + 1, len(validated_rows)):
            r2 = validated_rows[j]
            if r2["day_of_week"] is None or not r2["start_t"] or not r2["end_t"]:
                continue

            if r1["day_of_week"] == r2["day_of_week"] and _time_overlap(r1["start_t"], r1["end_t"], r2["start_t"], r2["end_t"]):
                # Section Overlap: The same section cannot attend two classes at once
                conflicts.append({
                    "type": "SECTION_OVERLAP",
                    "severity": "ERROR",
                    "row_number": r2["row_number"],
                    "message": f"Section Overlap: Row {r1['row_number']} ({r1['subject_code']}) overlaps with Row {r2['row_number']} ({r2['subject_code']}) on {r1['day_name']} from {r2['start_time']} to {r2['end_time']}.",
                })

                # Faculty Overlap
                if r1["faculty_id"] and r2["faculty_id"] and r1["faculty_id"] == r2["faculty_id"]:
                    conflicts.append({
                        "type": "FACULTY_OVERLAP",
                        "severity": "ERROR",
                        "row_number": r2["row_number"],
                        "message": f"Faculty Overlap: {r1['faculty_name']} is assigned to both Row {r1['row_number']} ({r1['subject_code']}) and Row {r2['row_number']} ({r2['subject_code']}) at the same time.",
                    })

                # Room Overlap
                if r1["room_number"] and r2["room_number"] and r1["room_number"].lower() == r2["room_number"].lower():
                    conflicts.append({
                        "type": "ROOM_OVERLAP",
                        "severity": "ERROR",
                        "row_number": r2["row_number"],
                        "message": f"Room Overlap: Room {r1['room_number']} is booked for both Row {r1['row_number']} ({r1['subject_code']}) and Row {r2['row_number']} ({r2['subject_code']}) simultaneously.",
                    })

    # External Conflict Detection against other active timetables in the institution
    ext_q = select(Timetable).where(
        Timetable.is_active == True,
        Timetable.section_id != section_id  # Compare against OTHER sections
    ).options(selectinload(Timetable.subject), selectinload(Timetable.faculty), selectinload(Timetable.section))
    ext_res = await db.execute(ext_q)
    existing_timetables = ext_res.scalars().all()

    for r in validated_rows:
        if r["day_of_week"] is None or not r["start_t"] or not r["end_t"]:
            continue
        for ex in existing_timetables:
            if ex.day_of_week == r["day_of_week"] and _time_overlap(r["start_t"], r["end_t"], ex.start_time, ex.end_time):
                # Check faculty external conflict
                if r["faculty_id"] and ex.faculty_id == r["faculty_id"]:
                    sec_name = ex.section.name if ex.section else f"Section #{ex.section_id}"
                    conflicts.append({
                        "type": "EXTERNAL_FACULTY_OVERLAP",
                        "severity": "ERROR",
                        "row_number": r["row_number"],
                        "message": f"External Faculty Conflict: {r['faculty_name']} is already teaching {ex.subject.code if ex.subject else ''} for {sec_name} on {r['day_name']} from {ex.start_time.strftime('%H:%M')} to {ex.end_time.strftime('%H:%M')}.",
                    })
                # Check room external conflict
                if r["room_number"] and ex.room_number.lower() == r["room_number"].lower():
                    sec_name = ex.section.name if ex.section else f"Section #{ex.section_id}"
                    conflicts.append({
                        "type": "EXTERNAL_ROOM_OVERLAP",
                        "severity": "ERROR",
                        "row_number": r["row_number"],
                        "message": f"External Room Conflict: Room {r['room_number']} is already occupied by {sec_name} ({ex.subject.code if ex.subject else ''}) on {r['day_name']} from {ex.start_time.strftime('%H:%M')} to {ex.end_time.strftime('%H:%M')}.",
                    })

    error_count = sum(1 for c in conflicts if c["severity"] == "ERROR")
    warning_count = sum(1 for c in conflicts if c["severity"] == "WARNING")

    # Serialize rows for client response
    clean_preview_rows = [
        {
            "row_number": r["row_number"],
            "day_of_week": r["day_of_week"],
            "day_name": r["day_name"],
            "start_time": r["start_time"],
            "end_time": r["end_time"],
            "subject_id": r["subject_id"],
            "subject_code": r["subject_code"],
            "subject_name": r["subject_name"],
            "faculty_id": r["faculty_id"],
            "faculty_name": r["faculty_name"],
            "faculty_employee_id": r["faculty_employee_id"],
            "room_number": r["room_number"],
            "has_error": any(c["row_number"] == r["row_number"] and c["severity"] == "ERROR" for c in conflicts),
        }
        for r in validated_rows
    ]

    return {
        "is_valid": error_count == 0,
        "error_count": error_count,
        "warning_count": warning_count,
        "conflicts": conflicts,
        "preview_rows": clean_preview_rows,
    }


async def publish_validated_timetable(
    db: AsyncSession,
    department_id: int,
    section_id: int,
    academic_year: str,
    semester: int,
    entries: List[Dict[str, Any]],
    user_id: int,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Publishes an approved timetable:
    1. Archives previous timetable sets for this section.
    2. Deactivates previous timetable records.
    3. Increments version number.
    4. Creates TimetableSet and Timetable records.
    5. Updates/creates FacultyAssignment records to authorize faculty teaching.
    6. Automatically derives upcoming ClassSession records for current week.
    7. Records audit log.
    """
    # 1. Archive previous sets
    prev_sets_q = select(TimetableSet).where(
        TimetableSet.section_id == section_id,
        TimetableSet.status.in_(["PUBLISHED", "DRAFT"])
    )
    prev_res = await db.execute(prev_sets_q)
    prev_sets = prev_res.scalars().all()
    max_version = 0
    for ps in prev_sets:
        if ps.version_number > max_version:
            max_version = ps.version_number
        if ps.status == "PUBLISHED":
            ps.status = "ARCHIVED"

    # Deactivate old timetables
    prev_tt_q = select(Timetable).where(Timetable.section_id == section_id, Timetable.is_active == True)
    prev_tt_res = await db.execute(prev_tt_q)
    for tt in prev_tt_res.scalars().all():
        tt.is_active = False

    # 2. Create new TimetableSet
    new_version = max_version + 1
    new_set = TimetableSet(
        department_id=department_id,
        academic_year=academic_year,
        semester=semester,
        section_id=section_id,
        version_number=new_version,
        status="PUBLISHED",
        created_by_user_id=user_id,
        published_at=datetime.utcnow(),
        notes=notes or f"Published approved timetable v{new_version}"
    )
    db.add(new_set)
    await db.flush()

    # 3. Create Timetable records
    created_timetables = []
    for entry in entries:
        st = parse_time_str(entry["start_time"])
        et = parse_time_str(entry["end_time"])
        tt = Timetable(
            timetable_set_id=new_set.id,
            subject_id=entry["subject_id"],
            section_id=section_id,
            faculty_id=entry["faculty_id"],
            day_of_week=entry["day_of_week"],
            start_time=st,
            end_time=et,
            room_number=entry["room_number"],
            is_active=True
        )
        db.add(tt)
        created_timetables.append(tt)

        # 4. Authorize Faculty Assignment if not already present
        assign_q = select(FacultyAssignment).where(
            FacultyAssignment.faculty_id == entry["faculty_id"],
            FacultyAssignment.subject_id == entry["subject_id"],
            FacultyAssignment.section_id == section_id
        )
        assign_res = await db.execute(assign_q)
        if not assign_res.scalar_one_or_none():
            fa = FacultyAssignment(
                faculty_id=entry["faculty_id"],
                subject_id=entry["subject_id"],
                section_id=section_id,
                academic_term=f"{academic_year} Sem {semester}"
            )
            db.add(fa)

    await db.flush()

    # 5. Automatically derive scheduled class sessions for upcoming 7 days
    today = date.today()
    derived_sessions_count = 0
    for day_offset in range(7):
        target_date = today + timedelta(days=day_offset)
        target_dow = target_date.weekday()  # Monday = 0

        matching_entries = [tt for tt in created_timetables if tt.day_of_week == target_dow]
        for tt in matching_entries:
            sched_start = datetime.combine(target_date, tt.start_time)
            sched_end = datetime.combine(target_date, tt.end_time)

            # Check if a session already exists for this slot
            existing_sess_q = select(ClassSession).where(
                ClassSession.section_id == section_id,
                ClassSession.subject_id == tt.subject_id,
                ClassSession.scheduled_start == sched_start
            )
            existing_res = await db.execute(existing_sess_q)
            existing_sess = existing_res.scalar_one_or_none()
            if not existing_sess:
                new_session = ClassSession(
                    timetable_id=tt.id,
                    subject_id=tt.subject_id,
                    section_id=section_id,
                    faculty_id=tt.faculty_id,
                    room_number=tt.room_number,
                    scheduled_start=sched_start,
                    scheduled_end=sched_end,
                    status=SessionStatus.SCHEDULED,
                    mode=OperatingMode.SIMULATION,
                    topic=f"Curricular Session: {DAY_NAMES[tt.day_of_week]}"
                )
                db.add(new_session)
                derived_sessions_count += 1
            else:
                existing_sess.timetable_id = tt.id
                existing_sess.faculty_id = tt.faculty_id
                existing_sess.room_number = tt.room_number
                derived_sessions_count += 1

    # 6. Audit Log
    sec_res = await db.execute(select(Section).where(Section.id == section_id))
    sec_obj = sec_res.scalar_one_or_none()
    sec_name = sec_obj.name if sec_obj else f"Section #{section_id}"

    audit = AuditLog(
        user_id=user_id,
        action="TIMETABLE_PUBLISHED",
        resource=f"Section:{section_id}",
        details=f"Published timetable v{new_version} for {sec_name} ({len(created_timetables)} periods, {derived_sessions_count} sessions generated)."
    )
    db.add(audit)
    await db.commit()

    return {
        "timetable_set_id": new_set.id,
        "version_number": new_version,
        "status": "PUBLISHED",
        "published_at": new_set.published_at.isoformat(),
        "total_periods": len(created_timetables),
        "derived_sessions_count": derived_sessions_count,
        "section_name": sec_name,
    }
