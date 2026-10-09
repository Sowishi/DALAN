import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  const unreadCount = ALERTS.filter((a) => a.unread).length;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Alerts</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0
              ? `${unreadCount} new ${unreadCount === 1 ? 'report' : 'reports'} near you`
              : 'Latest reports near you'}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {ALERTS.map((a) => (
            <Pressable
              key={a.key}
              accessibilityRole="button"
              accessibilityLabel={`${a.type} at ${a.title}, ${a.location}, ${a.time}${
                a.unread ? ', unread' : ''
              }`}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <View style={[styles.iconWrap, { backgroundColor: `${a.color}1A` }]}>
                <MaterialCommunityIcons name={a.icon} size={24} color={a.color} />
              </View>
              <View style={styles.body}>
                <View style={styles.topRow}>
                  <Text style={[styles.type, { color: a.color }]}>{a.type}</Text>
                  <Text style={styles.time}>{a.time}</Text>
                </View>
                <Text style={styles.title}>{a.title}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={13} color={C.textSecondary} />
                  <Text style={styles.location}>{a.location}</Text>
                </View>
              </View>
              {a.unread ? (
                <View style={styles.unreadDot} accessibilityLabel="Unread" />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={C.textSecondary} />
              )}
            </Pressable>
          ))}
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
  content: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: C.backgroundElement,
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
  title: { fontSize: 16, fontWeight: '700', color: C.text, letterSpacing: -0.2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half },
  location: { fontSize: 13, color: C.textSecondary },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Brand.green,
  },
  pressed: { opacity: 0.7 },
});
