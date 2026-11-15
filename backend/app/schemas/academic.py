from typing import Optional, List
from datetime import time, datetime
from pydantic import BaseModel, ConfigDict


class DepartmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    description: Optional[str] = None


class SubjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    department_id: int
    credits: int


class SectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    department_id: int
    academic_year: str
    semester: int


class TimetableOut(BaseModel):
    id: int
    subject_id: int
    subject_code: str
    subject_name: str
    section_name: str
    faculty_name: str
    day_of_week: int
    start_time: str
    end_time: str
    room_number: str


class ClassSessionOut(BaseModel):
    id: int
    subject_id: int
    subject_code: str
    subject_name: str
    section_id: int
    section_name: str
    faculty_id: int
    faculty_name: str
    room_number: str
    scheduled_start: datetime
    scheduled_end: datetime
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    status: str
    mode: str
    topic: Optional[str] = None
    attendance_taken: bool = False
    present_count: int = 0
    late_count: int = 0
    unverified_count: int = 0
    total_students: int = 0


class ClassLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    class_session_id: int
    event_type: str
    description: str
    source: str
    timestamp: datetime
