import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CityMap } from '@/components/city-map';
import { Brand, Colors, Spacing } from '@/constants/theme';

const C = Colors.light;

type Filter = { key: string; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] };

const FILTERS: Filter[] = [
  { key: 'all', label: 'All', icon: 'apps' },
  { key: 'roads', label: 'Roads', icon: 'car' },
  { key: 'safety', label: 'Safety', icon: 'shield-checkmark' },
  { key: 'lifestyle', label: 'Lifestyle', icon: 'leaf' },
];

export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState('all');

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            style={styles.logo}
            source={require('@/assets/images/dalan.png')}
            contentFit="contain"
            accessibilityLabel="DALAN"
          />
          <View style={styles.headerRight}>
            <Pressable accessibilityRole="button" style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color={C.text} />
              <View style={styles.badgeDot} />
            </Pressable>
            <View style={styles.avatar}>
              <Ionicons name="person" size={20} color={Brand.white} />
            </View>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={C.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search places, routes, or reports..."
              placeholderTextColor={C.textSecondary}
              style={styles.searchInput}
            />
          </View>
          <Pressable accessibilityRole="button" style={styles.locateButton}>
            <Ionicons name="locate" size={22} color={C.text} />
          </Pressable>
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}>
          {FILTERS.map((f) => {
            const selected = active === f.key;
            return (
              <Pressable
                key={f.key}
                accessibilityRole="button"
                onPress={() => setActive(f.key)}
                style={[styles.chip, selected && styles.chipActive]}>
                <Ionicons
                  name={f.icon}
                  size={16}
                  color={selected ? Brand.white : C.text}
                />
                <Text style={[styles.chipLabel, selected && styles.chipLabelActive]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {/* Map */}
      <View style={styles.map}>
        <CityMap style={StyleSheet.absoluteFill} />

        {/* Report card */}
        <View style={styles.card}>
          <View style={styles.cardHandle} />
          <View style={styles.cardRow}>
            <View style={styles.thumb}>
              <Ionicons name="image-outline" size={24} color={C.textSecondary} />
            </View>
            <View style={styles.cardBody}>
              <View style={styles.cardTopRow}>
                <View style={styles.floodBadge}>
                  <Ionicons name="warning" size={13} color={Brand.white} />
                  <Text style={styles.floodBadgeText}>Flooding</Text>
                </View>
                <Text style={styles.timeText}>2h ago</Text>
              </View>
              <Text style={styles.cardTitle}>Commonwealth Ave.</Text>
              <Text style={styles.cardSubtitle}>Quezon City, Metro Manila</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.textSecondary} />
          </View>
          <Text style={styles.cardDesc}>
            Road partially flooded due to heavy rain. Drive with caution.
          </Text>
          <View style={styles.cardFooter}>
            <View style={styles.metric}>
              <Ionicons name="thumbs-up-outline" size={16} color={C.textSecondary} />
              <Text style={styles.metricText}>24</Text>
            </View>
            <View style={styles.metric}>
              <Ionicons name="chatbubble-outline" size={16} color={C.textSecondary} />
              <Text style={styles.metricText}>7</Text>
            </View>
            <View style={styles.metric}>
              <Ionicons name="navigate" size={16} color={Brand.green} />
              <Text style={[styles.metricText, { color: Brand.green }]}>1.2 km</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  logo: {
    width: 120,
    height: 36,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconButton: {
    padding: Spacing.one,
  },
  badgeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#E5484D',
    borderWidth: 1.5,
    borderColor: C.background,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Brand.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    height: 46,
    paddingHorizontal: Spacing.three,
    borderRadius: 23,
    backgroundColor: C.backgroundElement,
    borderWidth: 1,
    borderColor: C.backgroundSelected,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: C.text,
  },
  locateButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.backgroundElement,
    borderWidth: 1,
    borderColor: C.backgroundSelected,
  },
  chipsRow: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.backgroundSelected,
  },
  chipActive: {
    backgroundColor: Brand.green,
    borderColor: Brand.green,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  chipLabelActive: {
    color: Brand.white,
  },
  map: {
    flex: 1,
    backgroundColor: '#DCEBF2',
  },
  card: {
    position: 'absolute',
    left: Spacing.two,
    right: Spacing.two,
    bottom: Spacing.two,
    backgroundColor: C.background,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  cardHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.backgroundSelected,
    marginBottom: Spacing.one,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: Spacing.two,
    backgroundColor: C.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  floodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    paddingHorizontal: Spacing.one,
    paddingVertical: 2,
    borderRadius: Spacing.one,
    backgroundColor: '#E5484D',
  },
  floodBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.white,
  },
  timeText: {
    fontSize: 12,
    color: C.textSecondary,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: C.textSecondary,
  },
  cardDesc: {
    fontSize: 14,
    color: C.text,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    paddingTop: Spacing.one,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  metricText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSecondary,
  },
});
