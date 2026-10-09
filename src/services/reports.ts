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

import { db } from '../../firebase';
import { isHazardType, type Hazard, type HazardType } from '@/constants/hazards';

export type NewReport = {
  type: HazardType;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
};

function asHazard(id: string, data: Record<string, unknown>): Hazard | null {
  const type = typeof data.type === 'string' && isHazardType(data.type) ? data.type : 'other';
  const latitude = Number(data.latitude);
  const longitude = Number(data.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    id,
    type,
    title: typeof data.title === 'string' ? data.title : '',
    description: typeof data.description === 'string' ? data.description : '',
    latitude,
    longitude,
  };
}

/** Writes a community report to the Firestore `reports` collection. */
export async function addReport(report: NewReport): Promise<string> {
  const ref = await addDoc(collection(db, 'reports'), {
    type: report.type,
    title: report.title,
    description: report.description,
    latitude: report.latitude,
    longitude: report.longitude,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** One-shot read of the newest reports. */
export async function getReports(): Promise<Hazard[]> {
  const reportsQuery = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(20));
  const snapshot = await getDocs(reportsQuery);
  return snapshot.docs
    .map((doc) => asHazard(doc.id, doc.data()))
    .filter((report): report is Hazard => report !== null);
}

/** Subscribes to live reports, newest first. */
export function subscribeReports(onChange: (reports: Hazard[]) => void): Unsubscribe {
  const reportsQuery = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));

  return onSnapshot(
    reportsQuery,
    (snapshot) => {
      const reports = snapshot.docs
        .map((doc) => asHazard(doc.id, doc.data()))
        .filter((report): report is Hazard => report !== null);
      onChange(reports);
    },
    () => {
      onChange([]);
    },
  );
}
