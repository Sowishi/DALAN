import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pressable } from '@/components/haptic-pressable';
import {
  LocationPicker,
  reverseGeocode,
  type PinnedLocation,
} from '@/components/location-picker';
import { HAZARD_META, type HazardType } from '@/constants/hazards';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { addReport } from '@/services/reports';

const C = Colors.light;
const MAX_DETAILS = 300;
const MAX_PHOTOS = 4;

const PICKER: {
  key: HazardType;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
}[] = [
  { key: 'manhole', label: 'Open Manhole', icon: 'circle-outline', color: '#F59E0B' },
  { key: 'flood', label: 'Flooding', icon: 'waves', color: '#3B82F6' },
  { key: 'hazard', label: 'Broken streetlight', icon: 'lamp', color: '#EAB308' },
  { key: 'debris', label: 'Obstruction', icon: 'triangle-outline', color: '#E11D48' },
  { key: 'accident', label: 'Safety concern', icon: 'account-group', color: '#7C3AED' },
  { key: 'other', label: 'Other', icon: 'leaf', color: '#16A34A' },
];

const SEVERITY = [
  { key: 'low', label: 'Low', color: '#22C55E', wash: '#E8F8EE', outline: '#16A34A' },
  { key: 'moderate', label: 'Moderate', color: '#EAB308', wash: '#FEF8E1', outline: '#CA8A04' },
  { key: 'high', label: 'High', color: '#EF4444', wash: '#FEECEC', outline: '#DC2626' },
] as const;

