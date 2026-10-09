import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Pressable } from '@/components/haptic-pressable';
import {
  RISK_COLORS,
  RISK_LABELS,
  RISK_LEVELS,
  categoriesForRisk,
} from '@/constants/hazards';
import { Colors } from '@/constants/theme';

const C = Colors.light;

const SHORT_LABEL: Record<(typeof RISK_LEVELS)[number], string> = {
  high: 'High',
  moderate: 'Moderate',
  low: 'Low',
};

export function RiskLegend() {
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.card, open && styles.cardOpen]} pointerEvents="auto">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={open ? 'Collapse legend' : 'Expand legend'}
        onPress={() => setOpen((value) => !value)}
        style={styles.header}>
        <Text style={styles.title}>Legend</Text>
        {!open
          ? RISK_LEVELS.map((level) => (
              <View key={level} style={styles.inline}>
                <View style={[styles.swatch, { backgroundColor: RISK_COLORS[level] }]} />
                <Text style={styles.inlineLabel}>{SHORT_LABEL[level]}</Text>
              </View>
            ))
          : null}
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={C.textSecondary} />
      </Pressable>
      {open
        ? RISK_LEVELS.map((level) => (
            <View key={level} style={styles.row}>
              <View style={[styles.swatch, { backgroundColor: RISK_COLORS[level], marginTop: 3 }]} />
              <View style={styles.copy}>
                <Text style={styles.label}>{RISK_LABELS[level]}</Text>
                <Text style={styles.cats}>{categoriesForRisk(level).join(' · ')}</Text>
              </View>
            </View>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  cardOpen: {
    width: 220,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    minHeight: 28,
    gap: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
    letterSpacing: 0.2,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inlineLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  copy: { flex: 1, minWidth: 0, gap: 1 },
  label: { fontSize: 13, fontWeight: '700', color: C.text },
  cats: { fontSize: 11, lineHeight: 14, color: C.textSecondary },
});
