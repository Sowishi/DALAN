import * as FileSystem from 'expo-file-system/legacy';

import type { Hazard, HazardType, RiskLevel } from '@/constants/hazards';

const root = FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '';
const REPORTS_PATH = root ? `${root}dalan-reports.json` : '';
const PENDING_PATH = root ? `${root}dalan-pending-reports.json` : '';
const PHOTO_DIR = root ? `${root}report-photos/` : '';
const MAX_PHOTOS = 4;

export type PendingReport = {
  localId: string;
  type: HazardType;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  severity?: RiskLevel;
  localPhotos: string[];
  createdAt: number;
};

function photoPath(reportId: string, index: number) {
  return `${PHOTO_DIR}${reportId}-${index}.jpg`;
}

function isHazard(item: unknown): item is Hazard {
  if (!item || typeof item !== 'object') return false;
  const report = item as Hazard;
  return (
    typeof report.id === 'string' &&
    Number.isFinite(report.latitude) &&
    Number.isFinite(report.longitude)
  );
}

async function ensurePhotoDir() {
  if (!PHOTO_DIR) return;
  const info = await FileSystem.getInfoAsync(PHOTO_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  }
}

export async function readCachedReports(): Promise<Hazard[]> {
  try {
    if (!REPORTS_PATH) return [];
    const info = await FileSystem.getInfoAsync(REPORTS_PATH);
    if (!info.exists) return [];
    const raw = await FileSystem.readAsStringAsync(REPORTS_PATH);
    const data = JSON.parse(raw) as unknown;
    return Array.isArray(data) ? data.filter(isHazard) : [];
  } catch {
    return [];
  }
}

export async function writeCachedReports(reports: Hazard[]) {
  try {
    if (!REPORTS_PATH) return;
    await FileSystem.writeAsStringAsync(REPORTS_PATH, JSON.stringify(reports));
  } catch {
    // Offline cache is best-effort.
  }
}

export async function readPendingReports(): Promise<PendingReport[]> {
  try {
    if (!PENDING_PATH) return [];
    const info = await FileSystem.getInfoAsync(PENDING_PATH);
    if (!info.exists) return [];
    const raw = await FileSystem.readAsStringAsync(PENDING_PATH);
    const data = JSON.parse(raw) as unknown;
    return Array.isArray(data) ? (data as PendingReport[]) : [];
  } catch {
    return [];
  }
}

export async function writePendingReports(pending: PendingReport[]) {
  try {
    if (!PENDING_PATH) return;
    await FileSystem.writeAsStringAsync(PENDING_PATH, JSON.stringify(pending));
  } catch {
    // Offline queue is best-effort.
  }
}

export async function cachedPhotoUri(reportId: string, index: number): Promise<string | null> {
  if (!PHOTO_DIR) return null;
  try {
    const dest = photoPath(reportId, index);
    const info = await FileSystem.getInfoAsync(dest);
    return info.exists ? dest : null;
  } catch {
    return null;
  }
}

export async function persistPhoto(
  sourceUri: string,
  reportId: string,
  index: number,
): Promise<string | null> {
  if (!PHOTO_DIR || !sourceUri) return null;
  await ensurePhotoDir();
  const dest = photoPath(reportId, index);
  try {
    const existing = await FileSystem.getInfoAsync(dest);
    if (existing.exists) return dest;

    if (sourceUri.startsWith('http://') || sourceUri.startsWith('https://')) {
      const result = await FileSystem.downloadAsync(sourceUri, dest);
      return result.uri || dest;
    }

    await FileSystem.copyAsync({ from: sourceUri, to: dest });
    return dest;
  } catch {
    return sourceUri.startsWith('file') ? sourceUri : null;
  }
}

export async function persistPhotos(uris: string[], reportId: string): Promise<string[]> {
  const saved: string[] = [];
  for (let index = 0; index < uris.length; index += 1) {
    const local = await persistPhoto(uris[index], reportId, index);
    if (local) saved.push(local);
  }
  return saved;
}

async function localPhotoList(reportId: string, remotes: string[]): Promise<string[]> {
  const next: string[] = [];
  if (remotes.length) {
    for (let index = 0; index < remotes.length; index += 1) {
      next.push((await cachedPhotoUri(reportId, index)) ?? remotes[index]);
    }
    return next;
  }

  for (let index = 0; index < MAX_PHOTOS; index += 1) {
    const cached = await cachedPhotoUri(reportId, index);
    if (!cached) break;
    next.push(cached);
  }
  return next;
}

/** Prefer on-disk copies so map and alerts can show photos without a network. */
export async function attachLocalPhotos(reports: Hazard[]): Promise<Hazard[]> {
  return Promise.all(
    reports.map(async (report) => {
      const remotes = report.photoUrls ?? (report.photoUrl ? [report.photoUrl] : []);
      const next = await localPhotoList(report.id, remotes);
      if (!next.length) return report;
      return { ...report, photoUrl: next[0], photoUrls: next };
    }),
  );
}

/** Copy any missing remote photos into the document directory. */
export async function downloadReportPhotos(reports: Hazard[]): Promise<Hazard[]> {
  return Promise.all(
    reports.map(async (report) => {
      const remotes = report.photoUrls ?? (report.photoUrl ? [report.photoUrl] : []);
      if (!remotes.length) {
        const recovered = await localPhotoList(report.id, []);
        if (!recovered.length) return report;
        return { ...report, photoUrl: recovered[0], photoUrls: recovered };
      }

      const next: string[] = [];
      for (let index = 0; index < remotes.length; index += 1) {
        const uri = remotes[index];
        if (uri.startsWith('file') || uri.startsWith('/')) {
          next.push(uri);
          continue;
        }
        next.push((await persistPhoto(uri, report.id, index)) ?? uri);
      }
      return { ...report, photoUrl: next[0], photoUrls: next };
    }),
  );
}

export function pendingToHazard(pending: PendingReport): Hazard {
  return {
    id: pending.localId,
    type: pending.type,
    title: pending.title,
    description: pending.description,
    latitude: pending.latitude,
    longitude: pending.longitude,
    createdAt: pending.createdAt,
    photoUrl: pending.localPhotos[0],
    photoUrls: pending.localPhotos.length ? pending.localPhotos : undefined,
    address: pending.address,
    severity: pending.severity,
  };
}

export function mergeReports(remote: Hazard[], pending: PendingReport[]): Hazard[] {
  const remoteIds = new Set(remote.map((report) => report.id));
  const extra = pending.map(pendingToHazard).filter((report) => !remoteIds.has(report.id));
  return [...extra, ...remote];
}
