import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { Brand, Colors } from '@/constants/theme';
import { useFloatingTabClearance } from '@/hooks/use-floating-tab-clearance';
import { pressHaptic } from '@/utils/haptics';

import { MapPlaceholder } from './map-placeholder';

const C = Colors.light;
const HAIRLINE = 'rgba(0, 0, 0, 0.06)';

// Camera centered on the Philippines until a precise fix arrives.
const CAMERA = {
  latitude: 12.8797,
  longitude: 121.774,
  zoom: 5,
};

type Coordinate = {
  latitude: number;
  longitude: number;
};

type PreciseLocation = Coordinate & { accuracy: number };

type Place = Coordinate & { label: string };

type FieldKey = 'from' | 'to';

export function CityMap({ style }: { style?: StyleProp<ViewStyle> }) {
  // react-native-webview has no web implementation; fall back to a plain view.
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return <MapPlaceholder style={style} />;
  }

  return <OpenStreetMap style={style} />;
}

function OpenStreetMap({ style }: { style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  const location = usePreciseLocation();
  const clearance = useFloatingTabClearance();
  const webViewRef = useRef<WebView>(null);
  const mapReady = useRef(false);

  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');
  // Coordinates locked in when a suggestion is chosen (skips re-geocoding).
  const [fromCoord, setFromCoord] = useState<Coordinate | null>(null);
  const [toCoord, setToCoord] = useState<Coordinate | null>(null);
  const [activeField, setActiveField] = useState<FieldKey | null>(null);
  const [routing, setRouting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = activeField === 'from' ? fromText : activeField === 'to' ? toText : '';
  const { suggestions, loading: loadingSuggestions } = usePlaceSuggestions(query, activeField !== null);

  const placeMarker = useCallback((fix: PreciseLocation) => {
    const script = `window.setUserLocation(${fix.latitude}, ${fix.longitude}, ${fix.accuracy}); true;`;
    webViewRef.current?.injectJavaScript(script);
  }, []);

  // Drop the current-location marker once both the map and a precise fix are ready.
  useEffect(() => {
    if (location && mapReady.current) {
      placeMarker(location);
    }
  }, [location, placeMarker]);

  const recenterOnUser = () => {
    pressHaptic();
    if (location) placeMarker(location);
  };

  const handleChange = (field: FieldKey, text: string) => {
    if (field === 'from') {
      setFromText(text);
      setFromCoord(null);
    } else {
      setToText(text);
      setToCoord(null);
    }
  };

  const handleSelect = (field: FieldKey, place: Place) => {
    if (field === 'from') {
      setFromText(place.label);
      setFromCoord({ latitude: place.latitude, longitude: place.longitude });
    } else {
      setToText(place.label);
      setToCoord({ latitude: place.latitude, longitude: place.longitude });
    }
    setActiveField(null);
    Keyboard.dismiss();
  };

  const handleDirections = async () => {
    Keyboard.dismiss();
    setActiveField(null);
    pressHaptic();
    setError(null);

    if (!toCoord && !toText.trim()) {
      setError('Enter a destination.');
      return;
    }

    setRouting(true);
    try {
      const from = fromCoord ?? (await resolveFrom(fromText, location));
      if (!from) {
        setError('Could not find the starting point.');
        return;
      }

      const to = toCoord ?? (await geocode(toText));
      if (!to) {
        setError('Could not find that destination.');
        return;
      }

      const coords = await fetchRoute(from, to);
      if (!coords) {
        setError('No route found between those points.');
        return;
      }

      const coordsJson = JSON.stringify(coords);
      webViewRef.current?.injectJavaScript(
        `window.setRoute(${from.latitude}, ${from.longitude}, ${to.latitude}, ${to.longitude}, ${JSON.stringify(
          coordsJson,
        )}); true;`,
      );
    } catch {
      setError('Something went wrong. Check your connection.');
    } finally {
      setRouting(false);
    }
  };

  const showSuggestions = activeField !== null && (loadingSuggestions || suggestions.length > 0);

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        style={styles.webview}
        originWhitelist={['*']}
        source={{ html: buildMapHtml() }}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        androidLayerType="hardware"
        onLoadEnd={() => {
          mapReady.current = true;
          if (location) placeMarker(location);
        }}
      />

      {/* Directions panel */}
      <View style={[styles.panel, { top: insets.top + 12 }]}>
        <View style={styles.field}>
          <Ionicons name="ellipse" size={12} color={Brand.green} style={styles.fieldIcon} />
          <TextInput
            value={fromText}
            onChangeText={(t) => handleChange('from', t)}
            onFocus={() => setActiveField('from')}
            placeholder="My location"
            placeholderTextColor={C.textSecondary}
            style={styles.input}
            returnKeyType="next"
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.field}>
          <Ionicons name="location" size={14} color="#E5484D" style={styles.fieldIcon} />
          <TextInput
            value={toText}
            onChangeText={(t) => handleChange('to', t)}
            onFocus={() => setActiveField('to')}
            placeholder="Choose destination"
            placeholderTextColor={C.textSecondary}
            style={styles.input}
            returnKeyType="go"
            onSubmitEditing={handleDirections}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Get directions"
            onPress={handleDirections}
            disabled={routing}
            style={({ pressed }) => [styles.goButton, pressed && styles.goButtonPressed]}>
            {routing ? (
              <ActivityIndicator size="small" color={Brand.white} />
            ) : (
              <Ionicons name="navigate" size={18} color={Brand.white} />
            )}
          </Pressable>
        </View>

        {showSuggestions ? (
          <View style={styles.suggestions}>
            {loadingSuggestions && suggestions.length === 0 ? (
              <View style={styles.suggestionLoading}>
                <ActivityIndicator size="small" color={C.textSecondary} />
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" style={styles.suggestionScroll}>
                {suggestions.map((place, index) => (
                  <Pressable
                    key={`${place.latitude},${place.longitude},${index}`}
                    onPress={() => handleSelect(activeField ?? 'to', place)}
                    style={({ pressed }) => [
                      styles.suggestionRow,
                      pressed && styles.suggestionRowPressed,
                    ]}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={C.textSecondary}
                      style={styles.suggestionIcon}
                    />
                    <Text numberOfLines={2} style={styles.suggestionText}>
                      {place.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      {location ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Center on my location"
          onPress={recenterOnUser}
          style={({ pressed }) => [
            styles.locateButton,
            { bottom: clearance + 16 },
            pressed && styles.locateButtonPressed,
          ]}>
          <Ionicons name="locate" size={22} color={Brand.green} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Debounced place search against OpenStreetMap Nominatim. */
function usePlaceSuggestions(query: string, enabled: boolean) {
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!enabled || trimmed.length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const results = await searchPlaces(trimmed);
        if (!cancelled) setSuggestions(results);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, enabled]);

  return { suggestions, loading };
}

/** Returns up to five matching places for a query. */
async function searchPlaces(query: string): Promise<Place[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=ph&q=${encodeURIComponent(
    query,
  )}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'DALAN/1.0 (map directions)', Accept: 'application/json' },
  });
  const data = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  return data.map((d) => ({
    label: d.display_name,
    latitude: parseFloat(d.lat),
    longitude: parseFloat(d.lon),
  }));
}

/** Resolves the "from" field: a blank/"my location" value uses the GPS fix. */
async function resolveFrom(
  fromText: string,
  location: PreciseLocation | null,
): Promise<Coordinate | null> {
  const trimmed = fromText.trim();
  if (!trimmed || trimmed.toLowerCase() === 'my location') {
    return location;
  }
  return geocode(trimmed);
}

/** Geocodes a place name to coordinates via OpenStreetMap Nominatim. */
async function geocode(query: string): Promise<Coordinate | null> {
  const results = await searchPlaces(query);
  if (!results.length) return null;
  return { latitude: results[0].latitude, longitude: results[0].longitude };
}

/** Fetches a driving route from the OSRM service. Returns [lon, lat] pairs. */
async function fetchRoute(from: Coordinate, to: Coordinate): Promise<number[][] | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = (await res.json()) as {
    code: string;
    routes?: { geometry: { coordinates: number[][] } }[];
  };
  if (data.code !== 'Ok' || !data.routes?.length) return null;
  return data.routes[0].geometry.coordinates;
}

function buildMapHtml() {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #DCEBF2; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      var map = L.map('map', { zoomControl: true, attributionControl: true })
        .setView([${CAMERA.latitude}, ${CAMERA.longitude}], ${CAMERA.zoom});

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      var userMarker = null;
      var userCircle = null;
      var routeLine = null;
      var fromMarker = null;
      var toMarker = null;

      // Called from React Native with the device's precise GPS fix.
      window.setUserLocation = function (lat, lng, accuracy) {
        var latlng = L.latLng(lat, lng);
        if (userMarker) { userMarker.setLatLng(latlng); }
        else { userMarker = L.circleMarker(latlng, { radius: 7, color: '#ffffff', weight: 2, fillColor: '#015144', fillOpacity: 1 }).addTo(map); }
        if (userCircle) { userCircle.setLatLng(latlng).setRadius(accuracy); }
        else { userCircle = L.circle(latlng, { radius: accuracy, color: '#015144', weight: 1, fillOpacity: 0.12 }).addTo(map); }
        if (!routeLine) { map.setView(latlng, 16); }
      };

      // Called from React Native with the from/to points and the route geometry.
      window.setRoute = function (fLat, fLng, tLat, tLng, coordsJson) {
        if (routeLine) { map.removeLayer(routeLine); }
        if (fromMarker) { map.removeLayer(fromMarker); }
        if (toMarker) { map.removeLayer(toMarker); }

        var coords = JSON.parse(coordsJson).map(function (c) { return [c[1], c[0]]; });
        routeLine = L.polyline(coords, { color: '#015144', weight: 5, opacity: 0.9 }).addTo(map);

        fromMarker = L.marker([fLat, fLng]).addTo(map);
        toMarker = L.marker([tLat, tLng]).addTo(map);

        map.fitBounds(routeLine.getBounds(), { padding: [48, 48] });
      };
    </script>
  </body>
</html>`;
}

/** Requests the precise (foreground) location and returns the current GPS fix. */
function usePreciseLocation() {
  const [location, setLocation] = useState<PreciseLocation | null>(null);

  useEffect(() => {
    let active = true;

    const getPreciseFix = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED || !active) return;

      const fix = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      if (!active) return;

      setLocation({
        latitude: fix.coords.latitude,
        longitude: fix.coords.longitude,
        accuracy: fix.coords.accuracy ?? 0,
      });
    };

    void getPreciseFix();

    return () => {
      active = false;
    };
  }, []);

  return location;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  panel: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: C.background,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  fieldIcon: {
    width: 20,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: C.text,
    paddingVertical: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: HAIRLINE,
    marginLeft: 28,
  },
  goButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.green,
    marginLeft: 8,
  },
  goButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  suggestions: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE,
    marginTop: 2,
  },
  suggestionScroll: {
    maxHeight: 216,
  },
  suggestionLoading: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
  },
  suggestionRowPressed: {
    opacity: 0.6,
  },
  suggestionIcon: {
    width: 20,
    textAlign: 'center',
    marginRight: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    lineHeight: 18,
  },
  error: {
    fontSize: 13,
    color: '#E5484D',
    paddingVertical: 6,
    paddingLeft: 28,
  },
  locateButton: {
    position: 'absolute',
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  locateButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
});
