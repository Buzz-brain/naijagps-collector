import { useCallback } from 'react';
import type { GpsPoint } from '../lib/utils';

const STORAGE_KEY = 'naija-gps-points';
const SESSION_KEY = 'naija-gps-session';

export interface StoredSession {
  sessionId: string;
  mode: string;
  startedAt: string;
  points: GpsPoint[];
}

export function useStorage() {
  const savePoints = useCallback((points: GpsPoint[], sessionId: string, mode: string, startedAt: string) => {
    try {
      const session: StoredSession = { sessionId, mode, startedAt, points };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // storage full — silently ignore
    }
  }, []);

  const loadPoints = useCallback((): StoredSession | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StoredSession) : null;
    } catch {
      return null;
    }
  }, []);

  const clearPoints = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  return { savePoints, loadPoints, clearPoints };
}
