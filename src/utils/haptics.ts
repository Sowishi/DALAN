import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Light tap for buttons and tabs. No-ops on web and if the native module is unavailable. */
export function pressHaptic() {
  if (Platform.OS === 'web') return;
  const pulse =
    Platform.OS === 'android'
      ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Context_Click)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  void pulse.catch(() => undefined);
}
