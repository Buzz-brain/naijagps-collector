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
import { X, RefreshCw, Info, PlusCircle, Trash2, Edit3 } from 'lucide-react';
import { useEffect } from 'react';
import { useSessions } from '../hooks/useSessions';

interface Props {
  isDark: boolean;
  onToggleTheme: () => void;
  onBack: () => void;
}

export function Tracker({ isDark, onToggleTheme, onBack }: Props) {
  const [showExport, setShowExport] = useState(false);
  const gps = useGPS();

  const isActive = gps.status === 'recording' || gps.status === 'paused';
  const [showAccuracyModal, setShowAccuracyModal] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [sessionsList, setSessionsList] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const sessions = useSessions();

  useEffect(() => {
    const list = sessions.list();
    if (!list || list.length === 0) {
      const s = sessions.create(`Session ${new Date().toISOString().slice(0, 19)}`);
      setSelectedSession(s.sessionId);
      gps.setSession(s.sessionId);
      setSessionsList(sessions.list());
    } else {
      setSessionsList(list);
      setSelectedSession(list[0].sessionId);
      gps.setSession(list[0].sessionId);
    }
  }, []);

  const explainDisabled = () => {
    setModalMessage(
      'Cannot start recording because GPS accuracy is poor. Go outside or enable precise/high-accuracy location in your device settings.'
    );
    setShowAccuracyModal(true);
  };

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
          currentAccuracy={gps.currentAccuracy}
        />
      </div>

      {/* Controls */}
      <div className="mx-3 mt-3 glass-card rounded-2xl p-4">
        <Controls
          status={gps.status}
          onStart={() => {
            if (!gps.permissionGranted) {
              gps.requestPermission().then((acc) => {
                if (acc != null && acc <= 50) gps.startRecording();
                else explainDisabled();
              });
            } else {
              gps.startRecording();
            }
          }}
          onExplainDisabled={explainDisabled}
          onPause={gps.pauseRecording}
          onResume={gps.resumeRecording}
          onStop={gps.stopRecording}
          onReset={gps.resetRecording}
          startDisabled={gps.currentAccuracy == null || gps.currentAccuracy > 50}
          onOpenSessions={() => setShowSessionsModal(true)}
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

      {/* Accuracy modal */}
      {showAccuracyModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-5 mx-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Info className="text-emerald-500" />
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Poor GPS Signal</h3>
              </div>
              <button onClick={() => setShowAccuracyModal(false)} className="text-slate-500">
                <X />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3">{modalMessage}</p>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => {
                  // Retry accuracy check
                  gps.requestPermission().then((acc) => {
                    if (acc != null && acc <= 50) {
                      setShowAccuracyModal(false);
                      gps.startRecording();
                    } else {
                      setModalMessage(
                        `Still poor GPS (accuracy: ${acc == null ? 'unknown' : Math.round(acc) + ' m'}). Go outside or enable precise location.`
                      );
                    }
                  });
                }}
                className="flex items-center gap-2 text-sm bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-3 py-2 rounded-lg"
              >
                <RefreshCw size={14} />
                Retry
              </button>
              <button onClick={() => setShowAccuracyModal(false)} className="text-sm px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Sessions modal */}
      {showSessionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl p-5 mx-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Sessions</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const name = prompt('Session name') || `Session ${new Date().toISOString().slice(0, 19)}`;
                    const s = sessions.create(name);
                    setSessionsList(sessions.list());
                    setSelectedSession(s.sessionId);
                    gps.setSession(s.sessionId);
                  }}
                  className="text-xs px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white"
                >
                  <PlusCircle size={14} /> New
                </button>
                <button onClick={() => setShowSessionsModal(false)} className="text-slate-500">
                  <X />
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {sessionsList.map((s) => (
                <div key={s.sessionId} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold">{s.sessionName || 'Untitled'}</div>
                      <div className="text-xs text-slate-500">({s.points?.length ?? 0} pts)</div>
                    </div>
                    <div className="text-xs text-slate-400">Created {new Date(s.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const name = prompt('Rename session', s.sessionName || '') ?? s.sessionName;
                        sessions.rename(s.sessionId, name);
                        setSessionsList(sessions.list());
                      }}
                      className="text-xs px-2 py-1 rounded bg-white/5"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (!confirm('Delete session and all its readings?')) return;
                        sessions.remove(s.sessionId);
                        const list = sessions.list();
                        setSessionsList(list);
                        if (list.length) {
                          setSelectedSession(list[0].sessionId);
                          gps.setSession(list[0].sessionId);
                        } else {
                          const ns = sessions.create('Session ' + new Date().toISOString().slice(0, 19));
                          setSessionsList(sessions.list());
                          setSelectedSession(ns.sessionId);
                          gps.setSession(ns.sessionId);
                        }
                      }}
                      className="text-xs px-2 py-1 rounded bg-red-50 text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (!confirm('Clear readings for this session?')) return;
                        sessions.clearPoints(s.sessionId);
                        setSessionsList(sessions.list());
                      }}
                      className="text-xs px-2 py-1 rounded bg-white/5"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSession(s.sessionId);
                        gps.setSession(s.sessionId);
                        setShowSessionsModal(false);
                      }}
                      className={`text-xs px-3 py-2 rounded-lg ${selectedSession === s.sessionId ? 'bg-emerald-500 text-white' : 'bg-white/5'}`}
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
