import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Colors, Spacing } from '@/constants/theme';

const C = Colors.light;

type Alert = {
  key: string;
  type: string;
  title: string;
  location: string;
  time: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
  unread?: boolean;
};

const ALERTS: Alert[] = [
  {
    key: '1',
    type: 'Flooding',
    title: 'Commonwealth Ave.',
    location: 'Quezon City, Metro Manila',
    time: '2h ago',
    icon: 'water',
    color: '#2D7FF9',
    unread: true,
  },
  {
    key: '2',
    type: 'Accident',
    title: 'EDSA Northbound',
    location: 'Makati City',
    time: '3h ago',
    icon: 'car-emergency',
    color: '#E5484D',
    unread: true,
  },
  {
    key: '3',
    type: 'Road closure',
    title: 'Session Road',
    location: 'Baguio City',
    time: '5h ago',
    icon: 'road-variant',
    color: Brand.yellow,
  },
  {
    key: '4',
    type: 'Hazard',
    title: 'Fallen tree on highway',
    location: 'Cebu City',
    time: '1d ago',
    icon: 'alert',
    color: '#F76808',
  },
];

export default function AlertsScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Alerts</Text>
          <Text style={styles.headerSubtitle}>Latest reports near you</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {ALERTS.map((a) => (
            <View key={a.key} style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: `${a.color}22` }]}>
                <MaterialCommunityIcons name={a.icon} size={24} color={a.color} />
              </View>
              <View style={styles.body}>
                <View style={styles.topRow}>
                  <Text style={[styles.type, { color: a.color }]}>{a.type}</Text>
                  <Text style={styles.time}>{a.time}</Text>
                </View>
                <Text style={styles.title}>{a.title}</Text>
                <Text style={styles.location}>{a.location}</Text>
              </View>
              {a.unread ? (
                <View style={styles.unreadDot} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={C.textSecondary} />
              )}
            </View>
          ))}
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
  content: { padding: Spacing.three, gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: C.backgroundElement,
    borderWidth: 1,
    borderColor: C.backgroundSelected,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  type: { fontSize: 12, fontWeight: '700' },
  time: { fontSize: 12, color: C.textSecondary },
  title: { fontSize: 15, fontWeight: '700', color: C.text },
  location: { fontSize: 13, color: C.textSecondary },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Brand.green,
  },
});
