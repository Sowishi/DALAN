import Constants from 'expo-constants';

/** True only in the Expo Go app — not in dev or production builds. */
export function isExpoGo(): boolean {
  return Constants.expoGoConfig != null;
}
