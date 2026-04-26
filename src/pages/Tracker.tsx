import { useState } from 'react';
import { AlertTriangle, ArrowLeft, Lock } from 'lucide-react';
import { Header } from '../components/Header';
import { ModeSelector } from '../components/ModeSelector';
import { Controls } from '../components/Controls';
import { Dashboard } from '../components/Dashboard';
import { MapView } from '../components/MapView';
import { ExportPanel } from '../components/ExportPanel';
import { useGPS } from '../hooks/useGPS';
import type { MovementMode } from '../lib/utils';

interface Props {
  isDark: boolean;
  onToggleTheme: () => void;
  onBack: () => void;
}

export function Tracker({ isDark, onToggleTheme, onBack }: Props) {
  const [showExport, setShowExport] = useState(false);
  const gps = useGPS();

  const isActive = gps.status === 'recording' || gps.status === 'paused';

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <div className="glass-card mx-3 mt-3 rounded-2xl">
        <div className="flex items-center gap-2 px-4 pt-3">
          <button
            onClick={onBack}
            className="w-7 h-7 flex items-center justify-center rounded-lg
              bg-white/20 dark:bg-white/10 hover:bg-white/30 transition-all"
          >
            <ArrowLeft size={14} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div className="flex-1">
            <Header isDark={isDark} onToggleTheme={onToggleTheme} status={gps.status} />
          </div>
        </div>
      </div>

      {/* Permission / Error Banner */}
      {gps.error && (
        <div className="mx-3 mt-2 flex items-center gap-2 bg-red-50 dark:bg-red-900/20
          border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400
          text-xs font-medium px-4 py-2.5 rounded-xl">
          <AlertTriangle size={14} />
          {gps.error}
        </div>
      )}

      {/* Permission Request */}
      {!gps.permissionGranted && gps.status === 'idle' && (
        <div className="mx-3 mt-2 glass-card rounded-2xl p-4 text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto">
            <Lock size={20} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">Location Access Required</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Allow location access to begin recording your GPS trajectory.
            </p>
          </div>
          <button
            onClick={gps.requestPermission}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold
              py-3 rounded-xl transition-all duration-200 active:scale-95 shadow-sm shadow-emerald-500/30"
          >
            Allow Location Access
          </button>
        </div>
      )}

      {/* Mode Selector */}
      <div className="mx-3 mt-2 glass-card rounded-2xl p-3">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Movement Mode</p>
        <ModeSelector
          value={gps.mode}
          onChange={(m: MovementMode) => gps.setMode(m)}
          disabled={isActive}
        />
      </div>

      {/* Map */}
      <div className="mx-3 mt-2 glass-card rounded-2xl overflow-hidden flex-1" style={{ minHeight: 260 }}>
        <MapView points={gps.points} currentPos={gps.currentPos} />
      </div>

      {/* Dashboard */}
      <div className="mx-3 mt-2">
        <Dashboard
          pointsCount={gps.points.length}
          totalDistance={gps.totalDistance}
          currentSpeed={gps.currentSpeed}
          duration={gps.duration}
          currentPos={gps.currentPos}
        />
      </div>

      {/* Controls */}
      <div className="mx-3 mt-3 glass-card rounded-2xl p-4">
        <Controls
          status={gps.status}
          onStart={gps.startRecording}
          onPause={gps.pauseRecording}
          onResume={gps.resumeRecording}
          onStop={gps.stopRecording}
          onReset={gps.resetRecording}
        />
      </div>

      {/* Export Toggle */}
      {gps.points.length > 0 && (
        <div className="mx-3 mt-2">
          <button
            onClick={() => setShowExport((v) => !v)}
            className="w-full text-xs font-semibold text-slate-500 dark:text-slate-400
              hover:text-emerald-500 transition-colors py-1"
          >
            {showExport ? '▲ Hide Export' : '▼ Show Export & Upload'}
          </button>
          {showExport && (
            <div className="mt-2">
              <ExportPanel
                points={gps.points}
                sessionId={gps.sessionId}
                mode={gps.mode}
                totalDistance={gps.totalDistance}
                duration={gps.duration}
                startedAt={gps.startedAt}
                onClear={gps.resetRecording}
                disabled={gps.status === 'recording'}
              />
            </div>
          )}
        </div>
      )}

      <div className="h-6" />
    </div>
  );
}
