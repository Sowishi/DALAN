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

export type Hazard = {
  id: string;
  type: HazardType;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
};

export type HazardMeta = {
  label: string;
  color: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
};

export const HAZARD_META: Record<HazardType, HazardMeta> = {
  flood: { label: 'Flooding', color: '#2D7FF9', icon: 'water' },
  accident: { label: 'Accident', color: '#E5484D', icon: 'car-emergency' },
  closure: { label: 'Road closure', color: '#D97706', icon: 'road-variant' },
  hazard: { label: 'Hazard', color: '#F76808', icon: 'alert' },
  manhole: { label: 'Manhole', color: '#7C3AED', icon: 'circle-outline' },
  garbage: { label: 'Garbage', color: '#65A30D', icon: 'trash-can' },
  pothole: { label: 'Pothole', color: '#F76808', icon: 'checkbox-blank-circle' },
  debris: { label: 'Debris', color: '#6B7280', icon: 'tree' },
  construction: { label: 'Construction', color: '#CA8A04', icon: 'excavator' },
  other: { label: 'Other', color: '#015144', icon: 'dots-horizontal' },
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

/** Reports with display color and label resolved, ready to send into the map. */
export function hazardsWithColor(hazards: Hazard[]) {
  return hazards.map((hazard) => {
    const meta = HAZARD_META[hazard.type] ?? HAZARD_META.other;
    return {
      ...hazard,
      label: meta.label,
      color: meta.color,
    };
  });
}
