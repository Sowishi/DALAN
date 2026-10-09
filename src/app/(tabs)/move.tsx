import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Colors, Spacing } from '@/constants/theme';

const C = Colors.light;

type Mode = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

const MODES: Mode[] = [
  { key: 'walk', label: 'Walk', icon: 'walk' },
  { key: 'run', label: 'Run', icon: 'run' },
  { key: 'cycle', label: 'Cycle', icon: 'bike' },
  { key: 'drive', label: 'Drive', icon: 'car' },
];

const STATS = [
  { key: 'dist', label: 'Distance', value: '0.0', unit: 'km' },
  { key: 'time', label: 'Time', value: '00:00', unit: '' },
  { key: 'kcal', label: 'Calories', value: '0', unit: 'kcal' },
];

export default function MoveScreen() {
  const [mode, setMode] = useState('run');

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Move</Text>
          <Text style={styles.headerSubtitle}>Track your journey, your way</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.modeRow}>
            {MODES.map((m) => {
              const selected = mode === m.key;
              return (
                <Pressable
                  key={m.key}
                  accessibilityRole="button"
                  onPress={() => setMode(m.key)}
                  style={[styles.modeChip, selected && styles.modeChipActive]}>
                  <MaterialCommunityIcons
                    name={m.icon}
                    size={22}
                    color={selected ? Brand.white : C.text}
                  />
                  <Text style={[styles.modeLabel, selected && styles.modeLabelActive]}>
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.statsCard}>
            {STATS.map((s) => (
              <View key={s.key} style={styles.stat}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>
                  {s.unit ? `${s.label} (${s.unit})` : s.label}
                </Text>
              </View>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.startButton, { opacity: pressed ? 0.9 : 1 }]}>
            <MaterialCommunityIcons name="play" size={28} color={Brand.white} />
            <Text style={styles.startLabel}>Start</Text>
          </Pressable>

          <Text style={styles.sectionTitle}>This week</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <MaterialCommunityIcons name="map-marker-distance" size={22} color={Brand.green} />
              <Text style={styles.summaryValue}>18.4 km</Text>
              <Text style={styles.summaryLabel}>Distance</Text>
            </View>
            <View style={styles.summaryCard}>
              <MaterialCommunityIcons name="fire" size={22} color={Brand.yellow} />
              <Text style={styles.summaryValue}>1,240</Text>
              <Text style={styles.summaryLabel}>Calories</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  flex: { flex: 1 },
  header: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, gap: 2 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: C.text },
  headerSubtitle: { fontSize: 14, color: C.textSecondary },
  content: { padding: Spacing.three, gap: Spacing.three },
  modeRow: { flexDirection: 'row', gap: Spacing.two },
  modeChip: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: C.backgroundElement,
    borderWidth: 1.5,
    borderColor: C.backgroundSelected,
  },
  modeChipActive: { backgroundColor: Brand.green, borderColor: Brand.green },
  modeLabel: { fontSize: 13, fontWeight: '600', color: C.text },
  modeLabelActive: { color: Brand.white },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
    backgroundColor: C.backgroundElement,
    borderWidth: 1,
    borderColor: C.backgroundSelected,
  },
  stat: { alignItems: 'center', gap: Spacing.one },
  statValue: { fontSize: 26, fontWeight: '700', color: C.text },
  statLabel: { fontSize: 12, color: C.textSecondary },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 64,
    borderRadius: 32,
    backgroundColor: Brand.green,
  },
  startLabel: { fontSize: 18, fontWeight: '700', color: Brand.white },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: Spacing.one },
  summaryRow: { flexDirection: 'row', gap: Spacing.three },
  summaryCard: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: C.backgroundElement,
    borderWidth: 1,
    borderColor: C.backgroundSelected,
    gap: Spacing.one,
  },
  summaryValue: { fontSize: 20, fontWeight: '700', color: C.text },
  summaryLabel: { fontSize: 13, color: C.textSecondary },
});
