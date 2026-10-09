import { File } from 'expo-file-system';
import {
  addDoc,
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { db, storage } from '../../firebase';
import { isHazardType, type Hazard, type HazardType, type RiskLevel } from '@/constants/hazards';
import {
  attachLocalPhotos,
  downloadReportPhotos,
  mergeReports,
  persistPhotos,
  readCachedReports,
  readPendingReports,
  writeCachedReports,
  writePendingReports,
  type PendingReport,
} from '@/services/report-cache';

export type NewReport = {
  type: HazardType;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  photoUrl?: string;
  photoUrls?: string[];
  address?: string;
  severity?: RiskLevel;
};

const listeners = new Set<(reports: Hazard[]) => void>();
const inFlight = new Set<string>();
let lastRemote: Hazard[] = [];
let firestoreStarted = false;

function asSeverity(value: unknown): RiskLevel | undefined {
  return value === 'high' || value === 'moderate' || value === 'low' ? value : undefined;
}

function asHazard(id: string, data: Record<string, unknown>): Hazard | null {
  const type = typeof data.type === 'string' && isHazardType(data.type) ? data.type : 'other';
  const latitude = Number(data.latitude);
  const longitude = Number(data.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const photos = asPhotoUrls(data);

  return {
    id,
    type,
    title: typeof data.title === 'string' ? data.title : '',
    description: typeof data.description === 'string' ? data.description : '',
    latitude,
    longitude,
    createdAt: asMillis(data.createdAt),
    photoUrl: photos[0],
    photoUrls: photos.length ? photos : undefined,
    address: typeof data.address === 'string' ? data.address : undefined,
    severity: asSeverity(data.severity),
  };
}

function asPhotoUrls(data: Record<string, unknown>): string[] {
  const listed = Array.isArray(data.photoUrls)
    ? data.photoUrls.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];
  if (listed.length) return listed;
  return typeof data.photoUrl === 'string' && data.photoUrl.length > 0 ? [data.photoUrl] : [];
}

function asMillis(value: unknown): number | undefined {
  if (value && typeof value === 'object' && 'toMillis' in value) {
    const stamp = value as { toMillis?: () => number };
    if (typeof stamp.toMillis === 'function') return stamp.toMillis();
  }
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return undefined;
}

function publish(reports: Hazard[]) {
  listeners.forEach((listener) => listener(reports));
}

async function emitMerged(remote = lastRemote) {
  const pending = await readPendingReports();
  const hydrated = await attachLocalPhotos(mergeReports(remote, pending));
  await writeCachedReports(hydrated);
  publish(hydrated);
  return hydrated;
}

async function refreshFromSnapshot(remote: Hazard[]) {
  lastRemote = remote;
  await emitMerged(remote);
  const downloaded = await downloadReportPhotos(remote);
  const pending = await readPendingReports();
  const merged = mergeReports(downloaded, pending);
  publish(merged);
  await writeCachedReports(merged);
}

function ensureFirestore() {
  if (firestoreStarted) return;
  firestoreStarted = true;
  const reportsQuery = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));

  onSnapshot(
    reportsQuery,
    (snapshot) => {
      const reports = snapshot.docs
        .map((doc) => asHazard(doc.id, doc.data()))
        .filter((report): report is Hazard => report !== null);
      void refreshFromSnapshot(reports);
      void flushPendingReports();
    },
    (error) => {
      console.warn('Could not subscribe to reports', error);
      void emitMerged(lastRemote);
    },
  );
}

async function writeReportDoc(report: NewReport): Promise<string> {
  const docRef = await addDoc(collection(db, 'reports'), {
    type: report.type,
    title: report.title,
    description: report.description,
    latitude: report.latitude,
    longitude: report.longitude,
    createdAt: serverTimestamp(),
    ...(report.photoUrl ? { photoUrl: report.photoUrl } : {}),
    ...(report.photoUrls?.length ? { photoUrls: report.photoUrls } : {}),
    ...(report.address ? { address: report.address } : {}),
    ...(report.severity ? { severity: report.severity } : {}),
  });
  return docRef.id;
}

async function removePending(localId: string) {
  const pending = await readPendingReports();
  await writePendingReports(pending.filter((item) => item.localId !== localId));
}

