import { ConfigContext, ExpoConfig } from 'expo/config';

// Extends the static app.json and injects the Android Google Maps API key
// from the GOOGLE_MAP environment variable (loaded from .env at build time).
// Note: native map keys are embedded in the app binary — restrict this key by
// package name + SHA-1 in Google Cloud. iOS uses Apple Maps (no key needed).
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'DALAN',
  slug: config.slug ?? 'DALAN',
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: {
        apiKey: process.env.GOOGLE_MAP,
      },
    },
  },
});
