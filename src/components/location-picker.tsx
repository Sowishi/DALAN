import { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  visible: boolean;
  location: PinnedLocation | null;
  /** Increment to fly the map to `location` (GPS start or recenter). */
  focusNonce: number;
  onChange: (location: PinnedLocation) => void;
  onRecenter: () => void;
  onClose: () => void;
};

export function LocationPicker({
  visible,
  location,
  focusNonce,
  onChange,
  onRecenter,
  onClose,
}: LocationPickerProps) {
  const insets = useSafeAreaInsets();
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
  }, [focusNonce, visible]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as PinnedLocation;
      if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) return;
      onChange(payload);
    } catch {
      // Ignore malformed WebView messages.
    }
  };

  const confirm = () => {
    pressHaptic();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={() => {
              pressHaptic();
              onClose();
            }}
            hitSlop={8}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
            <Ionicons name="close" size={24} color={C.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Pin location</Text>
          <View style={styles.headerButton} />
        </View>

        {Platform.OS === 'ios' || Platform.OS === 'android' ? (
          <View style={styles.mapWrap}>
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
              <Ionicons name="location" size={40} color="#E5484D" />
            </View>
            {location ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Use current location"
                onPress={() => {
                  pressHaptic();
                  onRecenter();
                }}
                style={({ pressed }) => [styles.recenter, pressed && styles.pressed]}>
                <Ionicons name="locate" size={22} color={Brand.green} />
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.fallback}>
            <Text style={styles.fallbackText}>
              {location
                ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                : 'Location unavailable'}
            </Text>
          </View>
        )}

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Text numberOfLines={2} style={styles.hint}>
            {label}
          </Text>
          <Text style={styles.subhint}>Drag the map to place the pin on the exact spot</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Use this location"
            onPress={confirm}
            disabled={!location}
            style={({ pressed }) => [
              styles.confirm,
              !location && styles.confirmDisabled,
              pressed && location && styles.pressed,
            ]}>
            <Text style={styles.confirmLabel}>Use this location</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export async function reverseGeocode(location: PinnedLocation): Promise<string> {
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
      var map = L.map('map', { zoomControl: true, attributionControl: false })
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
  screen: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: C.text,
  },
  mapWrap: {
    flex: 1,
    backgroundColor: '#DCEBF2',
  },
  map: {
    flex: 1,
  },
  pinOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recenter: {
    position: 'absolute',
    right: 16,
    bottom: 16,
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
  footer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 6,
    backgroundColor: C.background,
  },
  hint: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  },
  subhint: {
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 8,
  },
  confirm: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.green,
  },
  confirmDisabled: {
    opacity: 0.4,
  },
  confirmLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.white,
  },
  pressed: {
    opacity: 0.7,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.backgroundElement,
  },
  fallbackText: {
    fontSize: 14,
    color: C.textSecondary,
  },
});
