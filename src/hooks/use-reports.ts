import { useEffect, useState } from 'react';

import type { Hazard } from '@/constants/hazards';
import { subscribeReports } from '@/services/reports';

/** Live community reports from Firestore. */
export function useReports() {
  const [reports, setReports] = useState<Hazard[]>([]);

  useEffect(() => {
    return subscribeReports(setReports);
  }, []);

  return reports;
}
