import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Users, BookOpen, CheckCircle2, Clock, MapPin, Search } from 'lucide-react';
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
        <div className="bg-white rounded-xl border border-mutedBlue card-elevation overflow-hidden">
          <div className="p-5 border-b border-mutedBlue flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                className="w-full px-3 py-2 text-xs border border-mutedBlue rounded-lg bg-surface outline-none focus:border-teal"
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
                <thead className="bg-surface text-textSecondary font-semibold uppercase tracking-wider text-[10px] border-b border-mutedBlue">
                  <tr>
                    <th className="py-3 px-4">Faculty Member</th>
                    <th className="py-3 px-4">Employee ID</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Assigned Subjects</th>
                    <th className="py-3 px-4">Classes Conducted</th>
                    <th className="py-3 px-4">Attendance Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mutedBlue text-textPrimary">
                  {filteredFaculty.map((f) => (
                    <tr key={f.faculty_id} className="hover:bg-surface/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-textPrimary">
                        {f.full_name}
                        <span className="block text-[11px] text-textSecondary font-normal">{f.email}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-textSecondary">{f.employee_id}</td>
                      <td className="py-3.5 px-4">{f.designation}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {f.assigned_subjects?.map((s: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-surface border border-mutedBlue text-[10px] font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-navy">{f.classes_conducted} sessions</td>
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
        <div className="bg-white rounded-xl border border-mutedBlue card-elevation overflow-hidden">
          <div className="p-5 border-b border-mutedBlue flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                className="w-full px-3 py-2 text-xs border border-mutedBlue rounded-lg bg-surface outline-none focus:border-teal"
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
                <thead className="bg-surface text-textSecondary font-semibold uppercase tracking-wider text-[10px] border-b border-mutedBlue">
                  <tr>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Section & Room</th>
                    <th className="py-3 px-4">Faculty In-Charge</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mutedBlue text-textPrimary">
                  {filteredClasses.map((c) => (
                    <tr key={c.session_id} className="hover:bg-surface/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-textPrimary">
                        {c.subject_name}
                        <span className="block text-[11px] font-mono text-textSecondary">{c.subject_code}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {c.section_name} • {c.room_number}
                      </td>
                      <td className="py-3.5 px-4">{c.faculty_name}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[10px] text-textSecondary">{c.mode}</td>
                      <td className="py-3.5 px-4 font-bold text-navy">{c.attendance_pct}%</td>
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
