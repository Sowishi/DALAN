/**
 * Street hindrances shown on the map. Sample data for now — swap `SAMPLE_HAZARDS`
 * for live reports (e.g. Firebase) later without touching the map component.
 */

export type HazardType =
  | 'flood'
  | 'manhole'
  | 'garbage'
  | 'pothole'
  | 'accident'
  | 'closure'
  | 'debris';

export type Hazard = {
  id: string;
  type: HazardType;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
};

export const HAZARD_META: Record<HazardType, { label: string; color: string }> = {
  flood: { label: 'Flooding', color: '#2D7FF9' },
  manhole: { label: 'Open manhole', color: '#7C3AED' },
  garbage: { label: 'Garbage', color: '#65A30D' },
  pothole: { label: 'Pothole', color: '#F76808' },
  accident: { label: 'Accident', color: '#E5484D' },
  closure: { label: 'Road closure', color: '#D97706' },
  debris: { label: 'Debris', color: '#6B7280' },
};

export const SAMPLE_HAZARDS: Hazard[] = [
  {
    id: 'h1',
    type: 'flood',
    title: 'Flooded road',
    description: 'Knee-deep flooding near the intersection. Avoid if possible.',
    latitude: 14.5995,
    longitude: 120.9842,
  },
  {
    id: 'h2',
    type: 'manhole',
    title: 'Open manhole',
    description: 'Missing cover on the sidewalk. Hazard for pedestrians.',
    latitude: 14.6042,
    longitude: 120.9822,
  },
  {
    id: 'h3',
    type: 'garbage',
    title: 'Garbage pile',
    description: 'Uncollected garbage blocking half of the lane.',
    latitude: 14.5958,
    longitude: 120.987,
  },
  {
    id: 'h4',
    type: 'pothole',
    title: 'Deep pothole',
    description: 'Large pothole on the outer lane. Drive with caution.',
    latitude: 14.601,
    longitude: 120.9901,
  },
  {
    id: 'h5',
    type: 'accident',
    title: 'Vehicle accident',
    description: 'Two-car collision reported. Expect delays.',
    latitude: 14.5932,
    longitude: 120.9815,
  },
  {
    id: 'h6',
    type: 'closure',
    title: 'Road closure',
    description: 'Street closed for repairs until this evening.',
    latitude: 14.6075,
    longitude: 120.988,
  },
  {
    id: 'h7',
    type: 'debris',
    title: 'Road debris',
    description: 'Fallen branches and debris partially blocking the road.',
    latitude: 14.5968,
    longitude: 120.9795,
  },
];

/** Hazards with their display color resolved, ready to send into the map. */
export function hazardsWithColor() {
  return SAMPLE_HAZARDS.map((hazard) => ({
    ...hazard,
    label: HAZARD_META[hazard.type].label,
    color: HAZARD_META[hazard.type].color,
  }));
}
