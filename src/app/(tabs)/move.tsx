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

const WEEKLY = [
  {
    key: 'dist',
    label: 'Distance',
    value: '18.4 km',
    icon: 'map-marker-distance' as const,
    color: Brand.green,
  },
  { key: 'kcal', label: 'Calories', value: '1,240', icon: 'fire' as const, color: '#F76808' },
];

export default function MoveScreen() {
  const [mode, setMode] = useState('run');
  const [running, setRunning] = useState(false);

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
                  accessibilityState={{ selected }}
                  accessibilityLabel={m.label}
                  onPress={() => setMode(m.key)}
                  style={({ pressed }) => [
                    styles.modeChip,
                    selected && styles.modeChipActive,
                    pressed && styles.pressed,
                  ]}>
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
                <Text style={styles.statLabel}>{s.unit ? `${s.label} (${s.unit})` : s.label}</Text>
              </View>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={running ? 'Pause activity' : 'Start activity'}
            onPress={() => setRunning((r) => !r)}
            style={({ pressed }) => [
              styles.startButton,
              running && styles.startButtonActive,
              pressed && styles.pressed,
            ]}>
            <MaterialCommunityIcons
              name={running ? 'pause' : 'play'}
              size={28}
              color={Brand.white}
            />
            <Text style={styles.startLabel}>{running ? 'Pause' : 'Start'}</Text>
          </Pressable>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This week</Text>
            <View style={styles.summaryRow}>
              {WEEKLY.map((w) => (
                <View key={w.key} style={styles.summaryCard}>
                  <View style={[styles.summaryIcon, { backgroundColor: `${w.color}1A` }]}>
                    <MaterialCommunityIcons name={w.icon} size={20} color={w.color} />
                  </View>
                  <Text style={styles.summaryValue}>{w.value}</Text>
                  <Text style={styles.summaryLabel}>{w.label}</Text>
                </View>
              ))}
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
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    gap: Spacing.half,
  },
  headerTitle: { fontSize: 32, fontWeight: '700', color: C.text, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 15, color: C.textSecondary },
  content: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.four },
  modeRow: { flexDirection: 'row', gap: Spacing.two },
  modeChip: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: C.backgroundElement,
  },
  modeChipActive: { backgroundColor: Brand.green },
  modeLabel: { fontSize: 13, fontWeight: '600', color: C.text },
  modeLabelActive: { color: Brand.white },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
    backgroundColor: C.backgroundElement,
  },
  stat: { alignItems: 'center', gap: Spacing.one },
  statValue: { fontSize: 28, fontWeight: '700', color: C.text, letterSpacing: -0.5 },
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
  startButtonActive: { backgroundColor: '#F76808' },
  startLabel: { fontSize: 18, fontWeight: '700', color: Brand.white },
  section: { gap: Spacing.two },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  summaryRow: { flexDirection: 'row', gap: Spacing.three },
  summaryCard: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: C.backgroundElement,
    gap: Spacing.two,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: { fontSize: 22, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  summaryLabel: { fontSize: 13, color: C.textSecondary },
  pressed: { opacity: 0.7 },
});
