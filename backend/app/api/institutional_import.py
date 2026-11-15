import csv
import io
import re
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models.user import User, RoleEnum, AuditLog
from app.models.academic import Department, Faculty, Student, Subject, Section
from app.core.dependencies import require_hod
from app.core.security import hash_password

router = APIRouter(prefix="/api/hod/import", tags=["Institutional CSV Import Facility"])

EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")


class CSVImportRequest(BaseModel):
    entity_type: str  # STUDENTS, FACULTY, SUBJECTS, TIMETABLE
    csv_content: str
    dry_run: bool = False


class ImportRowIssue(BaseModel):
    row_number: int
    identifier: str
    reason: str


class ImportReportOut(BaseModel):
    success: bool
    entity_type: str
    dry_run: bool
    total_rows_processed: int
    imported_count: int
    duplicate_count: int
    error_count: int
    duplicates: List[ImportRowIssue]
    errors: List[ImportRowIssue]
    imported_preview: List[dict]
    audit_log_id: Optional[int] = None
    message: str


TEMPLATES = {
    "STUDENTS": "roll_number,full_name,email,section_name,batch_year\nCS24B020,Devansh Nair,devansh.nair@classsphere.edu,Section A,2026-2027\nCS24B021,Ananya Roy,ananya.roy@classsphere.edu,Section A,2026-2027",
    "FACULTY": "employee_id,full_name,email,designation\nFAC-1004,Dr. Priya Sundaram,priya.sundaram@classsphere.edu,Assistant Professor\nFAC-1005,Prof. Sanjay Bose,sanjay.bose@classsphere.edu,Visiting Lecturer",
    "SUBJECTS": "code,name,credits\nCS305,Cloud Computing & DevOps,3\nCS306,Network Security & Cryptography,4",
}


@router.get("/template/{entity_type}")
async def get_csv_template(
    entity_type: str,
    current_user: User = Depends(require_hod)
):
    entity_key = entity_type.upper()
    if entity_key not in TEMPLATES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid entity type '{entity_type}'. Allowed types: {list(TEMPLATES.keys())}"
        )
    return {
        "entity_type": entity_key,
        "template_csv": TEMPLATES[entity_key],
        "filename": f"classsphere_{entity_key.lower()}_template.csv"
    }


