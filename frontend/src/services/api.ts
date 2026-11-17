import axios from 'axios';
import {
  AuthResponse,
  User,
  SubjectAttendance,
  AttendanceRecordItem,
  AttendanceSessionData,
  Camera,
  CameraStreamState,
  ActivityEventItem,
  StudentActivitySummary,
  ActivityComparisonData,
  IncidentRecordItem,
  NotificationItem,
} from '../types';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('classsphere_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('classsphere_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post('/api/auth/refresh', { refresh_token: refreshToken });
          localStorage.setItem('classsphere_access_token', res.data.access_token);
          localStorage.setItem('classsphere_refresh_token', res.data.refresh_token);
          originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('classsphere_access_token');
          localStorage.removeItem('classsphere_refresh_token');
          localStorage.removeItem('classsphere_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  login: async (email_or_id: string, password: string, remember_me = false) => {
    const res = await api.post<AuthResponse>('/auth/login', { email_or_id, password, remember_me });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
  sendOTP: async (phone_number: string) => {
    const res = await api.post('/auth/send-otp', { phone_number });
    return res.data;
  },
  verifyOTP: async (phone_number: string, code: string) => {
    const res = await api.post('/auth/verify-otp', { phone_number, code });
    return res.data;
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('classsphere_access_token');
      localStorage.removeItem('classsphere_refresh_token');
      localStorage.removeItem('classsphere_user');
    }
  },
};

// Student endpoints
export const studentApi = {
  getDashboard: async () => {
    const res = await api.get('/students/dashboard');
    return res.data;
  },
  getClassCompanion: async () => {
    const res = await api.get('/students/class-companion');
    return res.data;
  },
  getSubjectWiseAttendance: async () => {
    const res = await api.get<SubjectAttendance[]>('/students/attendance/subject-wise');
    return res.data;
  },
  getAttendanceHistory: async () => {
    const res = await api.get('/students/attendance/history');
    return res.data;
  },
  getMyActivity: async () => {
    const res = await api.get('/students/activity');
    return res.data;
  },
  getActivityComparison: async () => {
    const res = await api.get<ActivityComparisonData>('/students/activity/comparison');
    return res.data;
  },
};

// Faculty endpoints
export const facultyApi = {
  getDashboard: async () => {
    const res = await api.get('/faculty/dashboard');
    return res.data;
  },
  getDailyOverview: async () => {
    const res = await api.get('/faculty/daily-overview');
    return res.data;
  },
  getClassDashboard: async (classId: number) => {
    const res = await api.get(`/faculty/classes/${classId}/dashboard`);
    return res.data;
  },
  getClassLogs: async (classId: number) => {
    const res = await api.get(`/faculty/classes/${classId}/logs`);
    return res.data;
  },
  getAuthorizedClasses: async () => {
    const res = await api.get('/faculty/authorized-classes');
    return res.data;
  },
  startClassSession: async (payload: {
    subject_id: number;
    section_id: number;
    room_number: string;
    session_id?: number;
    topic?: string;
  }) => {
    const res = await api.post('/faculty/classes/start-session', payload);
    return res.data;
  },
  endClassSession: async (sessionId: number) => {
    const res = await api.post(`/faculty/classes/${sessionId}/end`);
    return res.data;
  },
};

