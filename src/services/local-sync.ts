import * as Location from 'expo-location';

import { isConditionsFresh, loadConditions, readCachedConditions } from '@/services/conditions';
import { getReports } from '@/services/reports';

const SYNC_LIMIT_MS = 15000;
const LOCATE_LIMIT_MS = 4000;

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function currentCoords() {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) return undefined;
    const fix = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      wait(LOCATE_LIMIT_MS).then(() => null),
    ]);
    if (!fix) return undefined;
    return { latitude: fix.coords.latitude, longitude: fix.coords.longitude };
  } catch {
    return undefined;
  }
}

/** Pulls conditions and reports from the cloud and stores them on the phone. */
export async function syncLocalData() {
  const coords = await currentCoords();
  await Promise.race([
    Promise.all([loadConditions(coords), getReports()]),
    wait(SYNC_LIMIT_MS),
  ]);
}

/** A recent on-device snapshot is enough to open without waiting on the network. */
export async function hasFreshLocalData() {
  const conditions = await readCachedConditions();
  return isConditionsFresh(conditions);
}
