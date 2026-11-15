from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class ActivityEventOut(BaseModel):
    id: int
    class_session_id: int
    student_id: Optional[int] = None
    student_name: Optional[str] = None
    roll_number: Optional[str] = None
    event_type: str
    confidence: float
    timestamp: datetime
    model_version: str
    review_status: str
    is_simulated: int


class StudentActivitySummaryOut(BaseModel):
    student_id: int
    student_name: str
    roll_number: str
    phone_event_count: int
    talking_event_count: int
    total_recorded_events: int
    last_event_time: Optional[datetime] = None
    review_status: str


class ActivityComparisonOut(BaseModel):
    subject_name: Optional[str] = "Overall"
    period_label: str  # "This Week vs Last Week"
    current_phone_events: int
    previous_phone_events: int
    phone_pct_change: float
    current_talking_events: int
    previous_talking_events: int
    talking_pct_change: float
    total_current: int
    total_previous: int
    total_pct_change: float
    is_simulated: bool = True


class IncidentRecordOut(BaseModel):
    id: int
    class_session_id: int
    room_number: str
    subject_name: str
    incident_type: str
    confidence: float
    timestamp: datetime
    evidence_snapshot_url: Optional[str] = None
    status: str
    faculty_notes: Optional[str] = None
    hod_decision: Optional[str] = None
    is_simulated: int
    created_at: datetime


class IncidentAcknowledgeRequest(BaseModel):
    incident_id: int
    notes: Optional[str] = "Checked and acknowledged in classroom."


class IncidentDismissRequest(BaseModel):
    incident_id: int
    reason: str


class IncidentEscalateRequest(BaseModel):
    incident_id: int
    escalation_reason: str


class IncidentHODResolveRequest(BaseModel):
    incident_id: int
    decision: str
    status: str  # RESOLVED_HOD or DISMISSED_HOD
