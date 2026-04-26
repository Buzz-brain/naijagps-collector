import { useState, useRef, useCallback, useEffect } from 'react';
import { haversineDistance, calculateHeading, generateSessionId } from '../lib/utils';
import type { GpsPoint, MovementMode } from '../lib/utils';
import { useStorage } from './useStorage';

export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped';

const MIN_DISTANCE_METERS = 5;
const MIN_INTERVAL_MS = 1000;

export function useGPS() {
  const [points, setPoints] = useState<GpsPoint[]>([]);
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [mode, setMode] = useState<MovementMode>('walking');
  const [currentPos, setCurrentPos] = useState<{ lat: number; lon: number } | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const lastPointRef = useRef<GpsPoint | null>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const sessionIdRef = useRef<string>(generateSessionId());
  const startedAtRef = useRef<string>('');
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const accDistRef = useRef<number>(0);
  const pointsRef = useRef<GpsPoint[]>([]);

  const { savePoints, clearPoints } = useStorage();

  // keep pointsRef in sync for callbacks
  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handlePosition = useCallback(
    (pos: GeolocationPosition) => {
      const { latitude, longitude, speed, accuracy } = pos.coords;
      setCurrentPos({ lat: latitude, lon: longitude });

      if (accuracy > 50) return; // skip low-accuracy fixes

      const now = Date.now();
      const timeDiff = now - lastSaveTimeRef.current;
      const last = lastPointRef.current;

      let distFromLast = 0;
      let heading = 0;
      if (last) {
        distFromLast = haversineDistance(last.lat, last.lon, latitude, longitude);
        heading = calculateHeading(last.lat, last.lon, latitude, longitude);
      }

      const shouldSave = timeDiff >= MIN_INTERVAL_MS || (last && distFromLast >= MIN_DISTANCE_METERS);
      if (!shouldSave) return;

      const mps = speed != null && speed >= 0 ? speed : (last && timeDiff > 0 ? distFromLast / (timeDiff / 1000) : 0);
      setCurrentSpeed(mps);

      const point: GpsPoint = {
        lat: parseFloat(latitude.toFixed(7)),
        lon: parseFloat(longitude.toFixed(7)),
        timestamp: new Date().toISOString(),
        speed: parseFloat(mps.toFixed(2)),
        heading: parseFloat(heading.toFixed(1)),
        mode,
      };

      lastPointRef.current = point;
      lastSaveTimeRef.current = now;

      if (last) {
        accDistRef.current += distFromLast;
        setTotalDistance(accDistRef.current);
      }

      setPoints((prev) => {
        const next = [...prev, point];
        savePoints(next, sessionIdRef.current, mode, startedAtRef.current);
        return next;
      });
    },
    [mode, savePoints]
  );

  const requestPermission = useCallback(async () => {
    setError(null);
    try {
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
      setPermissionGranted(true);
    } catch (err) {
      const geoError = err as GeolocationPositionError;
      if (geoError.code === 1) {
        setError('Location permission denied. Please allow location access.');
      } else {
        setError('Unable to get location. Ensure GPS is enabled.');
      }
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    sessionIdRef.current = generateSessionId();
    startedAtRef.current = new Date().toISOString();
    startTimeRef.current = Date.now();
    lastPointRef.current = null;
    lastSaveTimeRef.current = 0;
    accDistRef.current = 0;
    setPoints([]);
    setTotalDistance(0);
    setDuration(0);
    setError(null);
    setStatus('recording');
    setPermissionGranted(true);
    startTimer();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPermissionGranted(true);
        handlePosition(pos);
      },
      (err) => {
        if (err.code === 1) setError('Location permission denied.');
        else setError('Location error: ' + err.message);
        setStatus('idle');
        stopTimer();
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  }, [handlePosition, startTimer]);

  const pauseRecording = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    stopTimer();
    setStatus('paused');
  }, [stopTimer]);

  const resumeRecording = useCallback(() => {
    startTimeRef.current = Date.now() - duration * 1000;
    setStatus('recording');
    startTimer();
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      (err) => { setError('Location error: ' + err.message); },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  }, [handlePosition, startTimer, duration]);

  const stopRecording = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    stopTimer();
    setStatus('stopped');
  }, [stopTimer]);

  const resetRecording = useCallback(() => {
    stopRecording();
    clearPoints();
    setPoints([]);
    setTotalDistance(0);
    setDuration(0);
    setCurrentSpeed(0);
    setCurrentPos(null);
    accDistRef.current = 0;
    setStatus('idle');
  }, [stopRecording, clearPoints]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      stopTimer();
    };
  }, [stopTimer]);

  return {
    points,
    status,
    mode,
    setMode,
    currentPos,
    currentSpeed,
    totalDistance,
    duration,
    error,
    permissionGranted,
    sessionId: sessionIdRef.current,
    startedAt: startedAtRef.current,
    requestPermission,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  };
}
