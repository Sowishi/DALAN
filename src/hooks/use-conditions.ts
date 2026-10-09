import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { loadConditions, readCachedConditions, type Conditions } from '@/services/conditions';

export function useConditions() {
  const [conditions, setConditions] = useState<Conditions | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const cached = await readCachedConditions();
      if (cached && active) {
        setConditions(cached);
        setOffline(true);
      }

      let coords: { latitude: number; longitude: number } | undefined;
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === Location.PermissionStatus.GRANTED) {
        try {
          const fix = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          coords = { latitude: fix.coords.latitude, longitude: fix.coords.longitude };
        } catch {
          // Use cached coordinates if GPS is unavailable.
        }
      }

      const result = await loadConditions(coords);
      if (!active) return;
      setConditions(result.data);
      setOffline(result.offline);
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  return { conditions, offline };
}
