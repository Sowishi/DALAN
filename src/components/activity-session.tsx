import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityDallyChat } from '@/components/activity-dally-chat';
import { ActivityMap } from '@/components/activity-map';
import { Pressable } from '@/components/haptic-pressable';
import { RiskLegend } from '@/components/risk-legend';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { useActivityHazards } from '@/hooks/use-activity-hazards';
import { setActivityOverlay } from '@/hooks/use-activity-overlay';
import {
  formatClock,
  formatKm,
  useActivitySession,
  type ActivityMode,
} from '@/hooks/use-activity-session';
import { useReports } from '@/hooks/use-reports';
import { stopSpeech } from '@/services/speech';

const C = Colors.light;

type ActivitySessionProps = {
  mode: ActivityMode;
  modeLabel: string;
  modeIcon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onFinish: (summary: { distanceM: number; elapsedSec: number }) => void;
  onBack: () => void;
};

export function ActivitySession({ mode, modeLabel, modeIcon, onFinish, onBack }: ActivitySessionProps) {
  const insets = useSafeAreaInsets();
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(320);
  const reports = useReports();
  const { fix, path, stats, error } = useActivitySession(mode, true, paused);
  const situation = useActivityHazards(true, muted, mode, fix, reports);

  useEffect(() => {
    setActivityOverlay(true);
    return () => {
      setActivityOverlay(false);
      void stopSpeech();
    };
  }, []);

  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (chatOpen) {
        setChatOpen(false);
        return true;
      }
      onBack();
      return true;
    });
    return () => back.remove();
  }, [chatOpen, onBack]);

  const tone =
    situation.level === 'near' ? styles.bannerNear : situation.level === 'ahead' ? styles.bannerAhead : styles.bannerClear;
  const toneText =
    situation.level === 'near' ? styles.bannerNearText : situation.level === 'ahead' ? styles.bannerAheadText : styles.bannerClearText;

  return (
    <View style={styles.screen}>
      <ActivityMap
        location={fix}
        path={path}
        reports={reports}
        highlightId={situation.hazard?.id}
      />

      <SafeAreaView edges={['top']} style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={C.text} />
          </Pressable>
          <View style={[styles.banner, tone]}>
          <View
            style={[
              styles.dot,
              situation.level === 'near' && styles.dotNear,
              situation.level === 'ahead' && styles.dotAhead,
            ]}
          />
          <View style={styles.bannerCopy}>
            <Text style={[styles.bannerTitle, toneText]}>{situation.title}</Text>
            <Text style={[styles.bannerDetail, toneText]} numberOfLines={1}>
              {situation.detail}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={muted ? 'Unmute hazard alerts' : 'Mute hazard alerts'}
            onPress={() => setMuted((value) => !value)}
            style={styles.muteBtn}>
            <Ionicons
              name={muted ? 'volume-mute' : 'volume-high'}
              size={20}
              color={situation.level === 'clear' ? C.text : Brand.white}
            />
          </Pressable>
          </View>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.legendWrap} pointerEvents="box-none">
          <RiskLegend />
        </View>
      </SafeAreaView>

      <View
        style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
        onLayout={(event) => setSheetHeight(event.nativeEvent.layout.height)}>
        <View style={styles.handle} />
        <View style={styles.sheetHead}>
          <View style={styles.modeBadge}>
            <MaterialCommunityIcons name={modeIcon} size={18} color={Brand.green} />
            <Text style={styles.modeLabel}>{modeLabel}</Text>
          </View>
          <View style={styles.live}>
            <View style={[styles.liveDot, paused && styles.livePaused]} />
            <Text style={styles.liveLabel}>{paused ? 'Paused' : 'Recording'}</Text>
          </View>
        </View>

        <Text style={styles.distance}>{formatKm(stats.distanceM)}</Text>
        <Text style={styles.distanceUnit}>kilometers</Text>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatClock(stats.elapsedSec)}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats.paceLabel}</Text>
            <Text style={styles.statLabel}>{mode === 'cycle' || mode === 'drive' ? 'Speed' : 'Pace'}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stats.kcal}</Text>
            <Text style={styles.statLabel}>Est. kcal</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={muted ? 'Unmute' : 'Mute'}
            onPress={() => setMuted((value) => !value)}
            style={styles.sideBtn}>
            <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={22} color={C.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={paused ? `Resume ${modeLabel}` : `Pause ${modeLabel}`}
            onPress={() => setPaused((value) => !value)}
            style={styles.pauseBtn}>
            <Ionicons name={paused ? 'play' : 'pause'} size={28} color={Brand.white} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Finish activity"
            onPress={() => onFinish({ distanceM: stats.distanceM, elapsedSec: stats.elapsedSec })}
            style={styles.sideBtn}>
            <Ionicons name="stop" size={22} color="#E5484D" />
          </Pressable>
        </View>
      </View>

      <ActivityDallyChat
        open={chatOpen}
        onOpenChange={setChatOpen}
        location={fix}
        fabBottom={sheetHeight + 16}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.three,
    zIndex: 20,
    elevation: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.white,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  banner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: Brand.white,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  bannerClear: { backgroundColor: Brand.white },
  bannerAhead: { backgroundColor: '#CA8A04' },
  bannerNear: { backgroundColor: '#E5484D' },
  bannerCopy: { flex: 1, minWidth: 0, gap: 2 },
  bannerTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  bannerDetail: { fontSize: 13, color: C.textSecondary },
  bannerClearText: {},
  bannerAheadText: { color: Brand.white },
  bannerNearText: { color: Brand.white },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  dotAhead: { backgroundColor: '#FEF3C7' },
  dotNear: { backgroundColor: '#FEE2E2' },
  muteBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    marginTop: 8,
    fontSize: 13,
    color: '#E5484D',
    fontWeight: '600',
  },
  legendWrap: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    elevation: 24,
    paddingHorizontal: Spacing.four,
    paddingTop: 10,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: Brand.white,
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E4E6E8',
    marginBottom: 14,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeLabel: { fontSize: 16, fontWeight: '600', color: C.text },
  live: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5484D',
  },
  livePaused: { backgroundColor: C.textSecondary },
  liveLabel: { fontSize: 13, fontWeight: '600', color: C.textSecondary },
  distance: {
    marginTop: 10,
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: -1.6,
    color: C.text,
    textAlign: 'center',
  },
  distanceUnit: {
    marginTop: -4,
    fontSize: 15,
    color: C.textSecondary,
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    marginTop: 18,
    marginBottom: 20,
  },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: '700', color: C.text, letterSpacing: -0.4 },
  statLabel: { fontSize: 12, color: C.textSecondary },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  pauseBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.green,
  },
  sideBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.backgroundElement,
  },
});
