export type Role = 'STUDENT' | 'FACULTY' | 'HOD' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  institutional_id: string;
  full_name: string;
  role: Role;
  phone_number?: string;
  is_active: boolean;
  is_phone_verified: boolean;
  avatar_url?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface ClassSessionItem {
  id: number;
  subject_name: string;
  subject_code: string;
  section_name?: string;
  room_number: string;
  scheduled_time: string;
  actual_start?: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  mode: 'SIMULATION' | 'CONNECTED';
  attendance_taken: boolean;
  present_count: number;
  late_count: number;
  pending_review_count: number;
  total_enrolled: number;
}

export interface ClassCompanionData {
  active: boolean;
  session_id?: number;
  subject_name?: string;
  subject_code?: string;
  room_number?: string;
  scheduled_time?: string;
  actual_start?: string;
  session_status?: string;
  attendance_taken?: boolean;
  my_attendance_status?: string;
  topic?: string;
  mode?: string;
  message?: string;
}

export interface SubjectAttendance {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  faculty_name: string;
  credits: number;
  classes_conducted: number;
  classes_attended: number;
  classes_missed: number;
  attendance_percentage: number;
  status: 'ON_TRACK' | 'AT_RISK' | 'CRITICAL';
}

export interface AttendanceRecordItem {
  id: number;
  student_id: number;
  student_name: string;
  roll_number: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'PENDING_VERIFICATION' | 'MANUAL_REVIEW' | 'DISPUTED';
  confidence_score?: number;
  verified_by_photo: boolean;
  manual_override: boolean;
  override_reason?: string;
  marked_at: string;
}

export interface AttendanceSessionData {
  id: number;
  class_session_id: number;
  verification_challenge: string;
  status: 'ACTIVE' | 'CLOSED' | 'FINALIZED';
  started_at: string;
  closed_at?: string;
  classroom_photo_url?: string;
  detected_faces_count: number;
  verified_matches_count: number;
  pending_reviews_count: number;
  records: AttendanceRecordItem[];
}

export interface WhatIfResponse {
  subject_id: number;
  subject_name: string;
  current_conducted: number;
  current_attended: number;
  current_percentage: number;
  simulated_conducted: number;
  simulated_attended: number;
  projected_percentage: number;
  percentage_delta: number;
  simulation_note: string;
}

export interface Camera {
  id: number;
  name: string;
  room_number: string;
  ip_or_rtsp_url: string;
  mode: 'SIMULATION' | 'CONNECTED';
  status: 'ONLINE' | 'OFFLINE' | 'RECONNECTING' | 'ERROR';
  stream_health: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  fps: number;
  resolution: string;
  last_heartbeat: string;
  error_message?: string;
}

export interface DetectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
  student_id?: number;
  roll_number?: string;
}

export interface CameraStreamState {
  mode: 'SIMULATION' | 'CONNECTED';
  simulation_label: string;
  frame_id: number;
  timestamp: string;
  camera_id: number;
  camera_name: string;
  room_number: string;
  stream_health: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  fps: number;
  resolution: string;
  persons_count: number;
  persons: DetectionBox[];
  active_events: Array<{
    type: 'PHONE_USAGE' | 'TALKING' | 'SUDDEN_FALL';
    student_id?: number;
    roll_number?: string;
    confidence: number;
    timestamp: string;
    box?: { x: number; y: number; width: number; height: number };
  }>;
  diagnostics: {
    packet_loss_pct: number;
    latency_ms: number;
    encoding: string;
    source: string;
  };
}

export interface ActivityEventItem {
  id: number;
  class_session_id: number;
  student_id?: number;
  student_name?: string;
  roll_number?: string;
  event_type: 'PHONE_USAGE' | 'TALKING' | 'OTHER';
  confidence: number;
  timestamp: string;
  model_version: string;
  review_status: 'UNREVIEWED' | 'VERIFIED' | 'DISMISSED';
  is_simulated: number;
}

export interface StudentActivitySummary {
  student_id: number;
  student_name: string;
  roll_number: string;
  phone_event_count: number;
  talking_event_count: number;
  total_recorded_events: number;
  last_event_time?: string;
  review_status: string;
}

export interface ActivityComparisonData {
  subject_name?: string;
  period_label: string;
  current_phone_events: number;
  previous_phone_events: number;
  phone_pct_change: number;
  current_talking_events: number;
  previous_talking_events: number;
  talking_pct_change: number;
  total_current: number;
  total_previous: number;
  total_pct_change: number;
  is_simulated: boolean;
}

export interface IncidentRecordItem {
  id: number;
  class_session_id: number;
  room_number: string;
  subject_name: string;
  incident_type: 'SUDDEN_FALL' | 'UNUSUAL_EVENT';
  confidence: number;
  timestamp: string;
  evidence_snapshot_url?: string;
  status: 'PENDING_FACULTY_REVIEW' | 'ACKNOWLEDGED_FACULTY' | 'DISMISSED_FACULTY' | 'ESCALATED_TO_HOD' | 'RESOLVED_HOD' | 'DISMISSED_HOD';
  faculty_notes?: string;
  hod_decision?: string;
  is_simulated: number;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  recipient_user_id: number;
  role_target?: string;
  title: string;
  message: string;
  category: 'ATTENDANCE' | 'INCIDENT' | 'SYSTEM' | 'CAMERA' | 'ACADEMIC';
  is_read: boolean;
  delivery_status: 'DELIVERED' | 'PENDING' | 'FAILED';
  link_url?: string;
  created_at: string;
}
