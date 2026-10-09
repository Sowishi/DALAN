import { HAZARD_META, riskForHazard, type Hazard, type HazardType } from '@/constants/hazards';
import { addReport, getReports } from '@/services/reports';
import { distanceMeters, type LatLng } from '@/utils/geo';

export type PendingReport = {
  type: HazardType;
  description: string;
  awaiting: 'confirm' | 'location';
};

const TYPE_ALIASES: { type: HazardType; words: string[] }[] = [
  { type: 'flood', words: ['flood', 'flooding', 'flooded', 'water'] },
  { type: 'accident', words: ['accident', 'crash', 'collision'] },
  { type: 'closure', words: ['closure', 'closed', 'road closed'] },
  { type: 'hazard', words: ['hazard'] },
  { type: 'manhole', words: ['manhole'] },
  { type: 'garbage', words: ['garbage', 'trash', 'rubbish'] },
  { type: 'pothole', words: ['pothole', 'pot hole'] },
  { type: 'debris', words: ['debris', 'fallen tree', 'branch'] },
  { type: 'construction', words: ['construction', 'roadwork', 'repair'] },
  { type: 'other', words: ['other'] },
];

/** Compact live-report list for Dally's prompt and replies. */
export function summarizeReports(reports: Hazard[]): string {
  if (!reports.length) return 'No live reports right now.';
  return reports
    .slice(0, 8)
    .map((report) => {
      const label = HAZARD_META[report.type]?.label ?? 'Other';
      const note = report.description ? ` — ${report.description.slice(0, 60)}` : '';
      return `${label}${note}`;
    })
    .join('\n');
}

export async function listReports() {
  const reports = await getReports();
  return { reports, summary: summarizeReports(reports) };
}

export async function submitReport(input: {
  type: HazardType;
  description: string;
  latitude: number;
  longitude: number;
}) {
  return addReport({
    type: input.type,
    title: HAZARD_META[input.type].label,
    description: input.description,
    latitude: input.latitude,
    longitude: input.longitude,
  });
}

export function detectHazardType(text: string): HazardType | null {
  const lower = text.toLowerCase();
  for (const { type, words } of TYPE_ALIASES) {
    if (words.some((word) => lower.includes(word))) return type;
  }
  return null;
}

export function isReportIntent(text: string): boolean {
  const lower = text.toLowerCase();
  const asksToFile = /\b(report|file|submit|post|log)\b/.test(lower);
  const mentionsSpot =
    detectHazardType(lower) !== null && /\b(there is|there's|saw|found|please)\b/.test(lower);
  return asksToFile || mentionsSpot;
}

export function isListIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    /\b(any|what|list|show|nearby|out there|on the (map|road)|hindrance|reports?)\b/.test(lower) &&
    /\b(flood|debris|pothole|garbage|manhole|hazard|accident|closure|construction|hindrance|report|nearby)\b/.test(
      lower,
    )
  );
}

export function isAffirmative(text: string): boolean {
  return /^(yes|yeah|yep|yup|ok|okay|sure|confirm|do it|please|go ahead|y)\b/i.test(text.trim());
}

