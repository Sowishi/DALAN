import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform, StyleProp, ViewStyle } from 'react-native';

import { MapPlaceholder } from './map-placeholder';

// expo-maps ships native code, so it only works in a development build — not Expo Go.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const CAMERA = {
  coordinates: { latitude: 12.8797, longitude: 121.774 },
  zoom: 5,
};

export function CityMap({ style }: { style?: StyleProp<ViewStyle> }) {
  if (isExpoGo) {
    return <MapPlaceholder style={style} />;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { AppleMaps, GoogleMaps } = require('expo-maps');

  if (Platform.OS === 'ios') {
    return (
      <AppleMaps.View
        style={style}
        cameraPosition={CAMERA}
        properties={{ isMyLocationEnabled: true }}
      />
    );
  }

  if (Platform.OS === 'android') {
    return (
      <GoogleMaps.View
        style={style}
        cameraPosition={CAMERA}
        properties={{ isMyLocationEnabled: true }}
      />
    );
  }

  return <MapPlaceholder style={style} />;
}