@router.post("/csv", response_model=ImportReportOut)
async def import_institutional_csv(
    req: CSVImportRequest,
    current_user: User = Depends(require_hod),
    db: AsyncSession = Depends(get_db)
):
    entity_key = req.entity_type.upper()
    if entity_key not in ["STUDENTS", "FACULTY", "SUBJECTS"]:
        raise HTTPException(status_code=400, detail="Supported entity types: STUDENTS, FACULTY, SUBJECTS")

    # Parse CSV content
    f = io.StringIO(req.csv_content.strip())
    reader = csv.DictReader(f)
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV file appears empty or missing headers.")

    # Fetch default department
    dept_res = await db.execute(select(Department).limit(1))
    dept = dept_res.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=500, detail="Department record missing in database.")

    # Fetch default section
    sec_res = await db.execute(select(Section).limit(1))
    default_sec = sec_res.scalar_one_or_none()

    duplicates: List[ImportRowIssue] = []
    errors: List[ImportRowIssue] = []
    valid_rows_to_insert = []
    seen_identifiers = set()

    row_idx = 1  # 1-based data row counter
    for row in reader:
        row_idx += 1
        # Strip all keys and values
        clean_row = {k.strip(): v.strip() for k, v in row.items() if k}

        if entity_key == "STUDENTS":
            roll = clean_row.get("roll_number", "")
            name = clean_row.get("full_name", "")
            email = clean_row.get("email", "").lower()
            batch = clean_row.get("batch_year", "2026-2027")

            if not roll or not name or not email:
                errors.append(ImportRowIssue(row_number=row_idx, identifier=roll or "N/A", reason="Missing required roll_number, full_name, or email"))
                continue

            if not EMAIL_REGEX.match(email):
                errors.append(ImportRowIssue(row_number=row_idx, identifier=email, reason="Invalid institutional email format"))
                continue

            # Duplicate check within file
            if roll in seen_identifiers or email in seen_identifiers:
                duplicates.append(ImportRowIssue(row_number=row_idx, identifier=f"{roll}/{email}", reason="Duplicate entry within CSV file"))
                continue
            seen_identifiers.add(roll)
            seen_identifiers.add(email)

            # Duplicate check in database
            db_user = await db.execute(select(User).where(User.email == email))
            if db_user.scalar_one_or_none():
                duplicates.append(ImportRowIssue(row_number=row_idx, identifier=email, reason="Email already registered in institutional database"))
                continue

            db_st = await db.execute(select(Student).where(Student.roll_number == roll))
            if db_st.scalar_one_or_none():
                duplicates.append(ImportRowIssue(row_number=row_idx, identifier=roll, reason="Roll number already registered in institutional database"))
                continue

            valid_rows_to_insert.append({
                "type": "STUDENT",
                "roll": roll,
                "name": name,
                "email": email,
                "batch": batch,
                "section_id": default_sec.id if default_sec else 1
            })

        elif entity_key == "FACULTY":
            emp_id = clean_row.get("employee_id", "")
            name = clean_row.get("full_name", "")
            email = clean_row.get("email", "").lower()
            desig = clean_row.get("designation", "Faculty Member")

            if not emp_id or not name or not email:
                errors.append(ImportRowIssue(row_number=row_idx, identifier=emp_id or "N/A", reason="Missing required employee_id, full_name, or email"))
                continue

            if not EMAIL_REGEX.match(email):
                errors.append(ImportRowIssue(row_number=row_idx, identifier=email, reason="Invalid institutional email format"))
                continue

            if emp_id in seen_identifiers or email in seen_identifiers:
                duplicates.append(ImportRowIssue(row_number=row_idx, identifier=f"{emp_id}/{email}", reason="Duplicate entry within CSV file"))
                continue
            seen_identifiers.add(emp_id)
            seen_identifiers.add(email)

            db_user = await db.execute(select(User).where(User.email == email))
            if db_user.scalar_one_or_none():
                duplicates.append(ImportRowIssue(row_number=row_idx, identifier=email, reason="Email already registered in institutional database"))
                continue

            db_fac = await db.execute(select(Faculty).where(Faculty.employee_id == emp_id))
            if db_fac.scalar_one_or_none():
                duplicates.append(ImportRowIssue(row_number=row_idx, identifier=emp_id, reason="Employee ID already registered in institutional database"))
                continue

            valid_rows_to_insert.append({
                "type": "FACULTY",
                "employee_id": emp_id,
                "name": name,
                "email": email,
                "designation": desig
            })

        elif entity_key == "SUBJECTS":
            code = clean_row.get("code", "").upper()
            name = clean_row.get("name", "")
            credits_str = clean_row.get("credits", "3")

            if not code or not name:
                errors.append(ImportRowIssue(row_number=row_idx, identifier=code or "N/A", reason="Missing subject code or name"))
                continue

            try:
                credits_val = int(credits_str)
            except ValueError:
                errors.append(ImportRowIssue(row_number=row_idx, identifier=code, reason="Credits must be an integer"))
                continue

            if code in seen_identifiers:
                duplicates.append(ImportRowIssue(row_number=row_idx, identifier=code, reason="Duplicate subject code within CSV"))
                continue
            seen_identifiers.add(code)

            db_subj = await db.execute(select(Subject).where(Subject.code == code))
            if db_subj.scalar_one_or_none():
                duplicates.append(ImportRowIssue(row_number=row_idx, identifier=code, reason="Subject code already registered in database"))
                continue

            valid_rows_to_insert.append({
                "type": "SUBJECT",
                "code": code,
                "name": name,
                "credits": credits_val
            })

    total_processed = len(valid_rows_to_insert) + len(duplicates) + len(errors)
    imported_preview = []
    audit_id = None

    # If NOT dry run, persist to PostgreSQL / SQLite database with REAL data_source tag
    if not req.dry_run and valid_rows_to_insert:
        for item in valid_rows_to_insert:
            if item["type"] == "STUDENT":
                user = User(
                    email=item["email"],
                    institutional_id=item["roll"],
                    hashed_password=hash_password("Password@123"),
                    full_name=item["name"],
                    role=RoleEnum.STUDENT,
                    is_active=True,
                    is_phone_verified=False
                )
                db.add(user)
                await db.flush()

                st = Student(
                    user_id=user.id,
                    roll_number=item["roll"],
                    department_id=dept.id,
                    section_id=item["section_id"],
                    batch_year=item["batch"],
                    data_source="REAL"  # Authentic institutional record
                )
                db.add(st)
                imported_preview.append({"identifier": item["roll"], "name": item["name"], "email": item["email"], "data_source": "REAL"})

            elif item["type"] == "FACULTY":
                user = User(
                    email=item["email"],
                    institutional_id=item["employee_id"],
                    hashed_password=hash_password("Password@123"),
                    full_name=item["name"],
                    role=RoleEnum.FACULTY,
                    is_active=True,
                    is_phone_verified=False
                )
                db.add(user)
                await db.flush()

                fac = Faculty(
                    user_id=user.id,
                    employee_id=item["employee_id"],
                    department_id=dept.id,
                    designation=item["designation"],
                    data_source="REAL"  # Authentic institutional record
                )
                db.add(fac)
                imported_preview.append({"identifier": item["employee_id"], "name": item["name"], "email": item["email"], "data_source": "REAL"})

            elif item["type"] == "SUBJECT":
                subj = Subject(
                    code=item["code"],
                    name=item["name"],
                    department_id=dept.id,
                    credits=item["credits"],
                    data_source="REAL"
                )
                db.add(subj)
                imported_preview.append({"identifier": item["code"], "name": item["name"], "credits": item["credits"], "data_source": "REAL"})

        # Record audit log
        audit = AuditLog(
            user_id=current_user.id,
            action="INSTITUTIONAL_CSV_IMPORT",
            resource=entity_key,
            details=f"Imported {len(valid_rows_to_insert)} {entity_key} records (Source: REAL). Discovered {len(duplicates)} duplicates and {len(errors)} errors."
        )
        db.add(audit)
        await db.commit()
        audit_id = audit.id
    else:
        # In dry run, return preview of valid rows
        imported_preview = [
            {"identifier": item.get("roll") or item.get("employee_id") or item.get("code"), "name": item.get("name"), "data_source": "REAL (Preview)"}
            for item in valid_rows_to_insert
        ]

    return ImportReportOut(
        success=len(errors) == 0,
        entity_type=entity_key,
        dry_run=req.dry_run,
        total_rows_processed=total_processed,
        imported_count=len(valid_rows_to_insert),
        duplicate_count=len(duplicates),
        error_count=len(errors),
        duplicates=duplicates,
        errors=errors,
        imported_preview=imported_preview,
        audit_log_id=audit_id,
        message="Dry-run validation successful. No database records modified." if req.dry_run else f"Successfully imported {len(valid_rows_to_insert)} authentic {entity_key} records into PostgreSQL database."
    )
