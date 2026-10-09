import AsyncStorage from '@react-native-async-storage/async-storage';

import { estimateKcal, type ActivityMode } from '@/hooks/use-activity-session';

const STORAGE_KEY = 'dalan-activities';

export type SavedActivity = {
  id: string;
  mode: ActivityMode;
  title: string;
  distanceM: number;
  elapsedSec: number;
  kcal: number;
  finishedAt: number;
};

function startOfWeek(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - daysSinceMonday);
  return start.getTime();
}

export async function loadActivities(): Promise<SavedActivity[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as SavedActivity[];
    if (!Array.isArray(data)) return [];
    return data.filter((item) => item && typeof item.finishedAt === 'number');
  } catch {
    return [];
  }
}

export async function recordActivity(input: {
  mode: ActivityMode;
  label: string;
  distanceM: number;
  elapsedSec: number;
}): Promise<SavedActivity> {
  const hour = new Date().getHours();
  const when = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  const activity: SavedActivity = {
    id: `${Date.now()}`,
    mode: input.mode,
    title: `${when} ${input.label.toLowerCase()}`,
    distanceM: input.distanceM,
    elapsedSec: input.elapsedSec,
    kcal: estimateKcal(input.mode, input.elapsedSec),
    finishedAt: Date.now(),
  };

  const existing = await loadActivities();
  const next = [activity, ...existing].slice(0, 100);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return activity;
}

export function weekTotals(activities: SavedActivity[]) {
  const from = startOfWeek();
  return activities.reduce(
    (totals, activity) => {
      if (activity.finishedAt < from) return totals;
      return {
        distanceM: totals.distanceM + activity.distanceM,
        kcal: totals.kcal + activity.kcal,
      };
    },
    { distanceM: 0, kcal: 0 },
  );
}
