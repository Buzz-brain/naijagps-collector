import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import type { RecordingStatus } from '../hooks/useGPS';

interface Props {
  status: RecordingStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
}

export function Controls({ status, onStart, onPause, onResume, onStop, onReset }: Props) {
  return (
    <div className="flex gap-3 items-center justify-center">
      {status === 'idle' && (
        <button
          onClick={onStart}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold
            px-8 py-4 rounded-2xl shadow-lg shadow-emerald-500/40 transition-all duration-200
            active:scale-95 text-base"
        >
          <Play size={20} fill="white" />
          Start Recording
        </button>
      )}

      {status === 'recording' && (
        <>
          <button
            onClick={onPause}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-bold
              px-6 py-4 rounded-2xl shadow-lg shadow-amber-500/30 transition-all duration-200 active:scale-95"
          >
            <Pause size={18} fill="white" />
            Pause
          </button>
          <button
            onClick={onStop}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white font-bold
              px-6 py-4 rounded-2xl shadow-lg shadow-red-500/30 transition-all duration-200 active:scale-95"
          >
            <Square size={18} fill="white" />
            Stop
          </button>
        </>
      )}

      {status === 'paused' && (
        <>
          <button
            onClick={onResume}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold
              px-6 py-4 rounded-2xl shadow-lg shadow-emerald-500/30 transition-all duration-200 active:scale-95"
          >
            <Play size={18} fill="white" />
            Resume
          </button>
          <button
            onClick={onStop}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white font-bold
              px-6 py-4 rounded-2xl shadow-lg shadow-red-500/30 transition-all duration-200 active:scale-95"
          >
            <Square size={18} fill="white" />
            Stop
          </button>
        </>
      )}

      {status === 'stopped' && (
        <button
          onClick={onReset}
          className="flex items-center gap-2 bg-slate-500 hover:bg-slate-400 text-white font-bold
            px-6 py-4 rounded-2xl transition-all duration-200 active:scale-95"
        >
          <RotateCcw size={18} />
          New Session
        </button>
      )}
    </div>
  );
}
