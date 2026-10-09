import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pressable } from '@/components/haptic-pressable';
import { LocationPicker, type PinnedLocation } from '@/components/location-picker';
import { HAZARD_META, REPORT_CATEGORIES, type HazardType } from '@/constants/hazards';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { useFloatingTabClearance } from '@/hooks/use-floating-tab-clearance';
import { addReport } from '@/services/reports';

const C = Colors.light;

const MAX_DETAILS = 280;

export default function ReportScreen() {
  const tabClearance = useFloatingTabClearance();
  const [selected, setSelected] = useState<HazardType | null>(null);
  const [details, setDetails] = useState('');
  const [pin, setPin] = useState<PinnedLocation | null>(null);
  const [focusNonce, setFocusNonce] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    const locate = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED || !active) return;

      const fix = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      if (!active) return;

      setPin({ latitude: fix.coords.latitude, longitude: fix.coords.longitude });
      setFocusNonce((n) => n + 1);
    };

    void locate();
    return () => {
      active = false;
    };
  }, []);

  const recenterOnGps = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      setError('Location permission is needed to pin the report.');
      return;
    }

    const fix = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
    });
    setPin({ latitude: fix.coords.latitude, longitude: fix.coords.longitude });
    setFocusNonce((n) => n + 1);
  };

  const canSubmit = selected !== null && pin !== null && !submitting;

  const handleSubmit = async () => {
    if (!selected || !pin || submitting) return;
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await addReport({
        type: selected,
        title: HAZARD_META[selected].label,
        description: details.trim(),
        latitude: pin.latitude,
        longitude: pin.longitude,
      });
      setSelected(null);
      setDetails('');
      setSuccess(true);
    } catch {
      setError('Could not save the report. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Report</Text>
          <Text style={styles.headerSubtitle}>Help the community stay informed</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive">
          <View style={styles.section}>
            <Text style={styles.label}>What&apos;s happening?</Text>
            <View style={styles.grid}>
              {REPORT_CATEGORIES.map((cat) => {
                const isSelected = selected === cat.key;
                return (
                  <Pressable
                    key={cat.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={cat.label}
                    onPress={() => {
                      setSelected(cat.key);
                      setSuccess(false);
                    }}
                    style={({ pressed }) => [
                      styles.categoryCard,
                      isSelected && styles.categoryCardSelected,
                      pressed && styles.pressed,
                    ]}>
                    <View style={[styles.categoryIcon, { backgroundColor: `${cat.color}1A` }]}>
                      <MaterialCommunityIcons name={cat.icon} size={24} color={cat.color} />
                    </View>
                    <Text style={styles.categoryLabel}>{cat.label}</Text>
                    <View style={styles.checkSlot}>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={22} color={Brand.green} />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Location</Text>
            <LocationPicker
              location={pin}
              focusNonce={focusNonce}
              onChange={setPin}
              onRecenter={() => {
                void recenterOnGps();
              }}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Details</Text>
              <Text style={styles.counter}>
                {details.length}/{MAX_DETAILS}
              </Text>
            </View>
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Add a short description..."
              placeholderTextColor={C.textSecondary}
              multiline
              maxLength={MAX_DETAILS}
              style={styles.textArea}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>Report posted. It now shows on the map.</Text> : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: tabClearance }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Submit report"
            accessibilityState={{ disabled: !canSubmit, busy: submitting }}
            disabled={!canSubmit}
            onPress={() => {
              void handleSubmit();
            }}
            style={({ pressed }) => [
              styles.submit,
              !canSubmit && styles.submitDisabled,
              pressed && canSubmit && styles.pressed,
            ]}>
            {submitting ? (
              <ActivityIndicator color={Brand.white} />
            ) : (
              <>
                <Ionicons name="send" size={18} color={Brand.white} />
                <Text style={styles.submitLabel}>Submit report</Text>
              </>
            )}
          </Pressable>
        </View>
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
  section: { gap: Spacing.two },
  label: { fontSize: 15, fontWeight: '600', color: C.text },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counter: { fontSize: 13, color: C.textSecondary },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  categoryCard: {
    width: '48%',
    flexGrow: 1,
    minHeight: 96,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: C.backgroundElement,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: Spacing.two,
  },
  categoryCardSelected: {
    borderColor: Brand.green,
    backgroundColor: `${Brand.green}0D`,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: { fontSize: 15, fontWeight: '600', color: C.text },
  checkSlot: { position: 'absolute', top: Spacing.two, right: Spacing.two },
  textArea: {
    minHeight: 120,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    fontSize: 15,
    lineHeight: 21,
    color: C.text,
    backgroundColor: C.backgroundElement,
    textAlignVertical: 'top',
  },
  error: { fontSize: 14, color: '#E5484D' },
  success: { fontSize: 14, color: Brand.green, fontWeight: '600' },
  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  submit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 52,
    borderRadius: Spacing.three,
    backgroundColor: Brand.green,
  },
  submitDisabled: { opacity: 0.4 },
  submitLabel: { fontSize: 16, fontWeight: '700', color: Brand.white },
  pressed: { opacity: 0.7 },
});
