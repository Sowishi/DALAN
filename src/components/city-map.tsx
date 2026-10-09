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

import { hazardsWithColor } from '@/constants/hazards';
import { Brand, Colors } from '@/constants/theme';
import { useFloatingTabClearance } from '@/hooks/use-floating-tab-clearance';
import { pressHaptic } from '@/utils/haptics';

import { MapPlaceholder } from './map-placeholder';

const C = Colors.light;
const HAIRLINE = 'rgba(0, 0, 0, 0.06)';

// Resolved once; swap the data source behind `hazardsWithColor` for live reports.
const HAZARDS_JSON = JSON.stringify(hazardsWithColor());

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

type RouteStep = Coordinate & { instruction: string; distance: number };

type Route = {
  coords: number[][]; // [lon, lat] pairs
  steps: RouteStep[];
  distance: number; // meters
  duration: number; // seconds
};

type NavInfo = {
  instruction: string;
  stepDistance: number; // meters to the next maneuver
  remaining: number; // meters to destination
  eta: number; // seconds remaining
};

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

  // Drive (turn-by-turn) mode.
  const [route, setRoute] = useState<Route | null>(null);
  const [driving, setDriving] = useState(false);
  const [nav, setNav] = useState<NavInfo | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const routeRef = useRef<Route | null>(null);
  const stepIndexRef = useRef(1);

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

  const useCurrentAsFrom = () => {
    if (!location) return;
    pressHaptic();
    setFromText('My location');
    setFromCoord({ latitude: location.latitude, longitude: location.longitude });
    setActiveField(null);
    Keyboard.dismiss();
    placeMarker(location);
  };

  const drawRoute = useCallback((from: Coordinate, to: Coordinate, coords: number[][]) => {
    const coordsJson = JSON.stringify(coords);
    webViewRef.current?.injectJavaScript(
      `window.setRoute(${from.latitude}, ${from.longitude}, ${to.latitude}, ${to.longitude}, ${JSON.stringify(
        coordsJson,
      )}); true;`,
    );
  }, []);

  const clearRoute = () => {
    pressHaptic();
    setRoute(null);
    routeRef.current = null;
    setNav(null);
    webViewRef.current?.injectJavaScript('window.clearRoute && window.clearRoute(); true;');
  };

  const stopDrive = useCallback(() => {
    watchRef.current?.remove();
    watchRef.current = null;
    setDriving(false);
    setNav(null);
    webViewRef.current?.injectJavaScript('window.endDrive && window.endDrive(); true;');
  }, []);

  const updateDrive = useCallback((user: Coordinate) => {
    const current = routeRef.current;
    if (!current || current.steps.length === 0) return;

    const steps = current.steps;
    let idx = stepIndexRef.current;
    // Advance past maneuvers we're already on top of.
    while (idx < steps.length - 1 && distanceMeters(user, steps[idx]) < 25) {
      idx += 1;
    }
    stepIndexRef.current = idx;

    let remaining = distanceMeters(user, steps[idx]);
    for (let i = idx; i < steps.length; i += 1) {
      remaining += steps[i].distance;
    }

    const speed = current.duration > 0 ? current.distance / current.duration : 8; // m/s
    setNav({
      instruction: steps[idx].instruction,
      stepDistance: distanceMeters(user, steps[idx]),
      remaining,
      eta: speed > 0 ? remaining / speed : 0,
    });

    webViewRef.current?.injectJavaScript(`window.follow(${user.latitude}, ${user.longitude}); true;`);
  }, []);

  const startDrive = async () => {
    if (!route) return;
    pressHaptic();
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      setError('Location permission is needed for drive mode.');
      return;
    }

    setActiveField(null);
    Keyboard.dismiss();
    stepIndexRef.current = 1;
    setDriving(true);

    if (location) updateDrive(location);

    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 5,
        timeInterval: 1000,
      },
      (loc) => {
        updateDrive({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      },
    );
  };

  // Stop watching location if the map unmounts mid-drive.
  useEffect(() => {
    return () => {
      watchRef.current?.remove();
      watchRef.current = null;
    };
  }, []);

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

      const result = await fetchRoute(from, to);
      if (!result) {
        setError('No route found between those points.');
        return;
      }

      setRoute(result);
      routeRef.current = result;
      drawRoute(from, to, result.coords);
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
          webViewRef.current?.injectJavaScript(
            `window.setHazards(${JSON.stringify(HAZARDS_JSON)}); true;`,
          );
          if (location) placeMarker(location);
        }}
      />

      {/* Directions panel */}
      {!driving ? (
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
          {location ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Use current location"
              onPress={useCurrentAsFrom}
              hitSlop={8}
              style={({ pressed }) => [styles.fromLocate, pressed && styles.fromLocatePressed]}>
              <Ionicons name="locate" size={18} color={Brand.green} />
            </Pressable>
          ) : null}
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
      ) : null}

      {/* Drive-mode top banner: next maneuver */}
      {driving && nav ? (
        <View style={[styles.navBanner, { top: insets.top + 12 }]}>
          <View style={styles.navManeuverIcon}>
            <Ionicons name="navigate" size={22} color={Brand.white} />
          </View>
          <View style={styles.navBannerBody}>
            <Text style={styles.navDistance}>{formatDistance(nav.stepDistance)}</Text>
            <Text numberOfLines={2} style={styles.navInstruction}>
              {nav.instruction}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Route summary with Start drive button */}
      {route && !driving ? (
        <View style={[styles.routeCard, { bottom: clearance + 16 }]}>
          <View style={styles.routeInfo}>
            <Text style={styles.routeEta}>{formatDuration(route.duration)}</Text>
            <Text style={styles.routeDistance}>{formatDistance(route.distance)}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start drive"
            onPress={startDrive}
            style={({ pressed }) => [styles.startButton, pressed && styles.goButtonPressed]}>
            <Ionicons name="navigate" size={18} color={Brand.white} />
            <Text style={styles.startLabel}>Start</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear route"
            onPress={clearRoute}
            hitSlop={8}
            style={({ pressed }) => [styles.routeClose, pressed && styles.fromLocatePressed]}>
            <Ionicons name="close" size={20} color={C.textSecondary} />
          </Pressable>
        </View>
      ) : null}

      {/* Drive-mode bottom bar: ETA, remaining, End */}
      {driving && nav ? (
        <View style={[styles.navFooter, { bottom: clearance + 16 }]}>
          <View style={styles.navFooterInfo}>
            <Text style={styles.navEta}>{formatDuration(nav.eta)}</Text>
            <Text style={styles.navRemaining}>{formatDistance(nav.remaining)} left</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="End drive"
            onPress={stopDrive}
            style={({ pressed }) => [styles.endButton, pressed && styles.goButtonPressed]}>
            <Text style={styles.endLabel}>End</Text>
          </Pressable>
        </View>
      ) : null}

      {location && !driving && !route ? (
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

type OsrmManeuver = { location: number[]; type?: string; modifier?: string };
type OsrmStep = { name?: string; distance: number; maneuver: OsrmManeuver };

/** Fetches a driving route (with turn-by-turn steps) from the OSRM service. */
async function fetchRoute(from: Coordinate, to: Coordinate): Promise<Route | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson&steps=true`;
  const res = await fetch(url);
  const data = (await res.json()) as {
    code: string;
    routes?: {
      distance: number;
      duration: number;
      geometry: { coordinates: number[][] };
      legs: { steps: OsrmStep[] }[];
    }[];
  };
  if (data.code !== 'Ok' || !data.routes?.length) return null;

  const route = data.routes[0];
  const steps: RouteStep[] = [];
  route.legs.forEach((leg) => {
    leg.steps.forEach((step) => {
      steps.push({
        instruction: formatInstruction(step),
        distance: step.distance,
        latitude: step.maneuver.location[1],
        longitude: step.maneuver.location[0],
      });
    });
  });

  return {
    coords: route.geometry.coordinates,
    steps,
    distance: route.distance,
    duration: route.duration,
  };
}

/** Builds a short human-readable instruction from an OSRM step. */
function formatInstruction(step: OsrmStep): string {
  const { type, modifier } = step.maneuver;
  const onto = step.name ? ` onto ${step.name}` : '';
  const on = step.name ? ` on ${step.name}` : '';

  switch (type) {
    case 'depart':
      return `Head ${modifier ?? 'out'}${on}`;
    case 'turn':
      return `Turn ${modifier ?? 'ahead'}${onto}`;
    case 'new name':
      return `Continue${onto}`;
    case 'merge':
      return `Merge ${modifier ?? ''}`.trim() + onto;
    case 'on ramp':
      return `Take the ramp${onto}`;
    case 'off ramp':
      return `Take the exit${onto}`;
    case 'fork':
      return `Keep ${modifier ?? 'ahead'}${onto}`;
    case 'roundabout':
    case 'rotary':
      return `Enter the roundabout${onto}`;
    case 'continue':
      return `Continue ${modifier ?? 'straight'}`.trim() + on;
    case 'arrive':
      return 'Arrive at your destination';
    default:
      return `Continue${onto}`;
  }
}

/** Great-circle distance between two points, in meters. */
function distanceMeters(a: Coordinate, b: Coordinate): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
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
      .hazard-pin {
        width: 26px; height: 26px; border-radius: 13px;
        border: 2px solid #ffffff; box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        color: #ffffff; font: 700 13px -apple-system, sans-serif;
      }
      .hazard-popup { font: 400 13px -apple-system, sans-serif; min-width: 150px; }
      .hazard-popup b { display: block; margin-bottom: 2px; font-size: 14px; }
      .hazard-tag { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
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
      var hazardLayer = L.layerGroup().addTo(map);

      function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (ch) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
        });
      }

      // Called from React Native with the list of street hindrances.
      window.setHazards = function (json) {
        hazardLayer.clearLayers();
        JSON.parse(json).forEach(function (h) {
          var icon = L.divIcon({
            className: '',
            html: '<div class="hazard-pin" style="background:' + h.color + '">!</div>',
            iconSize: [26, 26],
            iconAnchor: [13, 13],
            popupAnchor: [0, -14],
          });
          L.marker([h.latitude, h.longitude], { icon: icon })
            .bindPopup(
              '<div class="hazard-popup">' +
                '<span class="hazard-tag" style="color:' + h.color + '">' + escapeHtml(h.label) + '</span>' +
                '<b>' + escapeHtml(h.title) + '</b>' +
                escapeHtml(h.description) +
              '</div>'
            )
            .addTo(hazardLayer);
        });
      };

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

      // Remove the current route and its markers.
      window.clearRoute = function () {
        if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
        if (fromMarker) { map.removeLayer(fromMarker); fromMarker = null; }
        if (toMarker) { map.removeLayer(toMarker); toMarker = null; }
      };

      // Drive mode: keep the map centered and zoomed on the moving user.
      window.follow = function (lat, lng) {
        var latlng = L.latLng(lat, lng);
        if (userMarker) { userMarker.setLatLng(latlng); }
        else { userMarker = L.circleMarker(latlng, { radius: 8, color: '#ffffff', weight: 3, fillColor: '#015144', fillOpacity: 1 }).addTo(map); }
        if (userCircle) { map.removeLayer(userCircle); userCircle = null; }
        map.setView(latlng, 17, { animate: true, duration: 0.5 });
      };

      // Leave drive mode and re-fit the whole route.
      window.endDrive = function () {
        if (routeLine) { map.fitBounds(routeLine.getBounds(), { padding: [48, 48] }); }
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
  fromLocate: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  fromLocatePressed: {
    opacity: 0.6,
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
  navBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Brand.green,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  navManeuverIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  navBannerBody: {
    flex: 1,
  },
  navDistance: {
    fontSize: 22,
    fontWeight: '700',
    color: Brand.white,
    letterSpacing: -0.4,
  },
  navInstruction: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 1,
  },
  routeCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.background,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  routeInfo: {
    flex: 1,
  },
  routeEta: {
    fontSize: 20,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.4,
  },
  routeDistance: {
    fontSize: 14,
    color: C.textSecondary,
    marginTop: 1,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: Brand.green,
  },
  startLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.white,
  },
  routeClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navFooter: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.background,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  navFooterInfo: {
    flex: 1,
  },
  navEta: {
    fontSize: 20,
    fontWeight: '700',
    color: Brand.green,
    letterSpacing: -0.4,
  },
  navRemaining: {
    fontSize: 14,
    color: C.textSecondary,
    marginTop: 1,
  },
  endButton: {
    height: 44,
    paddingHorizontal: 22,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5484D',
  },
  endLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.white,
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
