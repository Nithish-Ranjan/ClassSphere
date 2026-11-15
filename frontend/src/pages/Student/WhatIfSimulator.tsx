import React, { useState, useEffect } from 'react';
import { Calculator, ArrowRight, AlertTriangle, CheckCircle2, TrendingUp, Info, CheckCircle, Calendar } from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { studentApi } from '../../services/api';
import { SubjectAttendance, WhatIfResponse } from '../../types';
import { LoadingState, ErrorState, EmptyState, TabsNav, Card } from '../../components/ui';

export const WhatIfSimulatorView: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectAttendance[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [classesPresent, setClassesPresent] = useState(1);
  const [classesAbsent, setClassesAbsent] = useState(0);
  const [result, setResult] = useState<WhatIfResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const attendanceTabs = [
    { name: 'Subject-wise Attendance', to: '/student/attendance/subject-wise', icon: CheckCircle },
    { name: 'Attendance History', to: '/student/attendance/history', icon: Calendar },
    { name: 'What If Simulator', to: '/student/what-if', icon: Calculator },
  ];

  useEffect(() => {
    studentApi
      .getSubjectWiseAttendance()
      .then((data) => {
        setSubjects(data);
        if (data.length > 0) {
          setSelectedSubjectId(data[0].subject_id);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load courses for simulation.');
        setLoading(false);
      });
  }, []);

  const handleSimulate = async () => {
    if (!selectedSubjectId) return;
    try {
      const res = await studentApi.simulateWhatIf(selectedSubjectId, classesPresent, classesAbsent);
      setResult(res);
    } catch {
      // Keep previous result if any
    }
  };

  useEffect(() => {
    if (selectedSubjectId) {
      handleSimulate();
    }
  }, [selectedSubjectId, classesPresent, classesAbsent]);

  if (loading) {
    return (
      <AppShell pageTitle="What If Attendance Simulator" pageSubtitle="Project potential attendance trajectories without altering official records">
        <TabsNav tabs={attendanceTabs} className="mb-6" />
        <LoadingState label="Initializing academic projection models..." />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell pageTitle="What If Attendance Simulator" pageSubtitle="Project potential attendance trajectories without altering official records">
        <TabsNav tabs={attendanceTabs} className="mb-6" />
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="What If Attendance Simulator" pageSubtitle="Project potential attendance trajectories without altering official records">
      {/* Contextual Tabs */}
      <TabsNav tabs={attendanceTabs} className="mb-6" />

      {/* Advisory Notice */}
      <div className="bg-[#EFF6FF] border border-[#BFDBFE] text-[#183B5B] p-4 sm:p-5 rounded-xl flex items-start gap-3.5 text-xs leading-relaxed">
        <Info className="w-5 h-5 flex-shrink-0 text-teal mt-0.5" />
        <div>
          <span className="font-bold text-[#10233F]">Predictive Modeling Notice:</span> The What If Simulator calculates prospective mathematical projections using verified PostgreSQL attendance records. Executing simulation models will never modify, overwrite, or tamper with your official academic transcripts.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Input Parameters (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 card-elevation space-y-5">
          <div className="flex items-center gap-2 text-teal font-semibold text-xs uppercase tracking-wider">
            <Calculator className="w-4 h-4" />
            <span>Simulation Parameters</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-textPrimary uppercase tracking-wider mb-1.5">
              Select Subject
            </label>
            <select
              value={selectedSubjectId || ''}
              onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
              className="w-full px-3 py-2.5 text-xs rounded-lg border border-slate-300 bg-white outline-none focus:border-teal font-medium"
            >
              {subjects.map((s) => (
                <option key={s.subject_id} value={s.subject_id}>
                  {s.subject_code} — {s.subject_name} ({s.attendance_percentage}%)
                </option>
              ))}
            </select>
          </div>

          {/* Quick presets */}
          <div>
            <label className="block text-xs font-semibold text-textPrimary uppercase tracking-wider mb-2">
              Quick Scenarios
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setClassesPresent(0);
                  setClassesAbsent(1);
                }}
                className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all cursor-pointer ${
                  classesPresent === 0 && classesAbsent === 1
                    ? 'border-brandDanger bg-red-50 text-brandDanger font-semibold'
                    : 'border-slate-200 bg-slate-50 hover:bg-white text-textPrimary'
                }`}
              >
                🔴 Miss Next Class
                <span className="block text-[10px] text-textSecondary font-normal mt-0.5 font-mono">
                  Absent: +1, Present: +0
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setClassesPresent(1);
                  setClassesAbsent(0);
                }}
                className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all cursor-pointer ${
                  classesPresent === 1 && classesAbsent === 0
                    ? 'border-teal bg-[#E6F6F5] text-teal font-semibold'
                    : 'border-slate-200 bg-slate-50 hover:bg-white text-textPrimary'
                }`}
              >
                🟢 Attend Next Class
                <span className="block text-[10px] text-textSecondary font-normal mt-0.5 font-mono">
                  Absent: +0, Present: +1
                </span>
              </button>
            </div>
          </div>

          {/* Custom Sliders */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-brandSuccess">Simulate Classes Attended</span>
                <span className="font-mono text-textPrimary">+{classesPresent} classes</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={classesPresent}
                onChange={(e) => setClassesPresent(Number(e.target.value))}
                className="w-full accent-teal cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-brandDanger">Simulate Classes Missed</span>
                <span className="font-mono text-textPrimary">+{classesAbsent} classes</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={classesAbsent}
                onChange={(e) => setClassesAbsent(Number(e.target.value))}
                className="w-full accent-brandDanger cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Projection Results (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 card-elevation flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-mono text-textSecondary uppercase tracking-wider">
                  Simulation Outcome
                </span>
                <h3 className="text-lg font-bold text-textPrimary mt-0.5">{result?.subject_name}</h3>
              </div>
              {result && (
                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    result.projected_percentage >= 75.0
                      ? 'bg-emerald-50 text-brandSuccess border border-emerald-200'
                      : 'bg-red-50 text-brandDanger border border-red-200'
                  }`}
                >
                  {result.projected_percentage >= 75.0 ? 'Exam Eligible (≥ 75%)' : 'Below 75% Threshold'}
                </div>
              )}
            </div>

            {result ? (
              <div className="mt-6 space-y-6">
                {/* Comparison metric blocks */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-xs text-textSecondary font-medium">Current Attendance</span>
                    <div className="text-3xl font-bold text-textPrimary mt-1 font-mono">
                      {result.current_percentage}%
                    </div>
                    <span className="text-[11px] text-textSecondary mt-0.5 block font-mono">
                      {result.current_attended} of {result.current_conducted} attended
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#E6F6F5] border border-teal/30 text-center">
                    <span className="text-xs text-teal font-semibold">Projected Attendance</span>
                    <div className="text-3xl font-bold text-teal mt-1 font-mono">
                      {result.projected_percentage}%
                    </div>
                    <span className="text-[11px] text-teal mt-0.5 block font-mono">
                      {result.simulated_attended} of {result.simulated_conducted} simulated
                    </span>
                  </div>
                </div>

                {/* Projected Delta indicator */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal" />
                    <span className="text-xs font-semibold text-textPrimary">Projected Delta</span>
                  </div>
                  <span
                    className={`text-sm font-bold font-mono ${
                      result.percentage_delta >= 0 ? 'text-brandSuccess' : 'text-brandDanger'
                    }`}
                  >
                    {result.percentage_delta >= 0 ? `+${result.percentage_delta}%` : `${result.percentage_delta}%`}
                  </span>
                </div>

                {/* Audit & Regulatory Note */}
                <div className="text-xs text-textSecondary p-3.5 rounded-lg bg-slate-50 border border-slate-200 leading-relaxed">
                  <span className="font-semibold text-textPrimary">Institutional Note: </span>
                  {result.simulation_note}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-textSecondary">
                Adjust the sliders or scenarios on the left to compute projected trajectories.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
};
