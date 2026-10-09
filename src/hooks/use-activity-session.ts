import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

import { distanceMeters, type LatLng } from '@/utils/geo';

export type ActivityMode = 'walk' | 'run' | 'cycle' | 'drive';

export type ActivityFix = LatLng & {
  accuracy: number;
};

export type ActivityStats = {
  distanceM: number;
  elapsedSec: number;
  paceLabel: string;
  kcal: number;
};

const MET: Record<ActivityMode, number> = {
  walk: 3.5,
  run: 9.8,
  cycle: 6.8,
  drive: 2,
};

export function formatClock(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatKm(meters: number) {
  return (meters / 1000).toFixed(2);
}

function paceLabel(mode: ActivityMode, meters: number, seconds: number) {
  if (meters < 20 || seconds < 5) return '—';
  const hours = seconds / 3600;
  const km = meters / 1000;
  if (mode === 'cycle' || mode === 'drive') {
    return `${(km / hours).toFixed(1)} km/h`;
  }
  const minPerKm = seconds / 60 / km;
  const mins = Math.floor(minPerKm);
  const secs = Math.round((minPerKm - mins) * 60);
  return `${mins}:${String(secs).padStart(2, '0')} /km`;
}

export function estimateKcal(mode: ActivityMode, seconds: number) {
  return Math.round(MET[mode] * 1.225 * (seconds / 60));
}

export function useActivitySession(mode: ActivityMode, active: boolean, paused: boolean) {
  const [fix, setFix] = useState<ActivityFix | null>(null);
  const [path, setPath] = useState<LatLng[]>([]);
  const [distanceM, setDistanceM] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const lastRef = useRef<LatLng | null>(null);
  const accumulatedRef = useRef(0);
  const runningSinceRef = useRef<number | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    if (!active) {
      lastRef.current = null;
      accumulatedRef.current = 0;
      runningSinceRef.current = null;
      setPath([]);
      setDistanceM(0);
      setElapsedSec(0);
      setError(null);
      setFix(null);
    }
  }, [active]);

  useEffect(() => {
    if (!active) return;

    if (paused) {
      if (runningSinceRef.current != null) {
        accumulatedRef.current += Date.now() - runningSinceRef.current;
        runningSinceRef.current = null;
      }
      return;
    }

    runningSinceRef.current = Date.now();
    const tick = setInterval(() => {
      const running = runningSinceRef.current;
      const extra = running != null ? Date.now() - running : 0;
      setElapsedSec(Math.floor((accumulatedRef.current + extra) / 1000));
    }, 250);

    return () => {
      clearInterval(tick);
    };
  }, [active, paused]);

  useEffect(() => {
    if (!active) {
      watchRef.current?.remove();
      watchRef.current = null;
      return;
    }

    let cancelled = false;

    const start = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        if (!cancelled) setError('Location permission is needed to track this activity.');
        return;
      }

      const first = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      if (cancelled) return;

      const startFix: ActivityFix = {
        latitude: first.coords.latitude,
        longitude: first.coords.longitude,
        accuracy: first.coords.accuracy ?? 0,
      };
      setFix(startFix);
      lastRef.current = startFix;
      setPath([startFix]);

      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 1,
          timeInterval: 1000,
        },
        (update) => {
          const next: ActivityFix = {
            latitude: update.coords.latitude,
            longitude: update.coords.longitude,
            accuracy: update.coords.accuracy ?? 0,
          };
          setFix(next);

          if (pausedRef.current) return;

          const prev = lastRef.current;
          if (!prev) {
            lastRef.current = next;
            setPath((points) => [...points, next]);
            return;
          }

          const step = distanceMeters(prev, next);
          if (step > 180) {
            lastRef.current = next;
            return;
          }
          if (step < 1) return;
          if (next.accuracy > 100 && step < 6) return;

          lastRef.current = next;
          setDistanceM((value) => value + step);
          setPath((points) => [...points, next]);
        },
      );
    };

    void start();

    return () => {
      cancelled = true;
      watchRef.current?.remove();
      watchRef.current = null;
    };
  }, [active]);

  const stats: ActivityStats = {
    distanceM,
    elapsedSec,
    paceLabel: paceLabel(mode, distanceM, elapsedSec),
    kcal: estimateKcal(mode, elapsedSec),
  };

  return { fix, path, stats, error };
}
