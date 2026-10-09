import Constants, { AppOwnership } from 'expo-constants';

/**
 * True only inside the Expo Go app.
 * `expoGoConfig` is also set for an embedded app.config in a development build, so it cannot be used here.
 */
export function isExpoGo(): boolean {
  return Constants.appOwnership === AppOwnership.Expo;
}
