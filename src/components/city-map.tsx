import { useEffect, useState } from 'react';
import { PermissionsAndroid, Platform, StyleProp, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

import { MapPlaceholder } from './map-placeholder';

// Camera centered on the Philippines.
const CAMERA = {
  latitude: 12.8797,
  longitude: 121.774,
  zoom: 5,
};

export function CityMap({ style }: { style?: StyleProp<ViewStyle> }) {
  // react-native-webview has no web implementation; fall back to a plain view.
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return <MapPlaceholder style={style} />;
  }

  return <OpenStreetMap style={style} />;
}

function OpenStreetMap({ style }: { style?: StyleProp<ViewStyle> }) {
  const locationEnabled = useLocationPermission();

  return (
    <WebView
      style={style}
      originWhitelist={['*']}
      source={{ html: buildMapHtml(locationEnabled) }}
      // Let Leaflet's locate control use the device location.
      geolocationEnabled
      javaScriptEnabled
      domStorageEnabled
      startInLoadingState
      androidLayerType="hardware"
    />
  );
}

function buildMapHtml(showLocation: boolean) {
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

      ${
        showLocation
          ? `map.locate({ setView: true, maxZoom: 14 });
      map.on('locationfound', function (e) {
        L.marker(e.latlng).addTo(map);
        L.circle(e.latlng, { radius: e.accuracy, color: '#015144', weight: 1, fillOpacity: 0.1 }).addTo(map);
      });`
          : ''
      }
    </script>
  </body>
</html>`;
}

function useLocationPermission() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      setEnabled(true);
      return;
    }

    let active = true;

    const requestPermission = async () => {
      const permission = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
      const alreadyGranted = await PermissionsAndroid.check(permission);
      const granted =
        alreadyGranted ||
        (await PermissionsAndroid.request(permission)) === PermissionsAndroid.RESULTS.GRANTED;
      if (active) setEnabled(granted);
    };

    void requestPermission();

    return () => {
      active = false;
    };
  }, []);

  return enabled;
}