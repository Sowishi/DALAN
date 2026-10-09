import { HAZARD_META, type Hazard, type HazardType } from '@/constants/hazards';
import { addReport, getReports } from '@/services/reports';

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

export function formatListReply(reports: Hazard[], summary: string): string {
  if (!reports.length) {
    return 'I do not see any live hindrances right now. You can file one if you spot something.';
  }
  return `Here is what is on the map:\n${summary}`;
}
