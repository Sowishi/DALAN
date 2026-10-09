import { useEffect, useState } from 'react';
import { PermissionsAndroid, Platform, StyleProp, ViewStyle } from 'react-native';

import { isExpoGo } from '@/utils/is-expo-go';

import { MapPlaceholder } from './map-placeholder';

const CAMERA = {
  coordinates: { latitude: 12.8797, longitude: 121.774 },
  zoom: 5,
};

export function CityMap({ style }: { style?: StyleProp<ViewStyle> }) {
  if (isExpoGo() || (Platform.OS !== 'ios' && Platform.OS !== 'android')) {
    return <MapPlaceholder style={style} />;
  }

  return <NativeCityMap style={style} />;
}

function NativeCityMap({ style }: { style?: StyleProp<ViewStyle> }) {
  const myLocationEnabled = useMyLocationEnabled();

  // Lazy require so Expo Go never loads the native module.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { AppleMaps, GoogleMaps } = require('expo-maps');

  if (Platform.OS === 'ios') {
    return (
      <AppleMaps.View
        style={style}
        cameraPosition={CAMERA}
        properties={{ isMyLocationEnabled: myLocationEnabled }}
      />
    );
  }

  return (
    <GoogleMaps.View
      style={style}
      cameraPosition={CAMERA}
      properties={{ isMyLocationEnabled: myLocationEnabled }}
    />
  );
}

function useMyLocationEnabled() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      setEnabled(true);
      return;
    }

    let active = true;

    const enableIfGranted = async () => {
      const permission = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
      const alreadyGranted = await PermissionsAndroid.check(permission);
      const granted =
        alreadyGranted ||
        (await PermissionsAndroid.request(permission)) === PermissionsAndroid.RESULTS.GRANTED;
      if (active) setEnabled(granted);
    };

    void enableIfGranted();

    return () => {
      active = false;
    };
  }, []);

  return enabled;
}
