from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class CreateAttendanceSessionRequest(BaseModel):
    class_session_id: int


class CheckInRequest(BaseModel):
    challenge_code: str


class ManualOverrideRequest(BaseModel):
    record_id: int
    new_status: str  # PRESENT, ABSENT, LATE, MANUAL_REVIEW, DISPUTED
    reason: str


class FinalizeAttendanceRequest(BaseModel):
    session_id: int


class AttendanceRecordOut(BaseModel):
    id: int
    student_id: int
    student_name: str
    roll_number: str
    status: str
    confidence_score: Optional[float] = None
    verified_by_photo: bool
    manual_override: bool
    override_reason: Optional[str] = None
    marked_at: datetime


class AttendanceSessionOut(BaseModel):
    id: int
    class_session_id: int
    verification_challenge: str
    status: str
    started_at: datetime
    closed_at: Optional[datetime] = None
    classroom_photo_url: Optional[str] = None
    detected_faces_count: int
    verified_matches_count: int
    pending_reviews_count: int
    records: List[AttendanceRecordOut] = []


class SubjectAttendanceOut(BaseModel):
    subject_id: int
    subject_code: str
    subject_name: str
    faculty_name: str
    credits: int
    classes_conducted: int
    classes_attended: int
    classes_missed: int
    attendance_percentage: float
    status: str  # ON_TRACK, AT_RISK, CRITICAL


class WhatIfRequest(BaseModel):
    subject_id: int
    simulate_classes_present: int = 1
    simulate_classes_absent: int = 0


class WhatIfResponse(BaseModel):
    subject_id: int
    subject_name: str
    current_conducted: int
    current_attended: int
    current_percentage: float
    simulated_conducted: int
    simulated_attended: int
    projected_percentage: float
    percentage_delta: float
    simulation_note: str
