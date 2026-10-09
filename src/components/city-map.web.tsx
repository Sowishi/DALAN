import { StyleProp, ViewStyle } from 'react-native';

import { MapPlaceholder } from './map-placeholder';

// expo-maps does not support web — always render the styled placeholder.
export function CityMap({ style }: { style?: StyleProp<ViewStyle> }) {
  return <MapPlaceholder style={style} />;
}
