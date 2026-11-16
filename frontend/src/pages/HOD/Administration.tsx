import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Users,
  FileText,
  ShieldCheck,
  Search,
  Filter,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Database,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { TabsNav } from '../../components/ui/TabsNav';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { hodApi, institutionalImportApi } from '../../services/api';

export const AdministrationView: React.FC = () => {
  const location = useLocation();
  const isStudents = location.pathname.includes('/hod/students');
  const isImport = location.pathname.includes('/hod/import');

  const [students, setStudents] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // CSV Import State
  const [importEntity, setImportEntity] = useState<'STUDENTS' | 'FACULTY' | 'SUBJECTS'>('STUDENTS');
  const [csvContent, setCsvContent] = useState('');
  const [dryRun, setDryRun] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importReport, setImportReport] = useState<any | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);

  const loadData = () => {
    Promise.all([hodApi.getStudents(), hodApi.getAuditLogs()]).then(([st, logs]) => {
      setStudents(st);
      setAuditLogs(logs);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const adminTabs = [
    { name: 'Security Audit Logs', to: '/hod/audit-logs', icon: FileText, badge: auditLogs.length },
    { name: 'Student Directory', to: '/hod/students', icon: Users, badge: students.length },
    { name: 'Institutional CSV Import', to: '/hod/import', icon: UploadCloud },
  ];

  const handleDownloadTemplate = async () => {
    setTemplateLoading(true);
    try {
      const res = await institutionalImportApi.getTemplate(importEntity);
      setCsvContent(res.template_csv);
      setTemplateLoading(false);
    } catch {
      alert('Failed to fetch CSV template');
      setTemplateLoading(false);
    }
  };

  const handleExecuteImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContent.trim()) {
      alert('Please enter or paste valid CSV content');
      return;
    }

    setImportLoading(true);
    setImportReport(null);

    try {
      const res = await institutionalImportApi.importCSV(importEntity, csvContent, dryRun);
      setImportReport(res);
      setImportLoading(false);
      if (!dryRun && res.imported_count > 0) {
        loadData(); // Refresh directory & audit logs
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to process CSV import');
      setImportLoading(false);
    }
  };

  if (loading) {
    return (
      <AppShell pageTitle="Administration & Security" pageSubtitle="Tamper-evident audit logging and department student records">
        <TabsNav tabs={adminTabs} className="mb-6" />
        <LoadingState label="Loading security audit trails and student records..." />
      </AppShell>
    );
  }

  const filteredLogs = auditLogs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.resource.toLowerCase().includes(search.toLowerCase()) ||
      l.user_email.toLowerCase().includes(search.toLowerCase()) ||
      (l.details && l.details.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.section.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell pageTitle="Administration & Governance" pageSubtitle="Institutional data ingestion, student directory, and immutable audit trails">
      <TabsNav tabs={adminTabs} className="mb-6" />

      {/* VIEW 1: INSTITUTIONAL CSV IMPORT */}
      {isImport ? (
        <div className="space-y-6">
          {/* Institutional Data Authenticity Guarantee Banner */}
          <div className="bg-gradient-to-r from-[#2E0854] via-purple-900 to-[#1E1B4B] text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm text-purple-200 flex items-center justify-center flex-shrink-0 border border-white/20">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    DATA CLASSIFICATION: REAL
                  </span>
                  <span className="text-xs text-purple-200 font-mono">Institutional SIS/ERP Ingestion</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">Authorized Institutional Records Importer</h3>
                <p className="text-xs text-purple-100/90 mt-0.5 max-w-2xl leading-relaxed">
                  Import verified student, faculty, and curriculum records. Automatically checks duplicates, enforces schemas, and records an immutable audit log.
                </p>
              </div>
            </div>
          </div>

          {/* Import Setup & Execution Form */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <h4 className="text-base font-bold text-textPrimary">Select Ingestion Entity Type</h4>
                <p className="text-xs text-textSecondary mt-0.5">Choose the institutional data model to validate and import</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(['STUDENTS', 'FACULTY', 'SUBJECTS'] as const).map((entity) => (
                  <button
                    key={entity}
                    type="button"
                    onClick={() => {
                      setImportEntity(entity);
                      setImportReport(null);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      importEntity === entity
                        ? 'bg-purple-900 text-white shadow-sm ring-2 ring-purple-900/20'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {entity}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleExecuteImport} className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <label className="block text-xs font-bold text-textPrimary uppercase tracking-wider">
                  CSV Raw Data / File Ingestion *
                </label>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={templateLoading}
                  className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{templateLoading ? 'Loading Template...' : `Load Official ${importEntity} Sample Template`}</span>
                </button>
              </div>

              <textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder={`Paste standard CSV rows here, e.g.:\nroll_number,full_name,email,section_name,batch_year\nCS24B020,Devansh Nair,devansh.nair@classsphere.edu,Section A,2026-2027`}
                required
                rows={7}
                className="w-full px-4 py-3 text-xs font-mono border border-slate-300 rounded-xl bg-slate-50/50 outline-none focus:border-purple-700 focus:bg-white text-textPrimary leading-relaxed"
              />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={dryRun}
                    onChange={(e) => setDryRun(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-700 focus:ring-purple-600 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-textPrimary">
                    Dry-Run Validation Only (Inspect schema & duplicates without committing to database)
                  </span>
                </label>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCsvContent('');
                      setImportReport(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Clear Input
                  </button>
                  <button
                    type="submit"
                    disabled={importLoading}
                    className="px-5 py-2.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4 text-purple-200" />
                    <span>{importLoading ? 'Validating & Ingesting...' : dryRun ? 'Execute Dry-Run Check' : `Import ${importEntity} into Database`}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Import Results Report Banner & Detail Table */}
          {importReport && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      importReport.error_count > 0 ? 'bg-red-50 text-brandDanger border border-red-200' : 'bg-emerald-50 text-brandSuccess border border-emerald-200'
                    }`}>
                      {importReport.dry_run ? 'DRY-RUN RESULT' : 'DATABASE COMMIT COMPLETE'}
                    </span>
                    {importReport.audit_log_id && (
                      <span className="text-[10px] font-mono text-slate-500">
                        AUDIT LOG ID: #{importReport.audit_log_id}
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-textPrimary mt-1">{importReport.message}</h4>
                </div>
              </div>

              {/* Metrics Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-textSecondary uppercase font-semibold block">Total Processed</span>
                  <span className="text-2xl font-bold font-mono text-textPrimary mt-1 block">{importReport.total_rows_processed}</span>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[11px] text-emerald-800 uppercase font-semibold block">Valid / Imported</span>
                  <span className="text-2xl font-bold font-mono text-brandSuccess mt-1 block">{importReport.imported_count}</span>
                  <span className="text-[10px] font-mono text-emerald-700">Source: REAL</span>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-[11px] text-amber-800 uppercase font-semibold block">Duplicates Skipped</span>
                  <span className="text-2xl font-bold font-mono text-amber-700 mt-1 block">{importReport.duplicate_count}</span>
                </div>
                <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                  <span className="text-[11px] text-red-800 uppercase font-semibold block">Validation Errors</span>
                  <span className="text-2xl font-bold font-mono text-brandDanger mt-1 block">{importReport.error_count}</span>
                </div>
              </div>

              {/* Imported Preview Table */}
              {importReport.imported_preview && importReport.imported_preview.length > 0 && (
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-textPrimary uppercase tracking-wider">
                    Imported Records Preview ({importReport.imported_preview.length})
                  </h5>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Identifier</th>
                          <th className="py-2.5 px-3">Name</th>
                          <th className="py-2.5 px-3">Data Classification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-textPrimary">
                        {importReport.imported_preview.map((rec: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono font-semibold text-textPrimary">{rec.identifier}</td>
                            <td className="py-2 px-3">{rec.name}</td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-brandSuccess border border-emerald-200">
                                {rec.data_source || 'REAL'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Duplicates Detail (if any) */}
              {importReport.duplicates && importReport.duplicates.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Duplicates Detected ({importReport.duplicates.length})</span>
                  </div>
                  <ul className="text-xs text-amber-800 space-y-1 pl-4 list-disc">
                    {importReport.duplicates.map((d: any, i: number) => (
                      <li key={i}>
                        Row {d.row_number}: <span className="font-mono font-semibold">{d.identifier}</span> — {d.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Errors Detail (if any) */}
              {importReport.errors && importReport.errors.length > 0 && (
                <div className="p-4 rounded-xl bg-red-50/60 border border-red-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-900 uppercase">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>Validation Errors ({importReport.errors.length})</span>
                  </div>
                  <ul className="text-xs text-red-800 space-y-1 pl-4 list-disc">
                    {importReport.errors.map((err: any, i: number) => (
                      <li key={i}>
                        Row {err.row_number}: <span className="font-mono font-semibold">{err.identifier}</span> — {err.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ) : !isStudents ? (
        /* VIEW 2: SECURITY AUDIT LOGS */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/60 to-purple-50/20">
            <div>
              <h3 className="font-bold text-textPrimary text-base">Security & Administrative Audit Trail</h3>
              <p className="text-xs text-textSecondary mt-0.5">
                Cryptographically tracked user logins, attendance overrides, CSV imports, and executive safety escalations
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter logs by action, user..."
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white outline-none focus:border-purple-700"
              />
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={FileText}
                title="No audit log records found"
                description="No logged security events match your current filter query."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Resource</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-textPrimary font-mono">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-purple-950">{log.action}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-200/60 text-purple-900 text-[10px] font-semibold">
                          {log.resource}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-textSecondary">{log.user_email}</td>
                      <td className="py-3 px-4 text-textSecondary">{log.ip_address || '127.0.0.1'}</td>
                      <td className="py-3 px-4 font-sans text-textPrimary text-[11px]">{log.details}</td>
                      <td className="py-3 px-4 text-textSecondary text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* VIEW 3: STUDENT DIRECTORY */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/60 to-purple-50/20">
            <div>
              <h3 className="font-bold text-textPrimary text-base">CSE Enrolled Students Directory</h3>
              <p className="text-xs text-textSecondary mt-0.5">Authorized enrolled student profiles from institutional source</p>
            </div>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students by name, roll, section..."
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white outline-none focus:border-purple-700"
              />
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Users}
                title="No students found"
                description="No enrolled students match your search criteria."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Section</th>
                    <th className="py-3 px-4">Batch Year</th>
                    <th className="py-3 px-4">Data Source</th>
                    <th className="py-3 px-4">Account Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-textPrimary">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-textPrimary">
                        {s.name}
                        <span className="block text-[11px] text-textSecondary font-normal">{s.email}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-purple-900 font-semibold">{s.roll_number}</td>
                      <td className="py-3.5 px-4 text-slate-700">{s.section}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{s.batch_year}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          s.data_source === 'REAL'
                            ? 'bg-emerald-50 text-brandSuccess border border-emerald-200'
                            : 'bg-amber-50 text-brandWarning border border-amber-200'
                        }`}>
                          {s.data_source || 'REAL'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status="ACTIVE" />
                      </td>
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
