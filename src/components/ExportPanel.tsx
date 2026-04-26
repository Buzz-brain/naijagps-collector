import { useState } from 'react';
import { Download, Trash2, Upload, CheckCircle, XCircle, Loader } from 'lucide-react';
import type { GpsPoint } from '../lib/utils';
import { UPLOAD_URL } from '../lib/supabase';

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

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(points, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `naija-gps-${sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
          Download JSON
        </button>
        <button
          onClick={handleUpload}
          disabled={points.length === 0 || disabled || uploadState === 'uploading'}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400
            text-white text-sm font-semibold py-3 rounded-xl transition-all duration-200
            active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-emerald-500/30"
        >
          {uploadState === 'uploading' ? (
            <Loader size={15} className="animate-spin" />
          ) : (
            <Upload size={15} />
          )}
          {uploadState === 'uploading' ? 'Uploading…' : 'Upload Data'}
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
