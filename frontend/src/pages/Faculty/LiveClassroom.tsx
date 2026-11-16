import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Video,
  Smartphone,
  MessageSquare,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  Sliders,
  ShieldAlert,
  Radio,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Users,
  BarChart2,
  Activity,
  Maximize2,
  Eye,
  Filter,
  ShieldCheck,
  Layers,
  Terminal,
  Cpu,
  Info,
} from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { TabsNav } from '../../components/ui/TabsNav';
import { useWebSocket } from '../../hooks/useWebSocket';
import { cameraApi } from '../../services/api';
import { Camera, CameraStreamState } from '../../types';
import { Button, StatusBadge } from '../../components/ui';

export const LiveClassroom: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<number>(1);
  const [streamState, setStreamState] = useState<CameraStreamState | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<'ALL' | 'PHONE' | 'TALKING' | 'SAFETY'>('ALL');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const intelligenceTabs = [
    { name: 'Live Classroom Feed', to: '/faculty/live-classroom', icon: Video },
    { name: 'Individual Activity', to: '/faculty/activity/individual', icon: Users },
    { name: 'Activity Comparison', to: '/faculty/activity/comparison', icon: BarChart2 },
  ];

  const fetchStream = useCallback(() => {
    if (!selectedCameraId) return;
    cameraApi
      .getStreamState(selectedCameraId)
      .then((data) => {
        setStreamState(data);
      })
      .catch(() => {});
  }, [selectedCameraId]);

  const handleWsEvent = useCallback(
    (event: string, data: any) => {
      if (event === 'EVENT_DETECTED' || event === 'CAMERA_MODE_CHANGED') {
        fetchStream();
      } else if (event === 'STUDENT_CHECKIN') {
        setTriggerMessage(`Real-time biometric check-in received: ${data.name} (${data.roll_number})`);
      }
    },
    [fetchStream]
  );

  const { isConnected: isWsConnected } = useWebSocket({
    onEvent: handleWsEvent,
  });

  useEffect(() => {
    cameraApi.listCameras().then((res) => {
      setCameras(res);
      if (res.length > 0) {
        setSelectedCameraId(res[0].id);
      }
    });
  }, []);

  useEffect(() => {
    fetchStream();
    if (!isProcessing) return;

    const interval = setInterval(fetchStream, 2000);
    return () => clearInterval(interval);
  }, [selectedCameraId, isProcessing, fetchStream]);

  // Draw enhanced surveillance and telemetry canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !streamState) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Darkened operations room canvas background
    ctx.fillStyle = '#050D0A';
    ctx.fillRect(0, 0, width, height);

    // Architectural grid / perspective guidelines
    ctx.strokeStyle = '#0E291F';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(0, height * 0.35);
    ctx.lineTo(width, height * 0.35);
    ctx.moveTo(width * 0.15, 0);
    ctx.lineTo(width * 0.15, height);
    ctx.moveTo(width * 0.85, 0);
    ctx.lineTo(width * 0.85, height);
    ctx.moveTo(width * 0.5, height * 0.35);
    ctx.lineTo(width * 0.5, height);
    ctx.stroke();

    // Scale factors from 1280x720 base coordinates
    const scaleX = width / 1280;
    const scaleY = height / 720;

    // Draw person bounding boxes
    streamState.persons?.forEach((p) => {
      const bx = p.x * scaleX;
      const by = p.y * scaleY;
      const bw = p.width * scaleX;
      const bh = p.height * scaleY;

      // Box outline
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(bx, by, bw, bh);

      // Label background
      ctx.fillStyle = 'rgba(6, 78, 59, 0.85)';
      ctx.fillRect(bx, by - 16, Math.max(bw, 74), 16);

      // Label text
      ctx.fillStyle = '#ECFDF5';
      ctx.font = 'bold 9px monospace';
      const label = p.roll_number ? `${p.roll_number}` : `Person ${(p.confidence * 100).toFixed(0)}%`;
      ctx.fillText(label, bx + 4, by - 4);
    });

    // Draw active event overlays
    streamState.active_events?.forEach((ev) => {
      if (ev.box) {
        const ex = ev.box.x * scaleX;
        const ey = ev.box.y * scaleY;
        const ew = ev.box.width * scaleX;
        const eh = ev.box.height * scaleY;

        ctx.lineWidth = 2.4;
        if (ev.type === 'PHONE_USAGE') {
          ctx.strokeStyle = '#F59E0B';
          ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
        } else if (ev.type === 'TALKING') {
          ctx.strokeStyle = '#10B981';
          ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
        } else {
          ctx.strokeStyle = '#EF4444';
          ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        }
        ctx.fillRect(ex, ey, ew, eh);
        ctx.strokeRect(ex, ey, ew, eh);

        // Event banner on box
        ctx.fillStyle =
          ev.type === 'PHONE_USAGE' ? '#D97706' : ev.type === 'TALKING' ? '#059669' : '#DC2626';
        ctx.fillRect(ex, ey + eh, Math.max(ew, 84), 15);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 8px Inter, sans-serif';
        ctx.fillText(ev.type.replace('_', ' '), ex + 4, ey + eh + 11);
      }
    });

    // Top-left Unequivocal Mode Watermark
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(12, 12, 340, 26);
    ctx.fillStyle = streamState.mode === 'SIMULATION' ? '#FBBF24' : '#34D399';
    ctx.font = 'bold 10px monospace';
    const watermarkText =
      streamState.mode === 'SIMULATION'
        ? '[SIMULATION MODE — DEMO SYNTHETIC TELEMETRY]'
        : '[CONNECTED CCTV — RTSP HARDWARE INGESTION]';
    ctx.fillText(watermarkText, 20, 29);

    // Top-right Live Timestamp HUD
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(width - 150, 12, 138, 26);
    ctx.fillStyle = '#6EE7B7';
    ctx.font = '10px monospace';
    ctx.fillText(new Date().toLocaleTimeString(), width - 140, 29);
  }, [streamState]);

  const handleToggleMode = async () => {
    try {
      const res = await cameraApi.toggleMode(selectedCameraId);
      setTriggerMessage(res.message);
      fetchStream();
    } catch {
      alert('Failed to toggle camera mode');
    }
  };

  const handleTriggerSimulated = async (eventType: string) => {
    try {
      const res = await cameraApi.triggerSimulatedEvent(selectedCameraId, eventType);
      setTriggerMessage(`Simulated ${eventType} injected into feed telemetry!`);
      fetchStream();
    } catch {
      alert('Failed to trigger simulated event');
    }
  };

  const filteredEvents = streamState?.active_events?.filter((ev) => {
    if (eventFilter === 'ALL') return true;
    if (eventFilter === 'PHONE') return ev.type === 'PHONE_USAGE';
    if (eventFilter === 'TALKING') return ev.type === 'TALKING';
    if (eventFilter === 'SAFETY') return ev.type === 'SUDDEN_FALL';
    return true;
  });

  return (
    <AppShell
      pageTitle="Centralized CCTV Operations Console"
      pageSubtitle="Emerald Studio: Multi-site camera streams, real-time spatial inference, and event verification"
    >
      {/* Contextual Tabs */}
      <TabsNav tabs={intelligenceTabs} className="mb-6" />

      {/* Top Command Bar */}
      <div className="bg-white rounded-2xl border border-emerald-200/80 p-5 sm:p-6 card-elevation flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Select Monitored Camera
            </label>
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(Number(e.target.value))}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 cursor-pointer"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.room_number}) — {c.mode}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 sm:pt-0 border-l border-slate-200 pl-5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Stream Telemetry
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                <span>{streamState?.stream_health || 'HEALTHY'}</span>
              </span>
              <span className="text-xs font-mono text-slate-600 font-medium">
                {streamState?.fps || 24} FPS • {streamState?.diagnostics?.latency_ms || 18}ms
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isWsConnected
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isWsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                <span>{isWsConnected ? 'WS LIVE' : 'WS OFFLINE'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsProcessing(!isProcessing)}
            leftIcon={isProcessing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          >
            {isProcessing ? 'Pause Stream' : 'Resume Stream'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleToggleMode}
            leftIcon={<Sliders className="w-3.5 h-3.5" />}
            className="bg-emerald-700 hover:bg-emerald-800"
          >
            Switch Ingestion Mode
          </Button>
        </div>
      </div>

      {triggerMessage && (
        <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2.5 font-medium animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{triggerMessage}</span>
        </div>
      )}

      {/* Main Monitoring Center (12 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Large Central Classroom Feed (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-[#050D0A] rounded-2xl overflow-hidden border border-emerald-900/60 shadow-xl relative flex flex-col justify-between">
            {/* Top In-Feed HUD Bar */}
            <div className="bg-[#0A1612]/95 backdrop-blur-md px-5 py-3 flex items-center justify-between text-white text-xs border-b border-emerald-800/40 z-10">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold tracking-wide text-emerald-100">
                  {streamState?.camera_name || 'Room A-101 Cam'}
                </span>
                <span className="text-emerald-300/60 font-mono text-[11px]">
                  • {streamState?.resolution || '1280x720'}
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] text-emerald-300">
                <span>Inference: YOLOv8 Spatial</span>
                <span>•</span>
                <span className="text-white font-bold">{streamState?.persons_count || 0} Persons Tracked</span>
              </div>
            </div>

            {/* Canvas Viewport */}
            <div className="relative w-full aspect-video bg-black flex items-center justify-center">
              <canvas ref={canvasRef} width={854} height={480} className="w-full h-full object-contain" />
            </div>

            {/* Bottom In-Feed Diagnostics Strip */}
            <div className="bg-[#0A1612] px-5 py-2.5 text-[11px] font-mono text-emerald-200/70 flex flex-wrap items-center justify-between border-t border-emerald-800/40 gap-2">
              <span>Codec: {streamState?.diagnostics?.encoding || 'H.264'}</span>
              <span className="font-bold text-amber-300">
                {streamState?.mode === 'SIMULATION'
                  ? 'DEMONSTRATION SYNTHETIC TELEMETRY'
                  : 'CONNECTED HARDWARE RTSP'}
              </span>
              <span>Packet Loss: {streamState?.diagnostics?.packet_loss_pct || 0}%</span>
            </div>
          </div>

          {/* Session Timeline Scrubber (FR-10) */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 card-elevation space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>50-Minute Class Session Event Timeline</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Chronological event distribution across lecture period
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                09:00 AM - 09:50 AM
              </span>
            </div>

            {/* Timeline density track */}
            <div className="relative h-7 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex items-center px-2">
              <div
                className="absolute left-[12%] w-2.5 h-4 bg-amber-500 rounded-xs"
                title="09:06 AM: Phone handling detected"
              />
              <div
                className="absolute left-[28%] w-3.5 h-4 bg-emerald-600 rounded-xs"
                title="09:14 AM: Talking motion cluster"
              />
              <div
                className="absolute left-[45%] w-2.5 h-4 bg-amber-500 rounded-xs"
                title="09:22 AM: Phone handling detected"
              />
              <div
                className="absolute left-[70%] w-4 h-4 bg-emerald-600 rounded-xs"
                title="09:35 AM: Group discussion"
              />
              <div
                className="absolute left-[85%] w-1.5 h-5 bg-teal-500 animate-pulse rounded-xs"
                title="Current playhead"
              />
            </div>

            <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1">
              <span>09:00 (Start)</span>
              <span>09:15</span>
              <span>09:30 (Mid-term)</span>
              <span>09:45</span>
              <span>09:50 (Dismissal)</span>
            </div>
          </div>
        </div>

        {/* Secondary Right Panel: Live Detection Events & Simulator (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Active Events Feed */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 card-elevation space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-bold text-slate-900 text-sm">Detection Events Stream</h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                {filteredEvents?.length || 0} active
              </span>
            </div>

            {/* Event Filter Pills */}
            <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold">
              {(['ALL', 'PHONE', 'TALKING', 'SAFETY'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setEventFilter(filter)}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    eventFilter === filter
                      ? 'bg-emerald-700 text-white shadow-xs font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Event List */}
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {!filteredEvents || filteredEvents.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  No active detections matching filter in current frame.
                </div>
              ) : (
                filteredEvents.map((ev, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-2 hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5 text-slate-900">
                        {ev.type === 'PHONE_USAGE' ? (
                          <Smartphone className="w-4 h-4 text-amber-500" />
                        ) : ev.type === 'TALKING' ? (
                          <MessageSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                        )}
                        <span>{ev.type.replace('_', ' ')}</span>
                      </span>
                      <span className="font-mono text-emerald-700 font-bold text-[11px]">
                        {(ev.confidence * 100).toFixed(0)}% conf
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>Target: <strong className="text-slate-700">{ev.roll_number || 'Candidate'}</strong></span>
                      <span className="font-mono">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Synthetic Event Ingestion Simulator (Test Telemetry Only) */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 card-elevation space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Simulated Ingestion</span>
              </span>
              <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300">
                Evaluator Tool
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Inject telemetry signals into the inference pipeline to evaluate live review and WebSocket alerts:
            </p>
            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleTriggerSimulated('PHONE_USAGE')}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-800 text-xs font-semibold flex items-center justify-between transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-500" />
                  <span>Simulate Phone Usage</span>
                </span>
                <span className="text-[10px] text-amber-700 font-bold">+ Inject</span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerSimulated('TALKING')}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-800 text-xs font-semibold flex items-center justify-between transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>Simulate Talking Motion</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-bold">+ Inject</span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerSimulated('SUDDEN_FALL')}
                className="w-full py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-between transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Simulate Fall Incident</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-rose-700">+ Alert</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
