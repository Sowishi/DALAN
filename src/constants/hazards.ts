import type { ComponentProps } from 'react';

import type { MaterialCommunityIcons } from '@expo/vector-icons';

export type HazardType =
  | 'flood'
  | 'accident'
  | 'closure'
  | 'hazard'
  | 'manhole'
  | 'garbage'
  | 'pothole'
  | 'debris'
  | 'construction'
  | 'other';

export const MAP_FILTERS = [
  { key: 'all', label: 'All', icon: 'apps-outline' as const },
  { key: 'roads', label: 'Roads', icon: 'bus-outline' as const },
  { key: 'safety', label: 'Safety', icon: 'shield-checkmark-outline' as const },
  { key: 'lifestyle', label: 'Lifestyle', icon: 'leaf-outline' as const },
] as const;

export type MapFilterKey = (typeof MAP_FILTERS)[number]['key'];

const FILTER_TYPES: Record<MapFilterKey, HazardType[] | null> = {
  all: null,
  roads: ['closure', 'pothole', 'construction', 'debris', 'manhole'],
  safety: ['flood', 'accident', 'hazard'],
  lifestyle: ['garbage', 'other'],
};

export function reportMatchesFilter(type: HazardType, filter: MapFilterKey) {
  const allowed = FILTER_TYPES[filter];
  return allowed === null || allowed.includes(type);
}

export type RiskLevel = 'high' | 'moderate' | 'low';

export type Hazard = {
  id: string;
  type: HazardType;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  createdAt?: number;
  photoUrl?: string;
  photoUrls?: string[];
  address?: string;
  severity?: RiskLevel;
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  high: '#FF3B30',
  moderate: '#FF9500',
  low: '#EAB308',
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  high: 'High risk',
  moderate: 'Moderate',
  low: 'Low risk',
};

export const CATEGORY_RISK: Record<HazardType, RiskLevel> = {
  flood: 'high',
  accident: 'high',
  manhole: 'high',
  hazard: 'high',
  closure: 'moderate',
  debris: 'moderate',
  pothole: 'moderate',
  construction: 'moderate',
  garbage: 'low',
  other: 'low',
};

export const RISK_LEVELS: RiskLevel[] = ['high', 'moderate', 'low'];

export function categoriesForRisk(level: RiskLevel) {
  return (Object.keys(CATEGORY_RISK) as HazardType[])
    .filter((key) => CATEGORY_RISK[key] === level)
    .map((key) => HAZARD_META[key].label);
}

export type HazardMeta = {
  label: string;
  color: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
};

export const HAZARD_META: Record<HazardType, HazardMeta> = {
  flood: { label: 'Flooding', color: RISK_COLORS.high, icon: 'water' },
  accident: { label: 'Accident', color: RISK_COLORS.high, icon: 'car-emergency' },
  closure: { label: 'Road closure', color: RISK_COLORS.moderate, icon: 'road-variant' },
  hazard: { label: 'Hazard', color: RISK_COLORS.high, icon: 'alert' },
  manhole: { label: 'Manhole', color: RISK_COLORS.high, icon: 'circle-outline' },
  garbage: { label: 'Garbage', color: RISK_COLORS.low, icon: 'trash-can' },
  pothole: { label: 'Pothole', color: RISK_COLORS.moderate, icon: 'checkbox-blank-circle' },
  debris: { label: 'Debris', color: RISK_COLORS.moderate, icon: 'tree' },
  construction: { label: 'Construction', color: RISK_COLORS.moderate, icon: 'excavator' },
  other: { label: 'Other', color: RISK_COLORS.low, icon: 'dots-horizontal' },
};

export const REPORT_CATEGORIES = (
  Object.keys(HAZARD_META) as HazardType[]
).map((key) => ({
  key,
  ...HAZARD_META[key],
}));

export function isHazardType(value: string): value is HazardType {
  return value in HAZARD_META;
}

const RISK_RANK: Record<RiskLevel, number> = { low: 0, moderate: 1, high: 2 };

function reportedSeverity(description: string): RiskLevel | null {
  const match = description.match(/severity:\s*(low|moderate|high)/i);
  if (!match) return null;
  return match[1].toLowerCase() as RiskLevel;
}

export function riskForHazard(hazard: Pick<Hazard, 'type' | 'description' | 'severity'>): RiskLevel {
  const base = CATEGORY_RISK[hazard.type] ?? 'low';
  const reported = hazard.severity ?? reportedSeverity(hazard.description);
  if (!reported) return base;
  return RISK_RANK[reported] > RISK_RANK[base] ? reported : base;
}

export function hazardZoneMeters(level: RiskLevel) {
  if (level === 'high') return 36;
  if (level === 'moderate') return 24;
  return 16;
}

/** Reports with display color and label resolved, ready to send into the map. */
export function hazardsWithColor(hazards: Hazard[]) {
  return hazards.map((hazard) => {
    const meta = HAZARD_META[hazard.type] ?? HAZARD_META.other;
    const risk = riskForHazard(hazard);
    const color = RISK_COLORS[risk];
    return {
      ...hazard,
      label: meta.label,
      color,
      risk,
      highRisk: risk === 'high',
      zoneM: hazardZoneMeters(risk),
    };
  });
}
