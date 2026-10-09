import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Pressable } from '@/components/haptic-pressable';
import { HAZARD_META, type Hazard } from '@/constants/hazards';
import { Brand, Colors } from '@/constants/theme';

const C = Colors.light;

type MapReportSheetProps = {
  report: Hazard;
  distanceLabel?: string;
  bottom: number;
  onClose: () => void;
  onView: () => void;
  onConfirm: () => void;
  confirmed?: boolean;
};

export function MapReportSheet({
  report,
  distanceLabel,
  bottom,
  onClose,
  onView,
  onConfirm,
  confirmed,
}: MapReportSheetProps) {
  const meta = HAZARD_META[report.type] ?? HAZARD_META.other;
  const timeLabel = formatAgo(report.createdAt);
  const photos = report.photoUrls ?? (report.photoUrl ? [report.photoUrl] : []);

  return (
    <View style={[styles.card, { bottom }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close report"
        onPress={onClose}
        style={styles.close}>
        <Ionicons name="close" size={18} color={C.text} />
      </Pressable>

      <View style={styles.photoWrap}>
        {photos.length === 1 ? (
          <Image
            source={{ uri: photos[0] }}
            style={styles.photo}
            contentFit="cover"
            cachePolicy="disk"
            accessibilityLabel={report.title || meta.label}
          />
        ) : photos.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photoStrip}>
            {photos.map((uri) => (
              <Image
                key={uri}
                source={{ uri }}
                style={styles.photoMany}
                contentFit="cover"
                cachePolicy="disk"
                accessibilityLabel={report.title || meta.label}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.photoFallback, { backgroundColor: `${meta.color}14` }]}>
            <MaterialCommunityIcons name={meta.icon} size={40} color={meta.color} />
            <Text style={styles.photoCaptionMuted}>No photo yet</Text>
          </View>
        )}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.tag}>
          <MaterialCommunityIcons name={meta.icon} size={14} color={meta.color} />
          <Text style={[styles.tagLabel, { color: meta.color }]}>{meta.label}</Text>
        </View>
        {timeLabel ? <Text style={styles.time}>{timeLabel}</Text> : null}
      </View>

      <Text style={styles.title}>{report.title || meta.label}</Text>
      {distanceLabel ? <Text style={styles.place}>{distanceLabel}</Text> : null}
      {report.description ? (
        <Text numberOfLines={3} style={styles.body}>
          {report.description}
        </Text>
      ) : null}

      <View style={styles.trustRow}>
        <Ionicons name="people-outline" size={14} color={C.textSecondary} />
        <Text style={styles.trust}>Community report · Unverified</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View report"
          onPress={onView}
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
          <Ionicons name="share-outline" size={16} color={Brand.white} />
          <Text style={styles.primaryLabel}>View report</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={confirmed ? 'Marked as still there' : 'Still there'}
          onPress={onConfirm}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <Ionicons
            name={confirmed ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={16}
            color={Brand.green}
          />
          <Text style={styles.secondaryLabel}>{confirmed ? 'Noted' : 'Still there'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function formatAgo(ms?: number) {
  if (!ms) return null;
  const minutes = Math.max(0, Math.round((Date.now() - ms) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 16,
    borderRadius: 24,
    backgroundColor: C.background,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    gap: 10,
  },
  photoWrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  photoStrip: {
    gap: 8,
  },
  photo: {
    width: '100%',
    height: 168,
  },
  photoMany: {
    width: 220,
    height: 168,
    borderRadius: 14,
  },
  photoFallback: {
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoCaptionMuted: {
    fontSize: 13,
    color: C.textSecondary,
  },
  photoCaption: {
    position: 'absolute',
    left: 12,
    bottom: 10,
    fontSize: 13,
    color: Brand.white,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowRadius: 4,
  },
  close: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  time: {
    fontSize: 13,
    color: C.textSecondary,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.3,
  },
  place: {
    fontSize: 14,
    color: C.textSecondary,
    marginTop: -4,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    color: C.text,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trust: {
    fontSize: 13,
    color: C.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  primary: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Brand.green,
  },
  primaryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Brand.white,
  },
  secondary: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Brand.white,
    borderWidth: 1.5,
    borderColor: Brand.green,
  },
  secondaryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Brand.green,
  },
  pressed: {
    opacity: 0.8,
  },
});
