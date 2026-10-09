import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pressable } from '@/components/haptic-pressable';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { useFloatingTabClearance } from '@/hooks/use-floating-tab-clearance';

const C = Colors.light;

const MAX_DETAILS = 280;

type Category = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
};

const CATEGORIES: Category[] = [
  { key: 'flood', label: 'Flooding', icon: 'water', color: '#2D7FF9' },
  { key: 'accident', label: 'Accident', icon: 'car-emergency', color: '#E5484D' },
  { key: 'closure', label: 'Road closure', icon: 'road-variant', color: Brand.yellow },
  { key: 'hazard', label: 'Hazard', icon: 'alert', color: '#F76808' },
];

export default function ReportScreen() {
  const tabClearance = useFloatingTabClearance();
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = selected !== null && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    // Simulated submission; replace with real API call.
    setTimeout(() => {
      setSubmitting(false);
      setSelected(null);
      setDetails('');
    }, 1200);
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
              {CATEGORIES.map((cat) => {
                const isSelected = selected === cat.key;
                return (
                  <Pressable
                    key={cat.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={cat.label}
                    onPress={() => setSelected(cat.key)}
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change location"
              style={({ pressed }) => [styles.locationRow, pressed && styles.pressed]}>
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={18} color={Brand.green} />
              </View>
              <View style={styles.locationBody}>
                <Text style={styles.locationText}>Current location</Text>
                <Text style={styles.locationSub}>Metro Manila</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.textSecondary} />
            </Pressable>
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
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: tabClearance }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Submit report"
            accessibilityState={{ disabled: !canSubmit, busy: submitting }}
            disabled={!canSubmit}
            onPress={handleSubmit}
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: C.backgroundElement,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Brand.green}1A`,
  },
  locationBody: { flex: 1, gap: 1 },
  locationText: { fontSize: 15, fontWeight: '600', color: C.text },
  locationSub: { fontSize: 13, color: C.textSecondary },
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