// Attendance endpoints
export const attendanceApi = {
  startSession: async (class_session_id: number) => {
    const res = await api.post('/attendance/session/start', { class_session_id });
    return res.data;
  },
  checkIn: async (challenge_code: string) => {
    const res = await api.post('/attendance/check-in', { challenge_code });
    return res.data;
  },
  uploadPhoto: async (session_id: number, photo: File) => {
    const formData = new FormData();
    formData.append('session_id', session_id.toString());
    formData.append('photo', photo);
    const res = await api.post('/attendance/upload-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getSession: async (session_id: number) => {
    const res = await api.get<AttendanceSessionData>(`/attendance/session/${session_id}`);
    return res.data;
  },
  overrideRecord: async (record_id: number, new_status: string, reason: string) => {
    const res = await api.post('/attendance/override', { record_id, new_status, reason });
    return res.data;
  },
  finalizeSession: async (session_id: number) => {
    const res = await api.post('/attendance/session/finalize', { session_id });
    return res.data;
  },
  uploadStudentVerificationPhoto: async (sessionId: number, photo: File) => {
    const formData = new FormData();
    formData.append('session_id', sessionId.toString());
    formData.append('photo', photo);
    const res = await api.post('/attendance/student/verification-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  reviewCandidate: async (recordId: number, decision: string, reason?: string) => {
    const res = await api.post('/attendance/review-candidate', {
      record_id: recordId,
      decision,
      reason,
    });
    return res.data;
  },
};

// Camera endpoints
export const cameraApi = {
  listCameras: async () => {
    const res = await api.get<Camera[]>('/cameras');
    return res.data;
  },
  getStreamState: async (cameraId: number) => {
    const res = await api.get<CameraStreamState>(`/cameras/${cameraId}/stream`);
    return res.data;
  },
  toggleMode: async (cameraId: number) => {
    const res = await api.post(`/cameras/${cameraId}/toggle-mode`);
    return res.data;
  },
  setSourceMode: async (cameraId: number, sourceMode: string, rtspUrl?: string, mediaUrl?: string) => {
    const res = await api.post(`/cameras/${cameraId}/set-source`, {
      source_mode: sourceMode,
      rtsp_url: rtspUrl,
      media_url: mediaUrl,
    });
    return res.data;
  },
  triggerSimulatedEvent: async (cameraId: number, event_type: string, class_session_id = 1) => {
    const res = await api.post(`/cameras/${cameraId}/trigger-simulated-event?event_type=${event_type}&class_session_id=${class_session_id}`);
    return res.data;
  },
};

// Events endpoints
export const eventApi = {
  getClassroomEvents: async (classSessionId: number) => {
    const res = await api.get<ActivityEventItem[]>(`/events/classroom/${classSessionId}`);
    return res.data;
  },
  getIndividualSummary: async (classSessionId: number) => {
    const res = await api.get<StudentActivitySummary[]>(`/events/individual/${classSessionId}`);
    return res.data;
  },
  getOverallComparison: async () => {
    const res = await api.get<ActivityComparisonData>('/events/comparison');
    return res.data;
  },
};

// Safety / Incidents endpoints
export const incidentApi = {
  getActiveIncidents: async () => {
    const res = await api.get<IncidentRecordItem[]>('/incidents/active');
    return res.data;
  },
  getIncidentHistory: async () => {
    const res = await api.get<IncidentRecordItem[]>('/incidents/history');
    return res.data;
  },
  acknowledge: async (incident_id: number, notes?: string) => {
    const res = await api.post('/incidents/acknowledge', { incident_id, notes });
    return res.data;
  },
  dismiss: async (incident_id: number, reason: string) => {
    const res = await api.post('/incidents/dismiss', { incident_id, reason });
    return res.data;
  },
  escalate: async (incident_id: number, escalation_reason: string) => {
    const res = await api.post('/incidents/escalate', { incident_id, escalation_reason });
    return res.data;
  },
  resolveHOD: async (incident_id: number, decision: string, status: string) => {
    const res = await api.post('/incidents/resolve', { incident_id, decision, status });
    return res.data;
  },
};

// HOD endpoints
export const hodApi = {
  getDashboard: async () => {
    const res = await api.get('/hod/dashboard');
    return res.data;
  },
  getFacultyOverview: async () => {
    const res = await api.get('/hod/faculty-overview');
    return res.data;
  },
  getClassOverview: async () => {
    const res = await api.get('/hod/class-overview');
    return res.data;
  },
  getActivityOverview: async () => {
    const res = await api.get('/hod/activity-overview');
    return res.data;
  },
  getCameraOverview: async () => {
    const res = await api.get('/hod/camera-overview');
    return res.data;
  },
  getAuditLogs: async (limit = 50) => {
    const res = await api.get(`/hod/audit-logs?limit=${limit}`);
    return res.data;
  },
  getStudents: async () => {
    const res = await api.get('/hod/students');
    return res.data;
  },
};

// Notifications
export const notificationApi = {
  getNotifications: async () => {
    const res = await api.get<NotificationItem[]>('/notifications');
    return res.data;
  },
  markAsRead: async (id: number) => {
    const res = await api.post(`/notifications/${id}/read`);
    return res.data;
  },
};

// Institutional CSV Import Facility (Authentic Institutional Records)
export const institutionalImportApi = {
  importCSV: async (entityType: string, csvContent: string, dryRun: boolean = false) => {
    const res = await api.post('/hod/import/csv', {
      entity_type: entityType,
      csv_content: csvContent,
      dry_run: dryRun,
    });
    return res.data;
  },
  getTemplate: async (entityType: string) => {
    const res = await api.get(`/hod/import/template/${entityType}`);
    return res.data;
  },
};

// HOD Timetable Management Module
export const timetableApi = {
  getCatalogs: async (departmentId?: number) => {
    const query = departmentId ? `?department_id=${departmentId}` : '';
    const res = await api.get(`/timetable/catalogs${query}`);
    return res.data;
  },
  getTemplate: async () => {
    const res = await api.get('/timetable/template');
    return res.data;
  },
  parseTimetable: async (formData: FormData) => {
    const res = await api.post('/timetable/parse', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  validateTimetable: async (payload: {
    department_id: number;
    section_id: number;
    academic_year: string;
    semester: number;
    raw_entries: any[];
    mappings: any;
  }) => {
    const res = await api.post('/timetable/validate', payload);
    return res.data;
  },
  publishTimetable: async (payload: {
    department_id: number;
    section_id: number;
    academic_year: string;
    semester: number;
    entries: any[];
    notes?: string;
  }) => {
    const res = await api.post('/timetable/publish', payload);
    return res.data;
  },
  getSectionTimetable: async (sectionId: number) => {
    const res = await api.get(`/timetable/section/${sectionId}`);
    return res.data;
  },
  getFacultyTimetable: async (facultyId: number) => {
    const res = await api.get(`/timetable/faculty/${facultyId}`);
    return res.data;
  },
};
