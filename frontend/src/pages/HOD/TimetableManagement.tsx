import React, { useState, useEffect } from 'react';
import {
  Calendar,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  ArrowRight,
  RefreshCw,
  Clock,
  MapPin,
  UserCheck,
  BookOpen,
  Sparkles,
  History,
  Layers,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { TabsNav } from '../../components/ui/TabsNav';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { timetableApi } from '../../services/api';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TimetableManagementView: React.FC = () => {
  // Navigation tabs for Academic Oversight
  const oversightTabs = [
    { name: 'Faculty Workload & Overview', to: '/hod/faculty-overview' },
    { name: 'Class Sessions Directory', to: '/hod/class-overview' },
    { name: 'Timetable Management & Publication', to: '/hod/timetable', icon: Calendar },
  ];

  // Selection states
  const [selectedDeptId, setSelectedDeptId] = useState<number>(1);
  const [academicYear, setAcademicYear] = useState<string>('2026-2027');
  const [semester, setSemester] = useState<number>(6);
  const [selectedSectionId, setSelectedSectionId] = useState<number>(1);

  // Catalogs
  const [catalogs, setCatalogs] = useState<{
    departments: any[];
    sections: any[];
    subjects: any[];
    faculty: any[];
    rooms: any[];
  } | null>(null);

  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  // Active published timetable & version history
  const [activeTimetable, setActiveTimetable] = useState<any | null>(null);
  const [loadingActiveTimetable, setLoadingActiveTimetable] = useState(false);

  // Upload & parse states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pasteCsvText, setPasteCsvText] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any | null>(null);

  // Interactive entity mappings
  const [subjectMappings, setSubjectMappings] = useState<Record<string, number | null>>({});
  const [facultyMappings, setFacultyMappings] = useState<Record<string, number | null>>({});
  const [roomMappings, setRoomMappings] = useState<Record<string, string | null>>({});

  // Validation results
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any | null>(null);

  // Publication state
  const [publishNotes, setPublishNotes] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccessMessage, setPublishSuccessMessage] = useState<string | null>(null);

  // Step tracker (1: Setup & Upload, 2: Mapping & Review, 3: Validation & Publish)
  const [activeStep, setActiveStep] = useState<number>(1);

  // Load catalogs on mount
  useEffect(() => {
    loadCatalogs();
  }, [selectedDeptId]);

  // Load section timetable when section changes
  useEffect(() => {
    if (selectedSectionId) {
      loadSectionTimetable(selectedSectionId);
    }
  }, [selectedSectionId]);

  const loadCatalogs = async () => {
    setLoadingCatalogs(true);
    try {
      const data = await timetableApi.getCatalogs(selectedDeptId);
      setCatalogs(data);
      if (data.sections?.length > 0 && !selectedSectionId) {
        setSelectedSectionId(data.sections[0].id);
      }
    } catch (err) {
      console.error('Failed to load timetable catalogs', err);
    } finally {
      setLoadingCatalogs(false);
    }
  };

  const loadSectionTimetable = async (secId: number) => {
    setLoadingActiveTimetable(true);
    try {
      const data = await timetableApi.getSectionTimetable(secId);
      setActiveTimetable(data);
    } catch (err) {
      console.error('Failed to load section timetable', err);
    } finally {
      setLoadingActiveTimetable(false);
    }
  };

  // Download official CSV template
  const handleDownloadTemplate = async () => {
    try {
      const res = await timetableApi.getTemplate();
      const blob = new Blob([res.template_csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', res.filename || 'ClassSphere_Timetable_Template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to download timetable template.');
    }
  };

  // Parse file or text
  const handleParseTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile && !pasteCsvText.trim()) {
      alert('Please upload a CSV/XLSX file or paste CSV content.');
      return;
    }

    setIsParsing(true);
    setParsedData(null);
    setValidationResult(null);
    setPublishSuccessMessage(null);

    try {
      const formData = new FormData();
      if (uploadedFile) {
        formData.append('file', uploadedFile);
      } else {
        formData.append('csv_text', pasteCsvText);
      }
      formData.append('department_id', selectedDeptId.toString());

      const res = await timetableApi.parseTimetable(formData);
      setParsedData(res);
      setSubjectMappings(res.suggested_mappings.subject_mappings || {});
      setFacultyMappings(res.suggested_mappings.faculty_mappings || {});
      setRoomMappings(res.suggested_mappings.room_mappings || {});
      setActiveStep(2); // advance to mapping preview
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to parse timetable file.');
    } finally {
      setIsParsing(false);
    }
  };

  // Run validation
  const handleRunValidation = async () => {
    if (!parsedData) return;

    setIsValidating(true);
    setValidationResult(null);

    try {
      const payload = {
        department_id: selectedDeptId,
        section_id: selectedSectionId,
        academic_year: academicYear,
        semester: semester,
        raw_entries: parsedData.raw_entries,
        mappings: {
          subject_mappings: subjectMappings,
          faculty_mappings: facultyMappings,
          room_mappings: roomMappings,
        },
      };

      const res = await timetableApi.validateTimetable(payload);
      setValidationResult(res);
      setActiveStep(3); // advance to validation results
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Validation failed.');
    } finally {
      setIsValidating(false);
    }
  };

  // Publish timetable
  const handlePublishTimetable = async () => {
    if (!validationResult || !validationResult.is_valid) {
      alert('Cannot publish a timetable with unresolved validation errors.');
      return;
    }

    setIsPublishing(true);
    setPublishSuccessMessage(null);

    try {
      const payload = {
        department_id: selectedDeptId,
        section_id: selectedSectionId,
        academic_year: academicYear,
        semester: semester,
        entries: validationResult.preview_rows,
        notes: publishNotes || `Approved timetable for Section ${selectedSectionId}`,
      };

      const res = await timetableApi.publishTimetable(payload);
      setPublishSuccessMessage(
        `Successfully published Timetable v${res.version_number}! Derived ${res.derived_sessions_count} class sessions for the upcoming week.`
      );
      // Reload active section timetable
      loadSectionTimetable(selectedSectionId);
      // Reset upload flow
      setParsedData(null);
      setValidationResult(null);
      setUploadedFile(null);
      setPasteCsvText('');
      setActiveStep(1);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to publish timetable.');
    } finally {
      setIsPublishing(false);
    }
  };

  if (loadingCatalogs) {
    return (
      <AppShell
        pageTitle="Timetable Management"
        pageSubtitle="Executive Plum: Institutional timetable upload, conflict detection, and schedule derivation"
      >
        <TabsNav tabs={oversightTabs} className="mb-6" />
        <LoadingState label="Loading departmental curriculum catalogs and room registries..." />
      </AppShell>
    );
  }

  return (
    <AppShell
      pageTitle="Timetable Management & Publication"
      pageSubtitle="Executive Plum: Departmental timetable authoring, multi-layer conflict detection, and automated schedule derivation"
    >
      <TabsNav tabs={oversightTabs} className="mb-6" />

      {/* Header Notification Banner if Published */}
      {publishSuccessMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-xs sm:text-sm font-semibold">{publishSuccessMessage}</p>
          </div>
          <button
            onClick={() => setPublishSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2-Column Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Timetable Upload & Conflict Detection Wizard (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Wizard Card */}
          <div className="bg-white rounded-2xl border border-purple-200/80 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-purple-100 bg-gradient-to-r from-purple-50/60 via-slate-50/40 to-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200">
                  HOD TIMETABLE AUTHORING PIPELINE
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Institutional Timetable Ingestion</h3>
              </div>

              {/* Step indicator pills */}
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((step) => (
                  <button
                    key={step}
                    onClick={() => {
                      if (step === 1 || (step === 2 && parsedData) || (step === 3 && validationResult)) {
                        setActiveStep(step);
                      }
                    }}
                    className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                      activeStep === step
                        ? 'bg-purple-800 text-white shadow-sm ring-2 ring-purple-600/30'
                        : step < activeStep
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {step}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-6">
              {/* STEP 1: Institutional Parameters & File Upload */}
              {activeStep === 1 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Department
                      </label>
                      <select
                        value={selectedDeptId}
                        onChange={(e) => setSelectedDeptId(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:border-purple-700 outline-none"
                      >
                        {catalogs?.departments?.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.code} - {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Academic Year
                      </label>
                      <input
                        type="text"
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        placeholder="2026-2027"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:border-purple-700 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Semester
                      </label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:border-purple-700 outline-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>
                            Semester {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Section
                      </label>
                      <select
                        value={selectedSectionId}
                        onChange={(e) => setSelectedSectionId(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:border-purple-700 outline-none font-semibold text-purple-900"
                      >
                        {catalogs?.sections?.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} (Sem {s.semester})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Upload Dropzone */}
                  <div className="border-2 border-dashed border-purple-200 rounded-2xl p-6 text-center hover:bg-purple-50/20 transition-colors">
                    <input
                      type="file"
                      id="timetable-file-input"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setUploadedFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <label htmlFor="timetable-file-input" className="cursor-pointer block space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 mx-auto flex items-center justify-center">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        {uploadedFile ? uploadedFile.name : 'Click to upload Timetable CSV or Excel (.xlsx)'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Supports standard institutional tabular schemas with subject, faculty, room, and day/times
                      </p>
                    </label>
                  </div>

                  {/* Or Paste CSV text */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Or Paste Raw Timetable CSV
                      </label>
                      <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Standard Template</span>
                      </button>
                    </div>
                    <textarea
                      value={pasteCsvText}
                      onChange={(e) => setPasteCsvText(e.target.value)}
                      rows={5}
                      placeholder="academic_year,semester,department,section,day,start_time,end_time,subject,faculty,room&#10;2026-2027,6,CSE,Section A,Monday,09:30,10:30,CS301,Dr. Ramesh Kulkarni,Hall A-101"
                      className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:border-purple-700 outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleParseTimetable}
                    disabled={isParsing}
                    className="w-full py-2.5 rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                  >
                    {isParsing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Parsing Timetable Data...</span>
                      </>
                    ) : (
                      <>
                        <span>Ingest & Preview Timetable Schema</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* STEP 2: Entity Mapping & Catalog Resolution */}
              {activeStep === 2 && parsedData && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Entity Mapping & Disambiguation</h4>
                      <p className="text-xs text-slate-500">
                        Map ingested timetable strings to authoritative curriculum subjects, faculty profiles, and rooms.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-purple-50 text-purple-800 border border-purple-200">
                      {parsedData.total_parsed_rows} Periods Ingested
                    </span>
                  </div>

                  {/* Mapping Cards */}
                  <div className="space-y-4">
                    {/* Subject Mappings */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-purple-700" />
                        <span>Subject Records Mapping</span>
                      </h5>
                      <div className="space-y-2">
                        {Object.keys(subjectMappings).map((raw) => (
                          <div key={raw} className="flex items-center justify-between gap-3 text-xs">
                            <span className="font-mono bg-white px-2.5 py-1 rounded border border-slate-200 text-slate-800 font-semibold min-w-[120px]">
                              {raw}
                            </span>
                            <span className="text-slate-400">→</span>
                            <select
                              value={subjectMappings[raw] || ''}
                              onChange={(e) =>
                                setSubjectMappings({
                                  ...subjectMappings,
                                  [raw]: e.target.value ? Number(e.target.value) : null,
                                })
                              }
                              className={`flex-1 px-3 py-1.5 text-xs rounded-lg border outline-none font-medium ${
                                subjectMappings[raw]
                                  ? 'border-emerald-300 bg-emerald-50/50 text-emerald-900'
                                  : 'border-rose-300 bg-rose-50/50 text-rose-900'
                              }`}
                            >
                              <option value="">-- Unmapped Subject (Action Required) --</option>
                              {catalogs?.subjects?.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.code} - {s.name} ({s.credits} Credits)
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Faculty Mappings */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-purple-700" />
                        <span>Faculty Profile Mapping</span>
                      </h5>
                      <div className="space-y-2">
                        {Object.keys(facultyMappings).map((raw) => (
                          <div key={raw} className="flex items-center justify-between gap-3 text-xs">
                            <span className="font-mono bg-white px-2.5 py-1 rounded border border-slate-200 text-slate-800 font-semibold min-w-[120px]">
                              {raw}
                            </span>
                            <span className="text-slate-400">→</span>
                            <select
                              value={facultyMappings[raw] || ''}
                              onChange={(e) =>
                                setFacultyMappings({
                                  ...facultyMappings,
                                  [raw]: e.target.value ? Number(e.target.value) : null,
                                })
                              }
                              className={`flex-1 px-3 py-1.5 text-xs rounded-lg border outline-none font-medium ${
                                facultyMappings[raw]
                                  ? 'border-emerald-300 bg-emerald-50/50 text-emerald-900'
                                  : 'border-rose-300 bg-rose-50/50 text-rose-900'
                              }`}
                            >
                              <option value="">-- Unmapped Faculty (Action Required) --</option>
                              {catalogs?.faculty?.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.name} ({f.employee_id} • {f.designation})
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Room Mappings */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-purple-700" />
                        <span>Authorized Room Mapping</span>
                      </h5>
                      <div className="space-y-2">
                        {Object.keys(roomMappings).map((raw) => (
                          <div key={raw} className="flex items-center justify-between gap-3 text-xs">
                            <span className="font-mono bg-white px-2.5 py-1 rounded border border-slate-200 text-slate-800 font-semibold min-w-[120px]">
                              {raw}
                            </span>
                            <span className="text-slate-400">→</span>
                            <select
                              value={roomMappings[raw] || ''}
                              onChange={(e) =>
                                setRoomMappings({
                                  ...roomMappings,
                                  [raw]: e.target.value || null,
                                })
                              }
                              className={`flex-1 px-3 py-1.5 text-xs rounded-lg border outline-none font-medium ${
                                roomMappings[raw]
                                  ? 'border-emerald-300 bg-emerald-50/50 text-emerald-900'
                                  : 'border-rose-300 bg-rose-50/50 text-rose-900'
                              }`}
                            >
                              <option value="">-- Unmapped Room (Action Required) --</option>
                              {catalogs?.rooms?.map((r) => (
                                <option key={r.id} value={r.room_number}>
                                  {r.room_number} ({r.building} • Cap: {r.capacity})
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveStep(1)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                    >
                      ← Back to Upload
                    </button>
                    <button
                      type="button"
                      onClick={handleRunValidation}
                      disabled={isValidating}
                      className="px-5 py-2.5 rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {isValidating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Checking Conflicts...</span>
                        </>
                      ) : (
                        <>
                          <span>Execute Multi-Layer Conflict Detection</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Conflict Validation Results & Approval */}
              {activeStep === 3 && validationResult && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Institutional Conflict Detection Report</h4>
                      <p className="text-xs text-slate-500">
                        Overlap checks across faculty, rooms, sections, and operating hours
                      </p>
                    </div>
                    {validationResult.is_valid ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>ZERO CONFLICTS • APPROVED FOR PUBLISH</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>{validationResult.error_count} CONFLICTS DETECTED</span>
                      </span>
                    )}
                  </div>

                  {/* Conflicts Breakdown */}
                  {validationResult.conflicts?.length > 0 && (
                    <div className="space-y-2">
                      {validationResult.conflicts.map((conf: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 border ${
                            conf.severity === 'ERROR'
                              ? 'bg-rose-50 border-rose-200 text-rose-900'
                              : 'bg-amber-50 border-amber-200 text-amber-900'
                          }`}
                        >
                          {conf.severity === 'ERROR' ? (
                            <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className="font-bold font-mono mr-1.5">[{conf.type}]</span>
                            <span>{conf.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Preview of Validated Rows */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-xs font-bold text-slate-700">
                      Validated Weekly Periods Preview
                    </div>
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
                      {validationResult.preview_rows?.map((row: any, idx: number) => (
                        <div
                          key={idx}
                          className={`px-4 py-2.5 flex items-center justify-between gap-3 ${
                            row.has_error ? 'bg-rose-50/50' : 'hover:bg-slate-50/60'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{row.day_name}</span>
                              <span className="font-mono text-slate-600">
                                {row.start_time} - {row.end_time}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {row.subject_code} • {row.faculty_name} • Room {row.room_number}
                            </p>
                          </div>
                          <div>
                            {row.has_error ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                                Conflict
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                Valid
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Publication Form */}
                  {validationResult.is_valid && (
                    <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 space-y-3">
                      <label className="block text-xs font-bold text-purple-950">
                        Publication Notes & Institutional Version Tag
                      </label>
                      <input
                        type="text"
                        value={publishNotes}
                        onChange={(e) => setPublishNotes(e.target.value)}
                        placeholder="e.g., Approved Spring 2026 Timetable Revision 1 after faculty review"
                        className="w-full text-xs px-3.5 py-2 border border-purple-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-700/20 outline-none"
                      />
                      <p className="text-[11px] text-purple-900/80">
                        Publishing will archive previous timetable versions for Section {selectedSectionId} and automatically derive upcoming class sessions, student schedules, and faculty timetables.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                    >
                      ← Refine Mappings
                    </button>
                    {validationResult.is_valid ? (
                      <button
                        type="button"
                        onClick={handlePublishTimetable}
                        disabled={isPublishing}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-700/20 disabled:opacity-50"
                      >
                        {isPublishing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Publishing Approved Timetable...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Publish Approved Institutional Timetable</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveStep(2)}
                        className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                      >
                        Resolve {validationResult.error_count} Blocking Errors
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Published Timetable & Version History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Published Timetable Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  CURRENTLY ACTIVE
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">Section Timetable Matrix</h3>
              </div>
              {activeTimetable && (
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                  v{activeTimetable.active_version}
                </span>
              )}
            </div>

            {loadingActiveTimetable ? (
              <div className="p-8">
                <LoadingState label="Loading section schedule..." />
              </div>
            ) : !activeTimetable || activeTimetable.periods?.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={Calendar}
                  title="No Published Timetable"
                  description="Upload and publish an institutional timetable to activate class sessions."
                />
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                  <span>{activeTimetable.notes}</span>
                  <span>{activeTimetable.periods.length} Periods</span>
                </div>

                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {DAY_NAMES.map((dayName, dayIdx) => {
                    const dayPeriods = activeTimetable.periods.filter(
                      (p: any) => p.day_of_week === dayIdx
                    );
                    if (dayPeriods.length === 0) return null;

                    return (
                      <div key={dayName} className="rounded-xl border border-slate-200/80 p-3 bg-slate-50/50">
                        <div className="text-xs font-bold text-purple-950 mb-2 flex items-center justify-between">
                          <span>{dayName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {dayPeriods.length} Class{dayPeriods.length > 1 ? 'es' : ''}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {dayPeriods.map((p: any) => (
                            <div
                              key={p.id}
                              className="p-2 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between"
                            >
                              <div>
                                <span className="font-bold text-slate-900">{p.subject_code}</span>
                                <span className="text-slate-500 ml-1.5 text-[11px]">{p.faculty_name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600">
                                <span>{p.start_time} - {p.end_time}</span>
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                  {p.room_number}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Version History & Audit Trail */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <History className="w-4 h-4 text-purple-700" />
                <span>Timetable Version History</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">AUDITABLE</span>
            </h4>

            {activeTimetable?.version_history?.length > 0 ? (
              <div className="space-y-2.5 max-h-48 overflow-y-auto">
                {activeTimetable.version_history.map((hist: any) => (
                  <div
                    key={hist.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-purple-900 font-mono">v{hist.version_number}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            hist.status === 'PUBLISHED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {hist.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-[220px]">
                        {hist.notes || 'Curriculum Schedule'}
                      </p>
                    </div>
                    <div className="text-right text-[10px] text-slate-400 font-mono">
                      <p>{hist.created_by}</p>
                      <p>{hist.published_at ? new Date(hist.published_at).toLocaleDateString() : 'Draft'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No previous versions on record.</p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
};
