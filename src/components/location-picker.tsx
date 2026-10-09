import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors } from '@/constants/theme';
import { pressHaptic } from '@/utils/haptics';

const C = Colors.light;
const HAIRLINE = 'rgba(0, 0, 0, 0.06)';

export type PinnedLocation = {
  latitude: number;
  longitude: number;
};

type LocationPickerProps = {
  location: PinnedLocation | null;
  /** Increment to fly the map to `location` (GPS start or recenter). */
  focusNonce: number;
  onChange: (location: PinnedLocation) => void;
  onRecenter: () => void;
};

export function LocationPicker({
  location,
  focusNonce,
  onChange,
  onRecenter,
}: LocationPickerProps) {
  const webViewRef = useRef<WebView>(null);
  const mapReady = useRef(false);
  const locationRef = useRef(location);
  locationRef.current = location;
  const [label, setLabel] = useState('Finding your location…');

  useEffect(() => {
    if (!location) return;
    void reverseGeocode(location).then(setLabel);
  }, [location]);

  useEffect(() => {
    const current = locationRef.current;
    if (!current || !mapReady.current) return;
    webViewRef.current?.injectJavaScript(
      `window.setCenter(${current.latitude}, ${current.longitude}); true;`,
    );
  }, [focusNonce]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as PinnedLocation;
      if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) return;
      onChange(payload);
    } catch {
      // Ignore malformed WebView messages.
    }
  };

  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>
          {location
            ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
            : 'Location unavailable'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.mapFrame}>
        <WebView
          ref={webViewRef}
          style={styles.map}
          originWhitelist={['*']}
          source={{ html: PICKER_HTML }}
          javaScriptEnabled
          domStorageEnabled
          androidLayerType="hardware"
          onLoadEnd={() => {
            mapReady.current = true;
            if (location) {
              webViewRef.current?.injectJavaScript(
                `window.setCenter(${location.latitude}, ${location.longitude}); true;`,
              );
            }
          }}
          onMessage={handleMessage}
        />
        <View pointerEvents="none" style={styles.pinOverlay}>
          <Ionicons name="location" size={36} color="#E5484D" />
        </View>
        {location ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Use current location"
            onPress={() => {
              pressHaptic();
              onRecenter();
            }}
            style={({ pressed }) => [styles.recenter, pressed && styles.recenterPressed]}>
            <Ionicons name="locate" size={18} color={Brand.green} />
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.hint}>{label}</Text>
      <Text style={styles.subhint}>Drag the map to place the pin on the exact spot</Text>
    </View>
  );
}

async function reverseGeocode(location: PinnedLocation): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=16`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DALAN/1.0 (report location)', Accept: 'application/json' },
    });
    const data = (await res.json()) as { display_name?: string };
    if (data.display_name) return data.display_name;
  } catch {
    // Fall through to coordinates.
  }
  return `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
}

const PICKER_HTML = `<!DOCTYPE html>
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
      var map = L.map('map', { zoomControl: false, attributionControl: false })
        .setView([12.8797, 121.774], 5);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      function postCenter() {
        var c = map.getCenter();
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            latitude: c.lat,
            longitude: c.lng
          }));
        }
      }

      map.on('moveend', postCenter);

      window.setCenter = function (lat, lng) {
        map.setView([lat, lng], Math.max(map.getZoom(), 16), { animate: true });
      };
    </script>
  </body>
</html>`;

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  mapFrame: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#DCEBF2',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },
  map: {
    flex: 1,
  },
  pinOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recenter: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  recenterPressed: {
    opacity: 0.7,
  },
  hint: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  subhint: {
    fontSize: 13,
    color: C.textSecondary,
  },
  fallback: {
    height: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.backgroundElement,
  },
  fallbackText: {
    fontSize: 14,
    color: C.textSecondary,
  },
});
