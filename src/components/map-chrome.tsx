import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Pressable } from '@/components/haptic-pressable';
import { ProfileButton } from '@/components/profile-button';
import { RiskLegend } from '@/components/risk-legend';
import { MAP_FILTERS, type MapFilterKey } from '@/constants/hazards';
import { Brand, Colors, Spacing } from '@/constants/theme';

const C = Colors.light;
const HAIRLINE = 'rgba(0, 0, 0, 0.06)';
const PILL = '#F4F5F6';

export type MapPlace = {
  label: string;
  latitude: number;
  longitude: number;
};

type MapChromeProps = {
  top: number;
  fromText: string;
  toText: string;
  searchText: string;
  filter: MapFilterKey;
  routing: boolean;
  error: string | null;
  suggestions: MapPlace[];
  loadingSuggestions: boolean;
  suggestionField: 'from' | 'to' | 'search' | null;
  onSearchChange: (text: string) => void;
  onSearchFocus: () => void;
  onFromChange: (text: string) => void;
  onToChange: (text: string) => void;
  onFromFocus: () => void;
  onToFocus: () => void;
  onUseMyLocation: () => void;
  onRecenter: () => void;
  onDirections: () => void;
  onFilter: (key: MapFilterKey) => void;
  onSelectPlace: (place: MapPlace) => void;
};

export function MapChrome({
  top,
  fromText,
  toText,
  searchText,
  filter,
  routing,
  error,
  suggestions,
  loadingSuggestions,
  suggestionField,
  onSearchChange,
  onSearchFocus,
  onFromChange,
  onToChange,
  onFromFocus,
  onToFocus,
  onUseMyLocation,
  onRecenter,
  onDirections,
  onFilter,
  onSelectPlace,
}: MapChromeProps) {
  const showSuggestions =
    suggestionField !== null && (loadingSuggestions || suggestions.length > 0);

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={[styles.topBar, { paddingTop: top }]}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <Image
              source={require('@/assets/images/dalan.png')}
              style={styles.mark}
              contentFit="contain"
            />
            <Text style={styles.wordmark}>DALAN</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Alerts"
              onPress={() => router.push('/alerts')}
              hitSlop={8}
              style={styles.bell}>
              <Ionicons name="notifications-outline" size={18} color={C.text} />
            </Pressable>
            <ProfileButton />
          </View>
        </View>

        <View style={styles.search}>
          <Ionicons name="search" size={15} color={C.textSecondary} />
          <TextInput
            value={searchText}
            onChangeText={onSearchChange}
            onFocus={onSearchFocus}
            placeholder="Search places, routes, or reports…"
            placeholderTextColor={C.textSecondary}
            returnKeyType="search"
            style={styles.searchInput}
            textAlignVertical="center"
            accessibilityLabel="Search places, routes, or reports"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Center on my location"
            onPress={onRecenter}
            style={styles.searchLocate}>
            <Ionicons name="locate-outline" size={15} color={C.text} />
          </Pressable>
        </View>

        <View style={styles.filters}>
          {MAP_FILTERS.map((item) => {
            const selected = filter === item.key;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={item.label}
                onPress={() => onFilter(item.key)}
                style={[styles.chip, selected && styles.chipSelected]}>
                <Ionicons
                  name={item.icon}
                  size={13}
                  color={selected ? Brand.white : C.text}
                />
                <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.route}>
          <View style={styles.routeStop}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Use my location as start"
              onPress={onUseMyLocation}
              hitSlop={8}>
              <View style={styles.routeDot} />
            </Pressable>
            <TextInput
              value={fromText}
              onChangeText={onFromChange}
              onFocus={onFromFocus}
              placeholder="My location"
              placeholderTextColor={C.textSecondary}
              style={styles.routeInput}
              textAlignVertical="center"
              autoCorrect={false}
              accessibilityLabel="Starting location"
            />
          </View>
          <Ionicons name="arrow-forward" size={12} color={C.textSecondary} />
          <View style={styles.routeStop}>
            <Ionicons name="location-outline" size={13} color="#E5484D" />
            <TextInput
              value={toText}
              onChangeText={onToChange}
              onFocus={onToFocus}
              placeholder="Choose destination"
              placeholderTextColor={C.textSecondary}
              style={styles.routeInput}
              textAlignVertical="center"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={onDirections}
              accessibilityLabel="Destination"
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Get directions"
            onPress={onDirections}
            disabled={routing}
            style={({ pressed }) => [styles.go, pressed && styles.pressed]}>
            {routing ? (
              <ActivityIndicator size="small" color={Brand.white} />
            ) : (
              <Ionicons name="navigate" size={15} color={Brand.white} />
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.legendRow} pointerEvents="box-none">
        <RiskLegend />
      </View>

      <View style={styles.routeWrap} pointerEvents="box-none">
        {showSuggestions ? (
          <View style={styles.suggestions}>
            {loadingSuggestions && suggestions.length === 0 ? (
              <View style={styles.suggestionLoading}>
                <ActivityIndicator size="small" color={C.textSecondary} />
              </View>
            ) : (
              suggestions.map((place, index) => (
                <Pressable
                  key={`${place.latitude},${place.longitude},${index}`}
                  onPress={() => onSelectPlace(place)}
                  style={({ pressed }) => [styles.suggestionRow, pressed && styles.pressed]}>
                  <Ionicons name="location-outline" size={16} color={C.textSecondary} />
                  <Text numberOfLines={2} style={styles.suggestionText}>
                    {place.label}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    elevation: 40,
  },
  topBar: {
    backgroundColor: C.background,
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 40,
  },
  legendRow: {
    alignItems: 'flex-end',
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    paddingLeft: 12,
    paddingRight: 4,
    borderRadius: 20,
    backgroundColor: PILL,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    lineHeight: 17,
    color: C.text,
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  searchLocate: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },
  chipSelected: {
    backgroundColor: Brand.green,
    borderColor: Brand.green,
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.text,
  },
  chipLabelSelected: {
    color: Brand.white,
  },
  routeWrap: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 6,
  },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingLeft: 12,
    paddingRight: 4,
    borderRadius: 20,
    backgroundColor: PILL,
  },
  routeStop: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    height: 40,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.green,
  },
  routeInput: {
    flex: 1,
    minWidth: 0,
    height: 40,
    fontSize: 12,
    lineHeight: 16,
    color: C.text,
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  go: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.green,
  },
  suggestions: {
    borderRadius: 18,
    backgroundColor: C.background,
    paddingHorizontal: 12,
    maxHeight: 200,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  suggestionLoading: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    color: C.text,
    lineHeight: 18,
  },
  error: {
    fontSize: 13,
    color: '#E5484D',
    paddingHorizontal: Spacing.one,
  },
  pressed: {
    opacity: 0.75,
  },
});
