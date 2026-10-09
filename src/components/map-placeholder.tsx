import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

export function MapPlaceholder({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.map, style]} />;
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    backgroundColor: '#DCEBF2',
  },
});
