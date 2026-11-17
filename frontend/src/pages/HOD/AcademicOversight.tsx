import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Users, BookOpen, CheckCircle2, Clock, MapPin, Search, Calendar } from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { TabsNav } from '../../components/ui/TabsNav';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { hodApi } from '../../services/api';

export const AcademicOversightView: React.FC = () => {
  const location = useLocation();
  const isClasses = location.pathname.includes('/hod/class-overview');

  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [classList, setClassList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([hodApi.getFacultyOverview(), hodApi.getClassOverview()]).then(([f, c]) => {
      setFacultyList(f);
      setClassList(c);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const academicTabs = [
    { name: 'Faculty Workload & Overview', to: '/hod/faculty-overview', icon: Users, badge: facultyList.length },
    { name: 'Class Sessions Directory', to: '/hod/class-overview', icon: BookOpen, badge: classList.length },
    { name: 'Timetable Management', to: '/hod/timetable', icon: Calendar },
  ];

  if (loading) {
    return (
      <AppShell pageTitle="Academic Oversight" pageSubtitle="Faculty workload and class performance">
        <TabsNav tabs={academicTabs} className="mb-6" />
        <LoadingState label="Loading departmental faculty profiles and class schedules..." />
      </AppShell>
    );
  }

  const filteredFaculty = facultyList.filter(
    (f) =>
      f.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.employee_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClasses = classList.filter(
    (c) =>
      c.subject_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.faculty_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.room_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell pageTitle="Academic Oversight" pageSubtitle="Departmental faculty summaries, class schedules, and attendance compliance">
      {/* Contextual Tabs */}
      <TabsNav tabs={academicTabs} className="mb-6" />

      {!isClasses ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/60 to-purple-50/20">
            <div>
              <h3 className="font-bold text-textPrimary text-base">Department Faculty Members</h3>
              <p className="text-xs text-textSecondary mt-0.5">Assigned subjects, class execution, and attendance finalization compliance</p>
            </div>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search faculty name or ID..."
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white outline-none focus:border-purple-700 focus:ring-2 focus:ring-purple-700/10"
              />
            </div>
          </div>

          {filteredFaculty.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Users}
                title="No faculty records match"
                description="Try refining your search keyword."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Faculty Member</th>
                    <th className="py-3 px-4">Employee ID</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Assigned Subjects</th>
                    <th className="py-3 px-4">Classes Conducted</th>
                    <th className="py-3 px-4">Attendance Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-textPrimary">
                  {filteredFaculty.map((f) => (
                    <tr key={f.faculty_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-textPrimary">
                        {f.full_name}
                        <span className="block text-[11px] text-textSecondary font-normal">{f.email}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-purple-900 font-semibold">{f.employee_id}</td>
                      <td className="py-3.5 px-4 text-slate-700">{f.designation}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {f.assigned_subjects?.map((s: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200/60 text-purple-900 text-[10px] font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">{f.classes_conducted} sessions</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-brandSuccess">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{f.attendance_compliance_pct}% on-time</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/60 to-purple-50/20">
            <div>
              <h3 className="font-bold text-textPrimary text-base">Class Sessions Directory</h3>
              <p className="text-xs text-textSecondary mt-0.5">Real-time attendance rates, room assignments, and execution state</p>
            </div>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subject, faculty, room..."
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white outline-none focus:border-purple-700 focus:ring-2 focus:ring-purple-700/10"
              />
            </div>
          </div>

          {filteredClasses.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={BookOpen}
                title="No class sessions match"
                description="Try refining your search keyword."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Section & Room</th>
                    <th className="py-3 px-4">Faculty In-Charge</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-textPrimary">
                  {filteredClasses.map((c) => (
                    <tr key={c.session_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-textPrimary">
                        {c.subject_name}
                        <span className="block text-[11px] font-mono text-purple-900 font-semibold">{c.subject_code}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {c.section_name} • {c.room_number}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">{c.faculty_name}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                          {c.mode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-purple-950 font-mono">{c.attendance_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
};