function toNewReport(item: PendingReport, photoUrls: string[]): NewReport {
  return {
    type: item.type,
    title: item.title,
    description: item.description,
    latitude: item.latitude,
    longitude: item.longitude,
    address: item.address,
    severity: item.severity,
    photoUrl: photoUrls[0],
    photoUrls,
  };
}

/** Writes a community report, keeping a local copy so it stays visible offline. */
export async function addReport(report: NewReport): Promise<string> {
  const originals = report.photoUrls ?? (report.photoUrl ? [report.photoUrl] : []);
  const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const localPhotos = originals.length ? await persistPhotos(originals, localId) : [];

  const pending: PendingReport = {
    localId,
    type: report.type,
    title: report.title,
    description: report.description,
    latitude: report.latitude,
    longitude: report.longitude,
    address: report.address,
    severity: report.severity,
    localPhotos,
    createdAt: Date.now(),
  };

  const queued = await readPendingReports();
  await writePendingReports([pending, ...queued]);
  await emitMerged();

  inFlight.add(localId);
  try {
    const remotePhotos = localPhotos.length ? await uploadReportPhotos(localPhotos) : [];
    const id = await writeReportDoc(toNewReport(pending, remotePhotos));
    if (localPhotos.length) await persistPhotos(localPhotos, id);
    await removePending(localId);
    await emitMerged();
    return id;
  } catch {
    return localId;
  } finally {
    inFlight.delete(localId);
  }
}

async function readPhotoBytes(localUri: string): Promise<Uint8Array> {
  const file = new File(localUri);
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer);
}

/** Uploads a local report photo and returns a public download URL. */
export async function uploadReportPhoto(localUri: string): Promise<string> {
  const bytes = await readPhotoBytes(localUri);
  const path = `reports/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, bytes, { contentType: 'image/jpeg' });
  return getDownloadURL(fileRef);
}

/** Uploads every attached photo and returns the URLs that succeeded. */
export async function uploadReportPhotos(localUris: string[]): Promise<string[]> {
  const urls: string[] = [];
  for (const uri of localUris) {
    try {
      urls.push(await uploadReportPhoto(uri));
    } catch {
      // Keep the report even if one photo fails.
    }
  }
  return urls;
}

/** Syncs reports that were saved while offline. */
export async function flushPendingReports() {
  const pending = await readPendingReports();
  if (!pending.length) return;

  const kept: PendingReport[] = [];
  let changed = false;

  for (const item of pending) {
    if (inFlight.has(item.localId)) {
      kept.push(item);
      continue;
    }

    inFlight.add(item.localId);
    try {
      const remotePhotos = item.localPhotos.length ? await uploadReportPhotos(item.localPhotos) : [];
      const id = await writeReportDoc(toNewReport(item, remotePhotos));
      if (item.localPhotos.length) await persistPhotos(item.localPhotos, id);
      changed = true;
    } catch {
      kept.push(item);
    } finally {
      inFlight.delete(item.localId);
    }
  }

  if (changed || kept.length !== pending.length) {
    await writePendingReports(kept);
    await emitMerged();
  }
}

/** One-shot read of the newest reports, falling back to the on-device cache. */
export async function getReports(): Promise<Hazard[]> {
  try {
    const reportsQuery = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(20));
    const snapshot = await getDocs(reportsQuery);
    const reports = snapshot.docs
      .map((doc) => asHazard(doc.id, doc.data()))
      .filter((report): report is Hazard => report !== null);
    lastRemote = reports;
    const hydrated = await emitMerged(reports);
    void downloadReportPhotos(reports).then(async (downloaded) => {
      const pending = await readPendingReports();
      const merged = mergeReports(downloaded, pending);
      publish(merged);
      await writeCachedReports(merged);
    });
    return hydrated;
  } catch {
    const cached = await readCachedReports();
    return emitMerged(lastRemote.length ? lastRemote : cached);
  }
}

/** Subscribes to live reports and hydrates immediately from the local cache. */
export function subscribeReports(onChange: (reports: Hazard[]) => void): Unsubscribe {
  listeners.add(onChange);

  void (async () => {
    const cached = await readCachedReports();
    const pending = await readPendingReports();
    const merged = await attachLocalPhotos(mergeReports(cached, pending));
    if (merged.length) onChange(merged);
  })();

  ensureFirestore();
  void flushPendingReports();

  return () => {
    listeners.delete(onChange);
  };
}
