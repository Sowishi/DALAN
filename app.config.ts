import { ConfigContext, ExpoConfig } from 'expo/config';
import { withGradleProperties, type ConfigPlugin } from 'expo/config-plugins';

// android/ is generated and gitignored. Re-apply local build settings on prebuild
// so a clean native project stays arm64-only with a warm Gradle cache.
const withAndroidBuildSpeed: ConfigPlugin = (config) =>
  withGradleProperties(config, (cfg) => {
    const set = (key: string, value: string) => {
      const item = cfg.modResults.find((entry) => entry.type === 'property' && entry.key === key);
      if (item && item.type === 'property') {
        item.value = value;
        return;
      }
      cfg.modResults.push({ type: 'property', key, value });
    };

    set('reactNativeArchitectures', 'arm64-v8a');
    set('org.gradle.jvmargs', '-Xmx4g -XX:MaxMetaspaceSize=512m');
    set('org.gradle.parallel', 'true');
    set('org.gradle.daemon', 'true');
    set('org.gradle.caching', 'true');
    return cfg;
  });

// Extends the static app.json and injects the Android Google Maps API key
// from the GOOGLE_MAP environment variable (loaded from .env at build time).
// Note: native map keys are embedded in the app binary — restrict this key by
// package name + SHA-1 in Google Cloud. iOS uses Apple Maps (no key needed).
export default ({ config }: ConfigContext): ExpoConfig =>
  withAndroidBuildSpeed({
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
