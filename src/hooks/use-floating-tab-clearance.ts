import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FloatingTab } from '@/constants/theme';

/** Space to keep content above the floating tab bar. */
export function useFloatingTabClearance() {
  const { bottom } = useSafeAreaInsets();
  return FloatingTab.height + FloatingTab.gap + Math.max(bottom, 12);
}

// FloatingTab.gap is the breathing room between the bar and content above it.
