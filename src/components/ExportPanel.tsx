import { useState } from 'react';
import { Download, Trash2, Upload, CheckCircle, XCircle, Loader } from 'lucide-react';
import type { GpsPoint } from '../lib/utils';
import { UPLOAD_URL } from '../lib/supabase';
import { useStorage } from '../hooks/useStorage';

interface Props {
  points: GpsPoint[];
  sessionId: string;
  mode: string;
  totalDistance: number;
  duration: number;
  startedAt: string;
  onClear: () => void;
  disabled?: boolean;
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export function ExportPanel({ points, sessionId, mode, totalDistance, duration, startedAt, onClear, disabled }: Props) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadMsg, setUploadMsg] = useState('');
  const { loadSession, loadAll } = useStorage();

  const handleExport = () => {
    const session = loadSession(sessionId) ?? { points };
    // export only required fields
    const out = (session.points || points).map((p: any) => ({ lat: p.lat, lon: p.lon, timestamp: p.timestamp, speed: p.speed, heading: p.heading }));
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const name = (session.sessionName || `session_${sessionId}`).toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toCsvRows = (rows: any[]) => {
    const header = ['lat','lon','timestamp','speed','heading','mode','sessionName','accuracy'];
    const lines = [header.join(',')];
    for (const r of rows) {
      const line = [
        r.lat ?? '',
        r.lon ?? '',
        r.timestamp ?? '',
        r.speed ?? '',
        r.heading ?? '',
        r.mode ?? '',
        r.sessionName ?? '',
        r.accuracy ?? '',
      ].map((v) => String(v).replace(/\n/g, ' '));
      lines.push(line.join(','));
    }
    return lines.join('\n');
  };

  const handleExportCsv = () => {
    const session = loadSession(sessionId) ?? { points };
    const rows = (session.points || points).map((p: any) => ({
      lat: p.lat, lon: p.lon, timestamp: p.timestamp, speed: p.speed, heading: p.heading, mode: session.mode || p.mode || '', sessionName: session.sessionName || '', accuracy: p.accuracy ?? ''
    }));
    const csv = toCsvRows(rows);
    const name = (session.sessionName || `session_${sessionId}`).toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAllJson = () => {
    const all = loadAll();
    // export sessions but only include required point fields
    const out = all.map((s: any) => ({ sessionId: s.sessionId, sessionName: s.sessionName, createdAt: s.createdAt, points: (s.points||[]).map((p:any)=>({lat:p.lat,lon:p.lon,timestamp:p.timestamp,speed:p.speed,heading:p.heading})) }));
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `all_sessions.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleExportAllCsv = () => {
    const all = loadAll();
    const rows: any[] = [];
    for (const s of all) {
      for (const p of s.points || []) {
        rows.push({ lat: p.lat, lon: p.lon, timestamp: p.timestamp, speed: p.speed, heading: p.heading, mode: s.mode || p.mode || '', sessionName: s.sessionName || '', accuracy: p.accuracy ?? '' });
      }
    }
    const csv = toCsvRows(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `all_sessions.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleUpload = async () => {
    if (points.length === 0) return;
    setUploadState('uploading');
    setUploadMsg('');
    try {
      const res = await fetch(UPLOAD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          mode,
          points,
          total_distance: totalDistance,
          duration_seconds: duration,
          started_at: startedAt,
          completed_at: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      setUploadState('success');
      setUploadMsg(`${data.points_count} points uploaded successfully!`);
    } catch (err) {
      setUploadState('error');
      setUploadMsg(String(err));
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Export & Upload</h3>
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          disabled={points.length === 0 || disabled}
          className="flex-1 flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400
            text-white text-sm font-semibold py-3 rounded-xl transition-all duration-200
            active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-sky-500/30"
        >
          <Download size={15} />
          Download Session JSON
        </button>
        <button
          onClick={handleExportCsv}
          disabled={points.length === 0 || disabled}
          className="flex-1 flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400
            text-white text-sm font-semibold py-3 rounded-xl transition-all duration-200
            active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-sky-500/30"
        >
          <Download size={15} />
          Download Session CSV
        </button>
      </div>
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleExportAllJson}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400
            text-white text-sm font-semibold py-2.5 rounded-xl transition-all duration-200 active:scale-95 shadow-sm shadow-indigo-500/30"
        >
          <Download size={14} />
          Export All JSON
        </button>
        <button
          onClick={handleExportAllCsv}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400
            text-white text-sm font-semibold py-2.5 rounded-xl transition-all duration-200 active:scale-95 shadow-sm shadow-indigo-500/30"
        >
          <Download size={14} />
          Export All CSV
        </button>
      </div>

      {uploadState === 'success' && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2">
          <CheckCircle size={13} />
          {uploadMsg}
        </div>
      )}
      {uploadState === 'error' && (
        <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
          <XCircle size={13} />
          {uploadMsg}
        </div>
      )}

      <button
        onClick={onClear}
        className="w-full flex items-center justify-center gap-2 border border-red-300 dark:border-red-700
          text-red-500 dark:text-red-400 text-sm font-semibold py-2.5 rounded-xl
          hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 active:scale-95"
      >
        <Trash2 size={14} />
        Clear All Data
      </button>
    </div>
  );
}
