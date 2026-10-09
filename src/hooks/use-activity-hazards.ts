import { useEffect, useRef, useState } from 'react';

import { HAZARD_META, type Hazard } from '@/constants/hazards';
import { completeBrief, hasSharedLlama } from '@/services/local-llm';
import { speakText, stopSpeech } from '@/services/speech';
import { distanceMeters, type LatLng } from '@/utils/geo';

import type { ActivityMode } from './use-activity-session';

export type HazardLevel = 'clear' | 'ahead' | 'near';

export type HazardSituation = {
  level: HazardLevel;
  title: string;
  detail: string;
  hazard: Hazard | null;
  meters: number | null;
};

const AHEAD_M = 150;
const NEAR_M = 60;
const COOLDOWN_MS = 90_000;

const VERB: Record<ActivityMode, string> = {
  walk: 'walking',
  run: 'running',
  cycle: 'cycling',
  drive: 'driving',
};

function fallbackLine(hazard: Hazard, meters: number) {
  const label = HAZARD_META[hazard.type].label.toLowerCase();
  const where = meters < 25 ? 'right here' : `about ${Math.round(meters)} meters ahead`;
  switch (hazard.type) {
    case 'manhole':
      return `Careful — an open manhole is ${where}. Watch your step and go around it.`;
    case 'garbage':
      return `Careful — garbage is ${where}. Keep to the side if you can.`;
    case 'pothole':
      return `Careful — a pothole is ${where}. Slow down and go around it.`;
    case 'debris':
      return `Careful — debris is ${where}. Slow down and pick a clearer path.`;
    case 'flood':
      return `Careful — flooding is ${where}. Slow down and avoid the deep water.`;
    case 'construction':
      return `Careful — construction is ${where}. Slow down and follow the open path.`;
    case 'closure':
      return `Careful — a road closure is ${where}. Look for another way around.`;
    case 'accident':
      return `Careful — an accident is reported ${where}. Slow down and give it space.`;
    default:
      return `Careful — ${label} is reported ${where}. Slow down and stay aware.`;
  }
}

function sanitizeAlert(text: string, fallback: string) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return fallback;
  if (/\b(evacuat|flee|leave (the )?(area|now)|run away|get out|abandon)\b/i.test(cleaned)) {
    return fallback;
  }
  if (!/^careful\b/i.test(cleaned)) {
    return `Careful — ${cleaned.replace(/^[.!,—\-\s]+/, '')}`;
  }
  return cleaned;
}

function situationFrom(hazard: Hazard | null, meters: number | null): HazardSituation {
  if (!hazard || meters == null) {
    return {
      level: 'clear',
      title: 'Path looks clear',
      detail: 'Dally will warn you if a reported hazard is nearby.',
      hazard: null,
      meters: null,
    };
  }

  const label = HAZARD_META[hazard.type].label;
  if (meters <= NEAR_M) {
    return {
      level: 'near',
      title: `Near ${label.toLowerCase()}`,
      detail: hazard.title || `${label} reported ${Math.round(meters)} m away`,
      hazard,
      meters,
    };
  }

  return {
    level: 'ahead',
    title: `${label} ahead`,
    detail: hazard.title || `About ${Math.round(meters)} m away`,
    hazard,
    meters,
  };
}

export function useActivityHazards(
  active: boolean,
  muted: boolean,
  mode: ActivityMode,
  location: LatLng | null,
  reports: Hazard[],
) {
  const [situation, setSituation] = useState<HazardSituation>(() => situationFrom(null, null));
  const lastAlertRef = useRef<Map<string, number>>(new Map());
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  useEffect(() => {
    if (!active || muted) {
      void stopSpeech();
    }
  }, [active, muted]);

  useEffect(() => {
    if (!active || !location) {
      setSituation(situationFrom(null, null));
      return;
    }

    let nearest: { hazard: Hazard; meters: number } | null = null;
    for (const report of reports) {
      const meters = distanceMeters(location, report);
      if (!nearest || meters < nearest.meters) {
        nearest = { hazard: report, meters };
      }
    }

    const inRange = nearest && nearest.meters <= AHEAD_M ? nearest : null;
    const next = situationFrom(inRange?.hazard ?? null, inRange?.meters ?? null);
    setSituation(next);

    if (!inRange || mutedRef.current) return;

    const now = Date.now();
    const last = lastAlertRef.current.get(inRange.hazard.id) ?? 0;
    if (now - last < COOLDOWN_MS) return;
    lastAlertRef.current.set(inRange.hazard.id, now);

    const canned = fallbackLine(inRange.hazard, inRange.meters);

    const speak = (line: string) => {
      if (mutedRef.current) return;
      speakText(sanitizeAlert(line, canned));
    };

    if (!hasSharedLlama()) {
      speak(canned);
      return;
    }

    void completeBrief(
      'You are Dally, DALAN’s road helper. Speak one calm line, max 18 words. Always start with Careful. Tell them to slow down or go around. Never say evacuate, flee, leave the area, or run. No quotes.',
      `The user is ${VERB[mode]}. A ${HAZARD_META[inRange.hazard.type].label} report is ${Math.round(inRange.meters)} meters away. Give a practical careful warning.`,
    ).then((line) => {
      speak(line ?? canned);
    });
  }, [active, location, mode, reports]);

  return situation;
}
