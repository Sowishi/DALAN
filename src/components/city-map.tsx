import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { Brand, Colors } from '@/constants/theme';
import { useFloatingTabClearance } from '@/hooks/use-floating-tab-clearance';
import { pressHaptic } from '@/utils/haptics';

import { MapPlaceholder } from './map-placeholder';

const C = Colors.light;

// Camera centered on the Philippines until a precise fix arrives.
const CAMERA = {
  latitude: 12.8797,
  longitude: 121.774,
  zoom: 5,
};

type PreciseLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export function CityMap({ style }: { style?: StyleProp<ViewStyle> }) {
  // react-native-webview has no web implementation; fall back to a plain view.
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return <MapPlaceholder style={style} />;
  }

  return <OpenStreetMap style={style} />;
}

function OpenStreetMap({ style }: { style?: StyleProp<ViewStyle> }) {
  const location = usePreciseLocation();
  const clearance = useFloatingTabClearance();
  const webViewRef = useRef<WebView>(null);
  const mapReady = useRef(false);

  const placeMarker = useCallback((fix: PreciseLocation) => {
    const script = `window.setUserLocation(${fix.latitude}, ${fix.longitude}, ${fix.accuracy}); true;`;
    webViewRef.current?.injectJavaScript(script);
  }, []);

  // Drop the marker once both the map and a precise fix are ready.
  useEffect(() => {
    if (location && mapReady.current) {
      placeMarker(location);
    }
  }, [location, placeMarker]);

  const recenterOnUser = () => {
    pressHaptic();
    if (location) {
      placeMarker(location);
    }
  };

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

      // Called from React Native with the device's precise GPS fix.
      window.setUserLocation = function (lat, lng, accuracy) {
        var latlng = L.latLng(lat, lng);

        if (userMarker) { userMarker.setLatLng(latlng); }
        else { userMarker = L.marker(latlng).addTo(map); }

        if (userCircle) { userCircle.setLatLng(latlng).setRadius(accuracy); }
        else { userCircle = L.circle(latlng, { radius: accuracy, color: '#015144', weight: 1, fillOpacity: 0.12 }).addTo(map); }

        map.setView(latlng, 16);
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
    borderColor: 'rgba(0, 0, 0, 0.06)',
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
