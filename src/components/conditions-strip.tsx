import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import type { Conditions } from '@/services/conditions';

const C = Colors.light;

type ConditionsStripProps = {
  conditions: Conditions | null;
  offline?: boolean;
};

export function ConditionsStrip({ conditions, offline }: ConditionsStripProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {items(conditions).map((item) => (
          <View key={item.key} style={styles.item}>
            <Ionicons name={item.icon} size={14} color={C.textSecondary} />
            <Text style={styles.text}>{item.text}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.meta}>
        {conditions
          ? offline
            ? `Offline · ${formatUpdated(conditions.updatedAt)}`
            : formatUpdated(conditions.updatedAt)
          : 'Getting local conditions…'}
      </Text>
    </View>
  );
}

function formatUpdated(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function items(data: Conditions | null) {
  return [
    {
      key: 'temp',
      icon: 'thermometer-outline' as const,
      text: data?.temperatureC !== null && data ? `${data.temperatureC}°` : '—',
    },
    {
      key: 'weather',
      icon: 'partly-sunny-outline' as const,
      text: data?.weatherLabel ?? '—',
    },
    {
      key: 'humidity',
      icon: 'water-outline' as const,
      text: data?.humidity !== null && data ? `${data.humidity}%` : '—',
    },
    {
      key: 'air',
      icon: 'leaf-outline' as const,
      text: data?.aqiLabel ?? '—',
    },
    {
      key: 'flood',
      icon: 'warning-outline' as const,
      text: data?.floodLabel ?? '—',
    },
  ];
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 12,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    color: C.text,
  },
  meta: {
    fontSize: 12,
    color: C.textSecondary,
  },
});
