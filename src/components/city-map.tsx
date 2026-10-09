import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform, StyleProp, ViewStyle } from 'react-native';

import { Brand } from '@/constants/theme';

import { MapPlaceholder } from './map-placeholder';

// expo-maps ships native code, so it only works in a development build — not Expo Go.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const CITIES = [
  { id: 'baguio', title: 'Baguio City', latitude: 16.4023, longitude: 120.596 },
  { id: 'quezon', title: 'Quezon City', latitude: 14.676, longitude: 121.0437 },
  { id: 'manila', title: 'Manila', latitude: 14.5995, longitude: 120.9842 },
  { id: 'cebu', title: 'Cebu City', latitude: 10.3157, longitude: 123.8854 },
  { id: 'davao', title: 'Davao City', latitude: 7.1907, longitude: 125.4553 },
];

const CAMERA = {
  coordinates: { latitude: 12.8797, longitude: 121.774 },
  zoom: 5,
};

export function CityMap({ style }: { style?: StyleProp<ViewStyle> }) {
  // Expo Go can't load the native module — show the placeholder instead.
  if (isExpoGo) {
    return <MapPlaceholder style={style} />;
  }

  // Lazy require so the native module is never evaluated under Expo Go.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { AppleMaps, GoogleMaps } = require('expo-maps');

  const markers = CITIES.map((c) => ({
    id: c.id,
    coordinates: { latitude: c.latitude, longitude: c.longitude },
    title: c.title,
  }));

  if (Platform.OS === 'ios') {
    return (
      <AppleMaps.View
        style={style}
        cameraPosition={CAMERA}
        markers={markers.map((m) => ({ ...m, tintColor: Brand.green }))}
        properties={{ isMyLocationEnabled: true }}
      />
    );
  }

  if (Platform.OS === 'android') {
    return (
      <GoogleMaps.View
        style={style}
        cameraPosition={CAMERA}
        markers={markers}
        properties={{ isMyLocationEnabled: true }}
      />
    );
  }

  return <MapPlaceholder style={style} />;
}
