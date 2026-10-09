import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type DimensionValue, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Brand, Colors } from '@/constants/theme';

const C = Colors.light;

type Pin = {
  key: string;
  label: string;
  color: string;
  top: DimensionValue;
  left: DimensionValue;
};

const PINS: Pin[] = [
  { key: 'baguio', label: 'Baguio City', color: Brand.green, top: '14%', left: '18%' },
  { key: 'quezon', label: 'Quezon City', color: Brand.yellow, top: '30%', left: '46%' },
  { key: 'cebu', label: 'Cebu City', color: Brand.green, top: '55%', left: '60%' },
  { key: 'davao', label: 'Davao City', color: '#E5484D', top: '74%', left: '72%' },
];

export function MapPlaceholder({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.map, style]}>
      {PINS.map((p) => (
        <View key={p.key} style={[styles.pin, { top: p.top, left: p.left }]}>
          <MaterialCommunityIcons name="map-marker" size={36} color={p.color} />
          <View style={styles.pinLabel}>
            <Text style={styles.pinLabelText}>{p.label}</Text>
          </View>
        </View>
      ))}

      <View style={[styles.pin, { top: '42%', left: '38%' }]}>
        <View style={styles.currentLocation} />
        <View style={styles.pinLabel}>
          <Text style={styles.pinLabelText}>Manila</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    backgroundColor: '#DCEBF2',
  },
  pin: {
    position: 'absolute',
    alignItems: 'center',
  },
  pinLabel: {
    marginTop: -6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    backgroundColor: C.background,
  },
  pinLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.text,
  },
  currentLocation: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2D7FF9',
    borderWidth: 3,
    borderColor: C.background,
  },
});
