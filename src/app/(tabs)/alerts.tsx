import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConditionsStrip } from '@/components/conditions-strip';
import { Pressable } from '@/components/haptic-pressable';
import { ProfileButton } from '@/components/profile-button';
import { HAZARD_META } from '@/constants/hazards';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { useConditions } from '@/hooks/use-conditions';
import { useFloatingTabClearance } from '@/hooks/use-floating-tab-clearance';
import { useReports } from '@/hooks/use-reports';
import { distanceMeters, type LatLng } from '@/utils/geo';

const C = Colors.light;
const HEADER_BLOCK = 168;
const LANDSCAPE_BELOW_HEADER = 36;

type AlertItem = {
  key: string;
  type: string;
  title: string;
  location: string;
  time: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
  unread?: boolean;
  latitude: number;
  longitude: number;
  photoUrl?: string;
};

type FilterKey = 'nearby' | 'all' | 'unread';

const FILTERS: { key: FilterKey; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'nearby', label: 'Nearby', icon: 'navigate' },
  { key: 'all', label: 'All', icon: 'list-outline' },
  { key: 'unread', label: 'Unread', icon: 'ellipse-outline' },
];

const NEARBY_M = 15000;
const NEW_MS = 24 * 60 * 60 * 1000;

function formatTimeAgo(ms?: number) {
  if (!ms) return 'Just now';
  const mins = Math.max(0, Math.round((Date.now() - ms) / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const tabClearance = useFloatingTabClearance();
  const { conditions, offline: conditionsOffline } = useConditions();
  const reports = useReports();
  const [filter, setFilter] = useState<FilterKey>('nearby');
  const [here, setHere] = useState<LatLng | null>(null);
  const backdropHeight = insets.top + HEADER_BLOCK + LANDSCAPE_BELOW_HEADER;

  useEffect(() => {
    let active = true;
    void (async () => {
      const last = await Location.getLastKnownPositionAsync();
      if (last && active) {
        setHere({ latitude: last.coords.latitude, longitude: last.coords.longitude });
        return;
      }
      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) return;
      const fix = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (active) setHere({ latitude: fix.coords.latitude, longitude: fix.coords.longitude });
    })();
    return () => {
      active = false;
    };
  }, []);

  const items = useMemo<AlertItem[]>(() => {
    return reports.map((report) => {
      const meta = HAZARD_META[report.type] ?? HAZARD_META.other;
      return {
        key: report.id,
        type: meta.label,
        title: report.title || meta.label,
        location:
          report.address ||
          `${report.latitude.toFixed(3)}, ${report.longitude.toFixed(3)}`,
        time: formatTimeAgo(report.createdAt),
        icon: meta.icon,
        color: meta.color,
        unread: report.createdAt == null || Date.now() - report.createdAt < NEW_MS,
        latitude: report.latitude,
        longitude: report.longitude,
        photoUrl: report.photoUrl,
      };
    });
  }, [reports]);

  const unreadCount = items.filter((item) => item.unread).length;

  const visible = useMemo(() => {
    if (filter === 'unread') return items.filter((item) => item.unread);
    if (filter === 'nearby' && here) {
      return items.filter((item) => distanceMeters(here, item) <= NEARBY_M);
    }
    return items;
  }, [filter, here, items]);

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/alert_bg.jpg')}
        style={[styles.backdrop, { height: backdropHeight }]}
        contentFit="cover"
        contentPosition="right"
        accessibilityIgnoresInvertColors
      />
      <LinearGradient
        colors={['rgba(247,251,250,0)', 'rgba(247,251,250,0.45)', '#F7FBFA']}
        locations={[0.2, 0.62, 1]}
        style={[styles.backdrop, { height: backdropHeight }]}
        pointerEvents="none"
      />

      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.topBar}>
          <View style={styles.headerLeft}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => {
                if (router.canGoBack()) router.back();
                else router.replace('/explore');
              }}
              hitSlop={8}
              style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={C.text} />
            </Pressable>
            <View style={styles.brand}>
              <Image
                source={require('@/assets/images/dalan.png')}
                style={styles.mark}
                contentFit="contain"
                accessibilityLabel="DALAN"
              />
              <Text style={styles.wordmark}>DALAN</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Alerts"
              onPress={() => router.push('/alerts')}
              hitSlop={8}
              style={styles.bell}>
              <Ionicons name="notifications-outline" size={20} color={C.text} />
            </Pressable>
            <ProfileButton />
          </View>
        </View>
        <ConditionsStrip conditions={conditions} offline={conditionsOffline} />

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: tabClearance }]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.pageHead}>
            <Text style={styles.headerTitle}>Alerts</Text>
            <Text style={styles.headerSubtitle}>
              {unreadCount > 0
                ? `${unreadCount} new ${unreadCount === 1 ? 'report' : 'reports'} near you`
                : 'Latest reports near you'}
            </Text>
          </View>

          <View style={styles.filters}>
            {FILTERS.map((item) => {
              const selected = filter === item.key;
              return (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={item.label}
                  onPress={() => setFilter(item.key)}
                  style={[styles.chip, selected && styles.chipSelected]}>
                  <Ionicons
                    name={item.icon}
                    size={14}
                    color={selected ? Brand.white : C.text}
                  />
                  <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {visible.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No reports yet</Text>
              <Text style={styles.emptyBody}>
                Submitted reports appear here and on the map.
              </Text>
            </View>
          ) : null}

          {visible.map((item) => (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityLabel={`${item.type} at ${item.title}, ${item.location}, ${item.time}${
                item.unread ? ', unread' : ''
              }`}
              onPress={() => router.push('/explore')}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              {item.photoUrl ? (
                <Image
                  source={{ uri: item.photoUrl }}
                  style={styles.thumb}
                  contentFit="cover"
                  cachePolicy="disk"
                  accessibilityLabel={`${item.type} photo`}
                />
              ) : (
                <View style={[styles.iconWrap, { backgroundColor: `${item.color}14` }]}>
                  <MaterialCommunityIcons name={item.icon} size={22} color={item.color} />
                </View>
              )}
              <View style={styles.body}>
                <View style={styles.topRow}>
                  <Text style={[styles.type, { color: item.color }]}>{item.type}</Text>
                  <Text style={styles.time}>{item.time}</Text>
                </View>
                <Text style={styles.title}>{item.title}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={13} color={C.textSecondary} />
                  <Text style={styles.location}>{item.location}</Text>
                </View>
              </View>
              {item.unread ? (
                <View style={styles.unreadDot} accessibilityLabel="Unread" />
              ) : (
                <Ionicons name="chevron-forward" size={18} color="#C5C9C8" />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FBFA' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  flex: { flex: 1, backgroundColor: 'transparent' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mark: {
    width: 22,
    height: 22,
  },
  wordmark: {
    fontSize: 18,
    fontWeight: '800',
    color: Brand.green,
    letterSpacing: -0.6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bell: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.three,
    gap: 12,
  },
  pageHead: {
    gap: 4,
    paddingTop: 4,
  },
  headerTitle: { fontSize: 34, fontWeight: '700', color: C.text, letterSpacing: -0.8 },
  headerSubtitle: { fontSize: 16, color: C.textSecondary },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: Brand.white,
  },
  chipSelected: {
    backgroundColor: Brand.green,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  chipLabelSelected: {
    color: Brand.white,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 22,
    backgroundColor: Brand.white,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.backgroundElement,
  },
  body: { flex: 1, gap: 2 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  type: { fontSize: 12, fontWeight: '700' },
  time: { fontSize: 12, color: C.textSecondary },
  title: { fontSize: 16, fontWeight: '700', color: C.text, letterSpacing: -0.2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half },
  location: { fontSize: 13, color: C.textSecondary },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.green,
  },
  empty: {
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.two,
    gap: 6,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  emptyBody: { fontSize: 15, lineHeight: 21, color: C.textSecondary },
  pressed: { opacity: 0.7 },
});