export function isNegative(text: string): boolean {
  return /^(no|nope|nah|cancel|stop|don't|dont|never mind|nevermind)\b/i.test(text.trim());
}

export function extractDetails(text: string, type: HazardType): string {
  const label = HAZARD_META[type].label;
  const stripped = text
    .replace(/\b(report|file|submit|post|log|a|an|the|please|can you|could you)\b/gi, ' ')
    .replace(new RegExp(label, 'ig'), ' ')
    .replace(new RegExp(type, 'ig'), ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped;
}

const NEARBY_M = 2000;

function formatDistance(meters: number) {
  if (meters < 80) return 'under 80 m away';
  if (meters < 1000) return `about ${Math.round(meters / 10) * 10} m away`;
  const km = meters / 1000;
  const shown = km < 10 ? km.toFixed(1) : String(Math.round(km));
  return `about ${shown} km away`;
}

function placeOf(report: Hazard) {
  const address = report.address?.trim();
  if (address) return address;
  const note = report.description.replace(/severity:\s*(low|moderate|high)/gi, '').replace(/\s+/g, ' ').trim();
  return note ? note.slice(0, 80) : null;
}

function riskPhrase(report: Hazard) {
  const level = riskForHazard(report);
  if (level === 'high') return 'high risk';
  if (level === 'moderate') return 'moderate risk';
  return 'low risk';
}

function floodOutlookLine(label?: string | null) {
  if (label === 'High') return ' River levels are high here, so roads may still flood.';
  if (label === 'Watch') return ' River levels are up, so watch for water on the road.';
  return '';
}

function describeReport(report: Hazard, meters: number | null) {
  const where = placeOf(report);
  const risk = riskPhrase(report);
  const distance = meters == null ? null : formatDistance(meters);
  if (distance && where) return `${distance}, ${risk}, near ${where}`;
  if (distance) return `${distance}, ${risk}`;
  if (where) return `${risk}, near ${where}`;
  return risk;
}

/** Plain answer for “any flooding nearby?” and similar questions. */
export function formatListReply(
  reports: Hazard[],
  question: string,
  origin: LatLng | null,
  floodOutlook?: string | null,
) {
  const type = detectHazardType(question);
  const focused = type ? reports.filter((report) => report.type === type) : reports;
  const name = type ? HAZARD_META[type].label.toLowerCase() : 'hindrances';
  const outlook = type === 'flood' ? floodOutlookLine(floodOutlook) : '';

  const ranked = focused
    .map((report) => ({
      report,
      meters: origin ? distanceMeters(origin, report) : null,
    }))
    .sort((a, b) => (a.meters ?? Number.POSITIVE_INFINITY) - (b.meters ?? Number.POSITIVE_INFINITY));

  if (!ranked.length) {
    const subject = type === 'flood' ? 'flooding' : name;
    return `No ${subject} is reported on the map right now.${outlook}`;
  }

  const nearby = origin ? ranked.filter((item) => (item.meters ?? Infinity) <= NEARBY_M) : ranked;
  const shown = (nearby.length ? nearby : ranked).slice(0, 3);

  if (origin && !nearby.length) {
    const closest = ranked[0];
    const detail = describeReport(closest.report, closest.meters);
    const subject = type === 'flood' ? 'flooding' : name;
    return `No ${subject} within 2 km of you. The closest report is ${detail}.${outlook}`;
  }

  const details = shown.map((item) => describeReport(item.report, item.meters));
  const count = nearby.length;

  if (type === 'flood') {
    const advice = ' Slow down and stay out of deep water.';
    const lead = !origin
      ? ranked.length === 1
        ? 'There is 1 flooding report on the map. I do not have your location, so I cannot tell if it is nearby.'
        : `There are ${ranked.length} flooding reports on the map. I do not have your location, so I cannot tell which are nearby.`
      : count === 1
        ? 'Yes. Flooding is reported nearby.'
        : `Yes. ${count} flooding reports are nearby.`;
    if (details.length === 1) return `${lead}${origin ? advice : ''} It is ${details[0]}.`;
    const lines = details.map((line) => `• ${line.charAt(0).toUpperCase()}${line.slice(1)}.`).join('\n');
    return `${lead}${origin ? advice : ''}\n${lines}`;
  }

  const lead = origin
    ? count === 1
      ? `One ${name} report is nearby.`
      : `${count} ${name} reports are nearby.`
    : count === 1
      ? `One ${name} report is on the map. I do not have your location, so I cannot say how close it is.`
      : `${count} ${name} reports are on the map. I do not have your location, so I cannot say which is closest.`;

  if (details.length === 1) return `${lead} It is ${details[0]}.`;
  return `${lead}\n${details.map((line) => `• ${line.charAt(0).toUpperCase()}${line.slice(1)}.`).join('\n')}`;
}
