import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Colors, Spacing } from '@/constants/theme';

const C = Colors.light;

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
  const [selected, setSelected] = useState('flood');
  const [details, setDetails] = useState('');

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Report</Text>
          <Text style={styles.headerSubtitle}>Help the community stay informed</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>What&apos;s happening?</Text>
          <View style={styles.grid}>
            {CATEGORIES.map((cat) => {
              const isSelected = selected === cat.key;
              return (
                <Pressable
                  key={cat.key}
                  accessibilityRole="button"
                  onPress={() => setSelected(cat.key)}
                  style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}>
                  <View style={[styles.categoryIcon, { backgroundColor: `${cat.color}22` }]}>
                    <MaterialCommunityIcons name={cat.icon} size={24} color={cat.color} />
                  </View>
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                  {isSelected && (
                    <View style={styles.check}>
                      <Ionicons name="checkmark-circle" size={20} color={Brand.green} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Location</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={20} color={Brand.green} />
            <Text style={styles.locationText}>Current location · Metro Manila</Text>
          </View>

          <Text style={styles.label}>Details</Text>
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Add a short description..."
            placeholderTextColor={C.textSecondary}
            multiline
            style={styles.textArea}
          />

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.submit, { opacity: pressed ? 0.85 : 1 }]}>
            <Ionicons name="send" size={18} color={Brand.white} />
            <Text style={styles.submitLabel}>Submit Report</Text>
          </Pressable>
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
    paddingVertical: Spacing.two,
    gap: 2,
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: C.text },
  headerSubtitle: { fontSize: 14, color: C.textSecondary },
  content: { padding: Spacing.three, gap: Spacing.two },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
    marginTop: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  categoryCard: {
    width: '48%',
    flexGrow: 1,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: C.backgroundElement,
    borderWidth: 1.5,
    borderColor: C.backgroundSelected,
    gap: Spacing.two,
  },
  categoryCardSelected: {
    borderColor: Brand.green,
    backgroundColor: C.background,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: { fontSize: 15, fontWeight: '600', color: C.text },
  check: { position: 'absolute', top: Spacing.two, right: Spacing.two },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: C.backgroundElement,
    borderWidth: 1,
    borderColor: C.backgroundSelected,
  },
  locationText: { fontSize: 14, color: C.text },
  textArea: {
    minHeight: 100,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    fontSize: 15,
    color: C.text,
    backgroundColor: C.backgroundElement,
    borderWidth: 1,
    borderColor: C.backgroundSelected,
    textAlignVertical: 'top',
  },
  submit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 52,
    borderRadius: Spacing.three,
    backgroundColor: Brand.green,
    marginTop: Spacing.three,
  },
  submitLabel: { fontSize: 16, fontWeight: '700', color: Brand.white },
});