export default function ReportScreen() {
  const insets = useSafeAreaInsets();
  const tabClearance = Math.max(insets.bottom, 16);
  const [selected, setSelected] = useState<HazardType | null>(null);
  const [details, setDetails] = useState('');
  const [severity, setSeverity] = useState<(typeof SEVERITY)[number]['key']>('moderate');
  const [pin, setPin] = useState<PinnedLocation | null>(null);
  const [pinLabel, setPinLabel] = useState('Finding your location…');
  const [locationSource, setLocationSource] = useState<'current' | 'map' | null>(null);
  const [locating, setLocating] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [focusNonce, setFocusNonce] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ category?: string; location?: string }>({});
  const [success, setSuccess] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

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
      setLocationSource('current');
      setFocusNonce((n) => n + 1);
    };

    void locate();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!pin) {
      setPinLabel('Use your current location or select a spot on the map');
      return;
    }
    let active = true;
    void reverseGeocode(pin).then((label) => {
      if (active) setPinLabel(label);
    });
    return () => {
      active = false;
    };
  }, [pin]);

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        setError('Location permission is needed to pin the report.');
        return;
      }

      const fix = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      setPin({ latitude: fix.coords.latitude, longitude: fix.coords.longitude });
      setLocationSource('current');
      setFocusNonce((n) => n + 1);
      setFieldErrors((prev) => ({ ...prev, location: undefined }));
      setError(null);
    } finally {
      setLocating(false);
    }
  };

  const openMapPicker = () => {
    setFieldErrors((prev) => ({ ...prev, location: undefined }));
    setError(null);
    setPickerOpen(true);
  };

  const canSubmit = !submitting;

  const validate = () => {
    const next: { category?: string; location?: string } = {};
    if (!selected) next.category = 'Select a category.';
    if (!pin) next.location = 'Choose a location for this report.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const addFromLibrary = async () => {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo access is needed to attach pictures.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: remaining > 1,
      selectionLimit: remaining,
      quality: 0.7,
    });
    if (result.canceled) return;

    const uris = result.assets.map((asset) => asset.uri).filter(Boolean);
    setPhotos((prev) => [...prev, ...uris].slice(0, MAX_PHOTOS));
    setError(null);
  };

  const addFromCamera = async () => {
    if (photos.length >= MAX_PHOTOS) return;

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Camera access is needed to take a picture.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]?.uri) return;

    setPhotos((prev) => [...prev, result.assets[0].uri].slice(0, MAX_PHOTOS));
    setError(null);
  };

  const promptAddPhoto = () => {
    if (photos.length >= MAX_PHOTOS) return;
    Alert.alert('Add photo', 'Attach a photo to this report.', [
      { text: 'Take photo', onPress: () => void addFromCamera() },
      { text: 'Choose from library', onPress: () => void addFromLibrary() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removePhoto = (uri: string) => {
    setPhotos((prev) => prev.filter((item) => item !== uri));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSuccess(false);
    if (!validate()) {
      setError('Fill in the required fields to submit.');
      return;
    }
    if (!selected || !pin) return;

    setSubmitting(true);
    setError(null);

    const note = [details.trim(), `Severity: ${severity}`].filter(Boolean).join(' · ');

    try {
      await addReport({
        type: selected,
        title: PICKER.find((item) => item.key === selected)?.label ?? HAZARD_META[selected].label,
        description: note,
        latitude: pin.latitude,
        longitude: pin.longitude,
        photoUrl: photos[0],
        photoUrls: photos,
        severity,
        address:
          pinLabel.startsWith('Finding') || pinLabel.startsWith('Use your') ? undefined : pinLabel,
      });
      setSelected(null);
      setDetails('');
      setSeverity('moderate');
      setPhotos([]);
      setFieldErrors({});
      setSuccess(true);
      router.replace('/explore');
    } catch {
      setError('Could not save the report. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
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
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: tabClearance + 72 }]}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive">
          <ImageBackground
            source={require('@/assets/images/safe_ph_container_bg.jpg')}
            style={styles.hero}
            imageStyle={styles.heroImage}
            resizeMode="cover">
            <Text style={styles.heroTitle}>A safer Philippines starts with you.</Text>
            <Text style={styles.heroBody}>
              Report issues and help create safer roads, communities, and public spaces nationwide.
            </Text>
          </ImageBackground>

          <View style={styles.pageHead}>
            <Text style={styles.pageTitle}>Submit report</Text>
            <Text style={styles.pageSubtitle}>Tell us what is harming your environment</Text>
          </View>

          <FieldLabel>Select category</FieldLabel>
          {fieldErrors.category ? <Text style={styles.fieldError}>{fieldErrors.category}</Text> : null}
          <View style={styles.catGrid}>
            {PICKER.map((cat) => {
              const isSelected = selected === cat.key;
              return (
                <Pressable
                  key={cat.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={cat.label}
                  onPress={() => {
                    setSelected(cat.key);
                    setFieldErrors((prev) => ({ ...prev, category: undefined }));
                    setError(null);
                    setSuccess(false);
                  }}
                  style={[styles.catCell, isSelected && styles.catCellSelected]}>
                  <View style={[styles.catCircle, { backgroundColor: `${cat.color}1A` }]}>
                    <MaterialCommunityIcons name={cat.icon} size={18} color={cat.color} />
                  </View>
                  <Text style={[styles.catLabel, isSelected && styles.catLabelSelected]}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Add photos (optional)</Text>
          <View style={styles.photoRow}>
            {photos.map((uri) => (
              <View key={uri} style={styles.photoThumbWrap}>
                <Image
                  source={{ uri }}
                  style={styles.photoThumb}
                  contentFit="cover"
                  accessibilityLabel="Attached photo"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove photo"
                  onPress={() => removePhoto(uri)}
                  hitSlop={8}
                  style={styles.photoRemove}>
                  <Ionicons name="close" size={12} color={Brand.white} />
                </Pressable>
              </View>
            ))}
            {photos.length === 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add photos"
                onPress={promptAddPhoto}
                style={({ pressed }) => [styles.photoAdd, pressed && styles.pressed]}>
                <Ionicons name="camera-outline" size={24} color={C.textSecondary} />
                <Text style={styles.photoAddLabel}>Tap to add photos</Text>
              </Pressable>
            ) : null}
            {photos.length < MAX_PHOTOS ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add another photo"
                onPress={promptAddPhoto}
                style={({ pressed }) => [styles.photoSlot, pressed && styles.pressed]}>
                <Ionicons name="add" size={26} color={C.textSecondary} />
              </Pressable>
            ) : null}
          </View>

          <FieldLabel>Location</FieldLabel>
          <View style={[styles.locationBox, fieldErrors.location && styles.fieldInvalidBox]}>
            <Ionicons name="location" size={18} color={C.text} style={styles.locationPin} />
            <View style={styles.locationBody}>
              {locationSource ? (
                <Text style={styles.locationSource}>
                  {locationSource === 'current' ? 'Current location' : 'Selected on map'}
                </Text>
              ) : null}
              <Text style={styles.locationText}>{pinLabel}</Text>
            </View>
          </View>
          <View style={styles.locationActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Use current location"
              accessibilityState={{ selected: locationSource === 'current', busy: locating }}
              disabled={locating}
              onPress={() => {
                void useCurrentLocation();
              }}
              style={[
                styles.locationAction,
                locationSource === 'current' && styles.locationActionActive,
              ]}>
              {locating ? (
                <ActivityIndicator size="small" color={Brand.green} />
              ) : (
                <Ionicons
                  name="navigate-outline"
                  size={16}
                  color={locationSource === 'current' ? Brand.green : C.text}
                />
              )}
              <Text
                style={[
                  styles.locationActionLabel,
                  locationSource === 'current' && styles.locationActionLabelActive,
                ]}>
                Current location
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select location on map"
              accessibilityState={{ selected: locationSource === 'map' }}
              onPress={openMapPicker}
              style={[
                styles.locationAction,
                locationSource === 'map' && styles.locationActionActive,
              ]}>
              <Ionicons
                name="map-outline"
                size={16}
                color={locationSource === 'map' ? Brand.green : C.text}
              />
              <Text
                style={[
                  styles.locationActionLabel,
                  locationSource === 'map' && styles.locationActionLabelActive,
                ]}>
                Select on map
              </Text>
            </Pressable>
          </View>
          {fieldErrors.location ? <Text style={styles.fieldError}>{fieldErrors.location}</Text> : null}

          <FieldLabel>Severity</FieldLabel>
          <View style={styles.severityRow}>
            {SEVERITY.map((item) => {
              const active = severity === item.key;
              return (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={item.label}
                  onPress={() => setSeverity(item.key)}
                  style={[
                    styles.severityItem,
                    active && { backgroundColor: item.wash, borderColor: item.outline },
                  ]}>
                  <View style={[styles.severityDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.severityLabel, active && styles.severityActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Additional notes (optional)</Text>
          <View style={styles.notesWrap}>
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Add more details (e.g. size, nearby landmarks, when it started?)"
              placeholderTextColor={C.textSecondary}
              multiline
              maxLength={MAX_DETAILS}
              style={styles.textArea}
            />
            <Text style={styles.counter}>
              {details.length}/{MAX_DETAILS}
            </Text>
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
              submitting && styles.submitDisabled,
              pressed && canSubmit && styles.pressed,
            ]}>
            {submitting ? (
              <ActivityIndicator color={Brand.white} />
            ) : (
              <Text style={styles.submitLabel}>Submit Report</Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>

      <LocationPicker
        visible={pickerOpen}
        location={pin}
        focusNonce={focusNonce}
        title="Select location"
        subtitle="Move the map to pin the exact spot"
        onChange={(next) => {
          setPin(next);
          setLocationSource('map');
          setFieldErrors((prev) => ({ ...prev, location: undefined }));
          setError(null);
        }}
        onRecenter={() => {
          void useCurrentLocation();
        }}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <Text style={styles.label}>
      {children}
      <Text style={styles.required}> *</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  pageHead: {
    gap: 4,
  },
  pageTitle: { fontSize: 34, fontWeight: '700', color: C.text, letterSpacing: -0.8 },
  pageSubtitle: { fontSize: 16, color: C.textSecondary },
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
  content: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  hero: {
    overflow: 'hidden',
    borderRadius: 24,
    marginTop: Spacing.two,
    minHeight: 132,
    paddingVertical: 16,
    paddingHorizontal: 16,
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EAF6F2',
  },
  heroImage: {
    borderRadius: 24,
  },
  heroTitle: {
    maxWidth: '68%',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.4,
  },
  heroBody: {
    maxWidth: '64%',
    fontSize: 13,
    lineHeight: 18,
    color: C.textSecondary,
  },
  label: { fontSize: 15, fontWeight: '600', color: C.text },
  required: { color: '#E5484D', fontWeight: '700' },
  fieldError: { fontSize: 13, color: '#E5484D', marginTop: -8 },
  fieldInvalidBox: { borderColor: '#E5484D' },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catCell: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '47%',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#F4F5F6',
    borderWidth: 1,
    borderColor: '#D8DCE0',
  },
  catCellSelected: {
    backgroundColor: '#EEF0F2',
    borderColor: Brand.green,
  },
  catCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: {
    fontSize: 12,
    color: C.text,
    textAlign: 'center',
  },
  catLabelSelected: {
    fontWeight: '600',
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  photoThumbWrap: {
    position: 'relative',
  },
  photoThumb: {
    width: 96,
    height: 96,
    borderRadius: 16,
    backgroundColor: C.backgroundElement,
  },
  photoRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  photoAdd: {
    width: 118,
    height: 96,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D0D4D8',
    backgroundColor: '#FAFBFC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoAddLabel: {
    fontSize: 12,
    color: C.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  photoSlot: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: C.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F4F5F6',
    borderWidth: 1,
    borderColor: '#D8DCE0',
  },
  locationPin: {
    marginTop: 2,
  },
  locationBody: {
    flex: 1,
    minWidth: 0,
  },
  locationText: {
    fontSize: 14,
    lineHeight: 20,
    color: C.text,
  },
  locationSource: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.green,
    marginBottom: 2,
  },
  locationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  locationAction: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#F4F5F6',
    borderWidth: 1,
    borderColor: '#D8DCE0',
  },
  locationActionActive: {
    backgroundColor: '#E8F4F1',
    borderColor: Brand.green,
  },
  locationActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
  },
  locationActionLabelActive: {
    color: Brand.green,
  },
  severityRow: {
    flexDirection: 'row',
    gap: 6,
  },
  severityItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#F4F5F6',
    borderWidth: 1,
    borderColor: '#D8DCE0',
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  severityLabel: {
    fontSize: 13,
    color: C.text,
  },
  severityActive: {
    fontWeight: '600',
  },
  notesWrap: {
    position: 'relative',
  },
  textArea: {
    minHeight: 88,
    borderRadius: 16,
    padding: Spacing.three,
    paddingBottom: 28,
    fontSize: 15,
    lineHeight: 21,
    color: C.text,
    backgroundColor: C.backgroundElement,
    textAlignVertical: 'top',
  },
  counter: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    fontSize: 12,
    color: C.textSecondary,
  },
  error: { fontSize: 14, color: '#E5484D' },
  success: { fontSize: 14, color: Brand.green, fontWeight: '600' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    backgroundColor: C.background,
  },
  submit: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.green,
  },
  submitDisabled: { opacity: 0.4 },
  submitLabel: { fontSize: 16, fontWeight: '700', color: Brand.white },
  pressed: { opacity: 0.7 },
});
