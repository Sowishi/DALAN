import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivitySession } from '@/components/activity-session';
import { ConditionsStrip } from '@/components/conditions-strip';
import { Pressable } from '@/components/haptic-pressable';
import { ProfileButton } from '@/components/profile-button';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { useConditions } from '@/hooks/use-conditions';
import { useFloatingTabClearance } from '@/hooks/use-floating-tab-clearance';
import { formatKm, type ActivityMode } from '@/hooks/use-activity-session';
import { loadActivities, recordActivity, weekTotals, type SavedActivity } from '@/services/activity-log';

const C = Colors.light;
const HEADER_BLOCK = 156;
const LANDSCAPE_BELOW_HEADER = 100;

type Mode = {
  key: ActivityMode;
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
  { key: 'dist', label: 'Distance (km)', value: '0.0' },
  { key: 'time', label: 'Time', value: '00:00' },
  { key: 'kcal', label: 'Est. kcal', value: '0' },
];

export default function MoveScreen() {
  const insets = useSafeAreaInsets();
  const tabClearance = useFloatingTabClearance();
  const [mode, setMode] = useState<ActivityMode>('run');
  const [live, setLive] = useState(false);
  const [gpsReady, setGpsReady] = useState(false);
  const [activities, setActivities] = useState<SavedActivity[]>([]);
  const { conditions, offline: conditionsOffline } = useConditions();
  const week = weekTotals(activities);

  useEffect(() => {
    void Location.getForegroundPermissionsAsync().then(({ status }) => {
      setGpsReady(status === Location.PermissionStatus.GRANTED);
    });
    void loadActivities().then(setActivities);
  }, []);

  const selected = MODES.find((item) => item.key === mode) ?? MODES[1];
  const backdropHeight = insets.top + HEADER_BLOCK + LANDSCAPE_BELOW_HEADER;

  if (live) {
    return (
      <ActivitySession
        mode={selected.key}
        modeLabel={selected.label}
        modeIcon={selected.icon}
        onBack={() => setLive(false)}
        onFinish={({ distanceM, elapsedSec }) => {
          void recordActivity({
            mode: selected.key,
            label: selected.label,
            distanceM,
            elapsedSec,
          }).then((activity) => {
            setActivities((items) => [activity, ...items]);
          });
          setLive(false);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/move_bg.jpg')}
        style={[styles.backdrop, { height: backdropHeight }]}
        contentFit="cover"
        contentPosition="center"
        accessibilityIgnoresInvertColors
      />
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.4)', C.background]}
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

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Move</Text>
          <Text style={styles.headerSubtitle}>Track your journey, your way</Text>
        </View>
        <ConditionsStrip conditions={conditions} offline={conditionsOffline} />

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: tabClearance }]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Choose your activity</Text>
              <View style={styles.gps}>
                <Ionicons
                  name="location"
                  size={14}
                  color={gpsReady ? Brand.green : C.textSecondary}
                />
                <Text style={[styles.gpsLabel, gpsReady && styles.gpsReady]}>
                  {gpsReady ? 'GPS ready' : 'GPS off'}
                </Text>
              </View>
            </View>

            <View style={styles.modeRow}>
              {MODES.map((item) => {
                const active = mode === item.key;
                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={item.label}
                    onPress={() => setMode(item.key)}
                    style={({ pressed }) => [
                      styles.modeChip,
                      active && styles.modeChipActive,
                      pressed && styles.pressed,
                    ]}>
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={22}
                      color={active ? Brand.white : C.text}
                    />
                    <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.statsRow}>
              {STATS.map((stat, index) => (
                <View
                  key={stat.key}
                  style={[styles.stat, index < STATS.length - 1 && styles.statDivider]}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Start ${selected.label}`}
              onPress={() => setLive(true)}
              style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}>
              <Ionicons name="play" size={20} color={Brand.white} />
              <Text style={styles.startLabel}>Start {selected.label.toLowerCase()}</Text>
            </Pressable>

            <View style={styles.hint}>
              <Ionicons name="information-circle-outline" size={14} color={C.textSecondary} />
              <Text style={styles.hintText}>Your route records as you move.</Text>
            </View>

            <Text style={styles.sectionTitle}>This week</Text>
            <View style={styles.weekRow}>
              <View style={styles.weekCard}>
                <View style={[styles.weekIcon, { backgroundColor: 'rgba(1, 81, 68, 0.08)' }]}>
                  <Ionicons name="location-outline" size={18} color={Brand.green} />
                </View>
                <View>
                  <Text style={styles.weekValue}>{formatKm(week.distanceM)} km</Text>
                  <Text style={styles.weekLabel}>Distance</Text>
                </View>
              </View>
              <View style={styles.weekCard}>
                <View style={[styles.weekIcon, { backgroundColor: 'rgba(247, 104, 8, 0.10)' }]}>
                  <Ionicons name="flame" size={18} color="#F76808" />
                </View>
                <View>
                  <Text style={styles.weekValue}>{week.kcal.toLocaleString()}</Text>
                  <Text style={styles.weekLabel}>Est. calories</Text>
                </View>
              </View>
            </View>

            <View style={styles.recentHead}>
              <Text style={styles.sectionTitle}>Recent activity</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="See all activity">
                <View style={styles.seeAll}>
                  <Text style={styles.seeAllLabel}>See all</Text>
                  <Ionicons name="chevron-forward" size={14} color={C.textSecondary} />
                </View>
              </Pressable>
            </View>

            {activities.length === 0 ? (
              <Text style={styles.hintText}>Finished activities will show up here.</Text>
            ) : (
              activities.map((item) => {
                const mins = Math.max(1, Math.round(item.elapsedSec / 60));
                return (
                  <View key={item.id} style={styles.recentRow}>
                    <View style={styles.weekIcon}>
                      <Ionicons name="location-outline" size={18} color={Brand.green} />
                    </View>
                    <View style={styles.recentCopy}>
                      <Text style={styles.recentTitle}>{item.title}</Text>
                      <Text style={styles.recentMeta}>
                        {formatKm(item.distanceM)} km · {mins} min
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
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
  header: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.one,
    gap: 4,
  },
  headerTitle: { fontSize: 34, fontWeight: '700', color: C.text, letterSpacing: -0.8 },
  headerSubtitle: { fontSize: 16, color: C.textSecondary },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: 20,
    gap: Spacing.four,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.3,
  },
  gps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gpsLabel: {
    fontSize: 13,
    color: C.textSecondary,
  },
  gpsReady: {
    color: Brand.green,
    fontWeight: '600',
  },
  modeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  modeChip: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: C.backgroundElement,
  },
  modeChipActive: {
    backgroundColor: Brand.green,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
  },
  modeLabelActive: {
    color: Brand.white,
  },
  statsRow: {
    flexDirection: 'row',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: C.backgroundSelected,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.6,
  },
  statLabel: {
    fontSize: 12,
    color: C.textSecondary,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 28,
    backgroundColor: Brand.green,
  },
  startLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: Brand.white,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  hintText: {
    fontSize: 13,
    color: C.textSecondary,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.3,
  },
  weekRow: {
    flexDirection: 'row',
    gap: 12,
  },
  weekCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: C.backgroundElement,
  },
  weekIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(1, 81, 68, 0.08)',
  },
  weekValue: {
    fontSize: 20,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.3,
  },
  weekLabel: {
    fontSize: 13,
    color: C.textSecondary,
  },
  recentHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllLabel: {
    fontSize: 14,
    color: C.textSecondary,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: C.backgroundElement,
  },
  recentCopy: {
    flex: 1,
    gap: 2,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: C.text,
  },
  recentMeta: {
    fontSize: 13,
    color: C.textSecondary,
  },
  pressed: { opacity: 0.7 },
});
