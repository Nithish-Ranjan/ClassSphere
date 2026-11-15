import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/Auth/LoginPage';

// Student Views
import { StudentDashboard } from './pages/Student/StudentDashboard';
import { ClassCompanion } from './pages/Student/ClassCompanion';
import { SubjectAttendanceView } from './pages/Student/SubjectAttendance';
import { AttendanceHistoryView } from './pages/Student/AttendanceHistory';
import { WhatIfSimulatorView } from './pages/Student/WhatIfSimulator';
import { MyActivityView } from './pages/Student/MyActivity';
import { ActivityComparisonView as StudentActivityComparison } from './pages/Student/ActivityComparison';

// Faculty Views
import { FacultyDashboard } from './pages/Faculty/FacultyDashboard';
import { FacultyDailyOverview } from './pages/Faculty/FacultyDailyOverview';
import { CompleteClassDashboard } from './pages/Faculty/CompleteClassDashboard';
import { ClassLogView } from './pages/Faculty/ClassLogView';
import { AttendanceSessionView } from './pages/Faculty/AttendanceSessionView';
import { LiveClassroom } from './pages/Faculty/LiveClassroom';
import { IndividualActivityView } from './pages/Faculty/IndividualActivityView';
import { SafetyCenter } from './pages/Faculty/SafetyCenter';

// HOD Views
import { HODDashboard } from './pages/HOD/HODDashboard';
import { AcademicOversightView } from './pages/HOD/AcademicOversight';
import { ClassIntelligenceView } from './pages/HOD/ClassIntelligence';
import { SafetyManagementView } from './pages/HOD/SafetyManagement';
import { AdministrationView } from './pages/HOD/Administration';

// Shared Views
import { NotificationsView } from './pages/Shared/NotificationsView';
import { AccountView } from './pages/Shared/AccountView';

// Protected Route Component
const ProtectedRoute: React.FC<{
  allowedRoles?: string[];
  children: React.ReactElement;
}> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to permitted portal
    if (user.role === 'STUDENT') return <Navigate to="/student/dashboard" replace />;
    if (user.role === 'FACULTY') return <Navigate to="/faculty/dashboard" replace />;
    if (user.role === 'HOD') return <Navigate to="/hod/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Root Router Redirector
const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'STUDENT') return <Navigate to="/student/dashboard" replace />;
  if (user.role === 'FACULTY') return <Navigate to="/faculty/dashboard" replace />;
  if (user.role === 'HOD') return <Navigate to="/hod/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Student Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/companion"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <ClassCompanion />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/attendance/subject-wise"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <SubjectAttendanceView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/attendance/history"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <AttendanceHistoryView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/what-if"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <WhatIfSimulatorView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/activity"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <MyActivityView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/activity/comparison"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentActivityComparison />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/notifications"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <NotificationsView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/account"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <AccountView />
              </ProtectedRoute>
            }
          />

          {/* Faculty Routes */}
          <Route
            path="/faculty/dashboard"
            element={
              <ProtectedRoute allowedRoles={['FACULTY', 'HOD']}>
                <FacultyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/daily-overview"
            element={
              <ProtectedRoute allowedRoles={['FACULTY', 'HOD']}>
                <FacultyDailyOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/today-classes"
            element={
              <ProtectedRoute allowedRoles={['FACULTY', 'HOD']}>
                <FacultyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/class/:classId/dashboard"
            element={
              <ProtectedRoute allowedRoles={['FACULTY', 'HOD']}>
                <CompleteClassDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/class/:classId/logs"
            element={
              <ProtectedRoute allowedRoles={['FACULTY', 'HOD']}>
                <ClassLogView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/attendance/session"
            element={
              <ProtectedRoute allowedRoles={['FACULTY', 'HOD']}>
                <AttendanceSessionView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/attendance/verification"
            element={
              <ProtectedRoute allowedRoles={['FACULTY', 'HOD']}>
                <AttendanceSessionView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/live-classroom"
            element={
              <ProtectedRoute allowedRoles={['FACULTY', 'HOD']}>
                <LiveClassroom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/activity/individual"
            element={
              <ProtectedRoute allowedRoles={['FACULTY', 'HOD']}>
                <IndividualActivityView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/activity/comparison"
            element={
              <ProtectedRoute allowedRoles={['FACULTY', 'HOD']}>
                <StudentActivityComparison />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/safety"
            element={
              <ProtectedRoute allowedRoles={['FACULTY', 'HOD']}>
                <SafetyCenter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/account"
            element={
              <ProtectedRoute allowedRoles={['FACULTY', 'HOD']}>
                <AccountView />
              </ProtectedRoute>
            }
          />

          {/* HOD Routes */}
          <Route
            path="/hod/dashboard"
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <HODDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/faculty-overview"
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <AcademicOversightView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/class-overview"
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <AcademicOversightView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/activity-overview"
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <ClassIntelligenceView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/camera-overview"
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <ClassIntelligenceView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/safety"
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <SafetyManagementView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/students"
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <AdministrationView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <AdministrationView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/import"
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <AdministrationView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/account"
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <AccountView />
              </ProtectedRoute>
            }
          />

          {/* Canonical Group Redirects */}
          <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/student/overview" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/student/attendance" element={<Navigate to="/student/attendance/subject-wise" replace />} />
          <Route path="/student/insights" element={<Navigate to="/student/activity" replace />} />

          <Route path="/faculty" element={<Navigate to="/faculty/dashboard" replace />} />
          <Route path="/faculty/overview" element={<Navigate to="/faculty/dashboard" replace />} />
          <Route path="/faculty/attendance" element={<Navigate to="/faculty/attendance/session" replace />} />
          <Route path="/faculty/intelligence" element={<Navigate to="/faculty/live-classroom" replace />} />

          <Route path="/hod" element={<Navigate to="/hod/dashboard" replace />} />
          <Route path="/hod/overview" element={<Navigate to="/hod/dashboard" replace />} />
          <Route path="/hod/academic" element={<Navigate to="/hod/faculty-overview" replace />} />
          <Route path="/hod/intelligence" element={<Navigate to="/hod/camera-overview" replace />} />
          <Route path="/hod/admin" element={<Navigate to="/hod/audit-logs" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
