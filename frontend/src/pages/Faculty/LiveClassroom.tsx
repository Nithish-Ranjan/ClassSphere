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
  Shield,
  Layers,
} from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { TabsNav } from '../../components/ui/TabsNav';
import { useWebSocket } from '../../hooks/useWebSocket';
import { cameraApi } from '../../services/api';
import { Camera, CameraStreamState } from '../../types';

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
    cameraApi.getStreamState(selectedCameraId).then((data) => {
      setStreamState(data);
    }).catch(() => {});
  }, [selectedCameraId]);

  const handleWsEvent = useCallback((event: string, data: any) => {
    if (event === 'EVENT_DETECTED' || event === 'CAMERA_MODE_CHANGED') {
      fetchStream();
    } else if (event === 'STUDENT_CHECKIN') {
      setTriggerMessage(`Live WebSocket check-in: ${data.name} (${data.roll_number})`);
    }
  }, [fetchStream]);

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

  // Draw simulated or connected CCTV perspective onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !streamState) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background: Darkened institutional surveillance perspective
    ctx.fillStyle = '#0B1321';
    ctx.fillRect(0, 0, width, height);

    // Architectural grid / perspective guidelines
    ctx.strokeStyle = '#18273E';
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

    // Scale factors from 1280x720 coordinates
    const scaleX = width / 1280;
    const scaleY = height / 720;

    // Draw person bounding boxes
    streamState.persons?.forEach((p) => {
      const bx = p.x * scaleX;
      const by = p.y * scaleY;
      const bw = p.width * scaleX;
      const bh = p.height * scaleY;

      // Box
      ctx.strokeStyle = '#159A91';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(bx, by, bw, bh);

      // Label background
      ctx.fillStyle = 'rgba(16, 35, 63, 0.9)';
      ctx.fillRect(bx, by - 16, Math.max(bw, 70), 16);

      // Label text
      ctx.fillStyle = '#E6F6F5';
      ctx.font = 'bold 9px Inter, monospace';
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

        ctx.lineWidth = 2.2;
        if (ev.type === 'PHONE_USAGE') {
          ctx.strokeStyle = '#D9912A';
          ctx.fillStyle = 'rgba(217, 145, 42, 0.25)';
        } else if (ev.type === 'TALKING') {
          ctx.strokeStyle = '#159A91';
          ctx.fillStyle = 'rgba(21, 154, 145, 0.25)';
        } else {
          ctx.strokeStyle = '#D94A4A';
          ctx.fillStyle = 'rgba(217, 74, 74, 0.35)';
        }
        ctx.fillRect(ex, ey, ew, eh);
        ctx.strokeRect(ex, ey, ew, eh);

        // Event banner on box
        ctx.fillStyle = ev.type === 'PHONE_USAGE' ? '#D9912A' : ev.type === 'TALKING' ? '#159A91' : '#D94A4A';
        ctx.fillRect(ex, ey + eh, Math.max(ew, 80), 14);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 8px Inter, sans-serif';
        ctx.fillText(ev.type.replace('_', ' '), ex + 3, ey + eh + 10);
      }
    });

    // Unequivocal Mode Watermark
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(12, 12, 330, 24);
    ctx.fillStyle = streamState.mode === 'SIMULATION' ? '#FBBF24' : '#34D399';
    ctx.font = 'bold 10px monospace';
    const watermarkText =
      streamState.mode === 'SIMULATION'
        ? '[SIMULATION MODE — DEMO SYNTHETIC FEED]'
        : '[CONNECTED CCTV — RTSP SECURE STREAM]';
    ctx.fillText(watermarkText, 20, 28);

    // Live Timestamp HUD
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(width - 150, 12, 138, 24);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px monospace';
    ctx.fillText(new Date().toLocaleTimeString(), width - 140, 28);
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
    <AppShell pageTitle="Centralized CCTV Monitoring" pageSubtitle="Multi-site camera surveillance, live inference telemetry, and event timeline">
      {/* Contextual Tabs */}
      <TabsNav tabs={intelligenceTabs} className="mb-6" />

      {/* Top Multi-Site Camera Command Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 card-elevation flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-[10px] font-bold text-textSecondary uppercase tracking-wider mb-1">
              Select Classroom Camera
            </label>
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(Number(e.target.value))}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-[#F7F9FC] text-textPrimary outline-none focus:border-teal"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.room_number}) — {c.mode}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 sm:pt-0 border-l border-slate-100 pl-4">
            <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider block mb-1">
              Stream Diagnostics
            </span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-brandSuccess border border-emerald-200">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>{streamState?.stream_health || 'HEALTHY'}</span>
              </span>
              <span className="text-xs font-mono text-textSecondary">{streamState?.fps || 24} FPS</span>
              <span className="text-xs font-mono text-textSecondary">• {streamState?.diagnostics?.latency_ms || 18}ms</span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isWsConnected ? 'bg-teal/10 text-teal border border-teal/30' : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? 'bg-teal animate-pulse' : 'bg-slate-400'}`} />
                <span>{isWsConnected ? 'WS LIVE' : 'WS OFFLINE'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <button
            type="button"
            onClick={() => setIsProcessing(!isProcessing)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              isProcessing
                ? 'bg-white hover:bg-slate-100 text-textPrimary border-slate-200'
                : 'bg-emerald-50 text-brandSuccess border-emerald-200'
            }`}
          >
            {isProcessing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isProcessing ? 'Pause Stream' : 'Resume Stream'}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleMode}
            className="px-3.5 py-1.5 bg-[#10233F] hover:bg-[#183B5B] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-subtle"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Switch Mode</span>
          </button>
        </div>
      </div>

      {triggerMessage && (
        <div className="mb-6 p-3 bg-teal-light/60 border border-teal/30 text-teal text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{triggerMessage}</span>
        </div>
      )}

      {/* Main Monitoring Center (12 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Large Central Classroom Feed (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-[#0B1321] rounded-xl overflow-hidden border border-slate-800 card-elevation relative flex flex-col justify-between">
            {/* Top In-Feed HUD Bar */}
            <div className="bg-[#0B1321]/90 backdrop-blur-xs px-4 py-2.5 flex items-center justify-between text-white text-xs border-b border-white/10 z-10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold tracking-wide">{streamState?.camera_name || 'Room A-101 Cam'}</span>
                <span className="text-white/60 font-mono text-[11px]">• {streamState?.resolution || '1280x720'}</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] text-teal-light">
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
            <div className="bg-[#0B1321] px-4 py-2 text-[11px] font-mono text-white/70 flex flex-wrap items-center justify-between border-t border-white/10 gap-2">
              <span>Codec: {streamState?.diagnostics?.encoding || 'H.264'}</span>
              <span className="font-bold text-amber-400">
                {streamState?.mode === 'SIMULATION'
                  ? 'DEMONSTRATION SYNTHETIC TELEMETRY'
                  : 'CONNECTED HARDWARE RTSP'}
              </span>
              <span>Packet Loss: {streamState?.diagnostics?.packet_loss_pct || 0}%</span>
            </div>
          </div>

          {/* CCTV Session Timeline Scrubber (PRD FR-10) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 card-elevation space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal" />
                  <span>50-Minute Class Session Event Timeline</span>
                </h4>
                <p className="text-[11px] text-textSecondary mt-0.5">Chronological event distribution across lecture period</p>
              </div>
              <span className="text-xs font-mono font-bold text-teal">09:00 AM - 09:50 AM</span>
            </div>

            {/* Timeline density track */}
            <div className="relative h-6 bg-[#F7F9FC] rounded-lg border border-slate-200 overflow-hidden flex items-center px-2">
              <div className="absolute left-[12%] w-2 h-4 bg-amber-400 rounded-xs" title="09:06 AM: Phone handling detected" />
              <div className="absolute left-[28%] w-3 h-4 bg-teal rounded-xs" title="09:14 AM: Talking motion cluster" />
              <div className="absolute left-[45%] w-2 h-4 bg-amber-400 rounded-xs" title="09:22 AM: Phone handling detected" />
              <div className="absolute left-[70%] w-4 h-4 bg-teal rounded-xs" title="09:35 AM: Group discussion" />
              <div className="absolute left-[85%] w-1.5 h-5 bg-emerald-500 animate-pulse rounded-xs" title="Current playhead" />
            </div>

            <div className="flex justify-between text-[10px] font-mono text-textSecondary pt-1">
              <span>09:00 (Start)</span>
              <span>09:15</span>
              <span>09:30 (Mid-term)</span>
              <span>09:45</span>
              <span>09:50 (Dismissal)</span>
            </div>
          </div>
        </div>

        {/* Secondary Right Panel: Live Detection Events & Simulator (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Events Feed Header & Filter */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 card-elevation space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal animate-pulse" />
                <h3 className="font-bold text-textPrimary text-sm">Detection Events Stream</h3>
              </div>
              <span className="text-[11px] font-mono text-textSecondary bg-slate-100 px-2 py-0.5 rounded">
                {filteredEvents?.length || 0} active
              </span>
            </div>

            {/* Event Filter Pills */}
            <div className="flex flex-wrap gap-1 text-[10px] font-semibold">
              {(['ALL', 'PHONE', 'TALKING', 'SAFETY'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setEventFilter(filter)}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    eventFilter === filter
                      ? 'bg-[#10233F] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Event List */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {!filteredEvents || filteredEvents.length === 0 ? (
                <div className="py-8 text-center text-xs text-textSecondary">
                  No active detections matching filter in current frame.
                </div>
              ) : (
                filteredEvents.map((ev, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-slate-200 bg-[#F7F9FC] text-xs space-y-1.5 hover:border-teal transition-colors"
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="flex items-center gap-1.5 text-textPrimary">
                        {ev.type === 'PHONE_USAGE' ? (
                          <Smartphone className="w-3.5 h-3.5 text-brandWarning" />
                        ) : ev.type === 'TALKING' ? (
                          <MessageSquare className="w-3.5 h-3.5 text-teal" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-brandDanger" />
                        )}
                        <span>{ev.type.replace('_', ' ')}</span>
                      </span>
                      <span className="font-mono text-teal text-[11px]">
                        {(ev.confidence * 100).toFixed(0)}% conf
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-textSecondary">
                      <span>Target: {ev.roll_number || 'Candidate'}</span>
                      <span className="font-mono">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Synthetic Event Ingestion Simulator (for testing) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 card-elevation space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-textPrimary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal" />
                <span>Simulated Event Injection</span>
              </span>
              <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Test Mode
              </span>
            </div>
            <p className="text-[11px] text-textSecondary">
              Inject telemetry events into the camera pipeline to test live review workflows and WebSocket alerts:
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleTriggerSimulated('PHONE_USAGE')}
                className="w-full py-2 px-3 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-textPrimary text-xs font-medium flex items-center justify-between transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-brandWarning" />
                  <span>Detect Phone Usage</span>
                </span>
                <span className="text-[10px] text-brandWarning font-semibold">+ Inject</span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerSimulated('TALKING')}
                className="w-full py-2 px-3 rounded-lg border border-slate-200 hover:border-teal hover:bg-teal-light text-textPrimary text-xs font-medium flex items-center justify-between transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-teal" />
                  <span>Detect Talking Motion</span>
                </span>
                <span className="text-[10px] text-teal font-semibold">+ Inject</span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerSimulated('SUDDEN_FALL')}
                className="w-full py-2 px-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-brandDanger text-xs font-bold flex items-center justify-between transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Trigger Fall Incident</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-brandDanger">+ Alert</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
