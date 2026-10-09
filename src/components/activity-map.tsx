import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { hazardsWithColor, type Hazard } from '@/constants/hazards';
import { Colors } from '@/constants/theme';
import type { ActivityFix } from '@/hooks/use-activity-session';
import type { LatLng } from '@/utils/geo';

const C = Colors.light;

type ActivityMapProps = {
  location: ActivityFix | null;
  path: LatLng[];
  reports: Hazard[];
  highlightId?: string | null;
};

export function ActivityMap({ location, path, reports, highlightId }: ActivityMapProps) {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>
          {location
            ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
            : 'Finding your location…'}
        </Text>
      </View>
    );
  }

  return <NativeActivityMap location={location} path={path} reports={reports} highlightId={highlightId} />;
}

function NativeActivityMap({ location, path, reports, highlightId }: ActivityMapProps) {
  const webViewRef = useRef<WebView>(null);
  const ready = useRef(false);

  const inject = (script: string) => {
    webViewRef.current?.injectJavaScript(`${script}; true;`);
  };

  useEffect(() => {
    if (!ready.current || !location) return;
    inject(
      `window.followUser(${location.latitude}, ${location.longitude}, ${location.accuracy || 0})`,
    );
  }, [location]);

  useEffect(() => {
    if (!ready.current) return;
    inject(`window.setPath(${JSON.stringify(JSON.stringify(path))})`);
  }, [path]);

  useEffect(() => {
    if (!ready.current) return;
    const payload = hazardsWithColor(reports).map((item) => ({
      ...item,
      highlight: item.id === highlightId,
    }));
    inject(`window.setHazards(${JSON.stringify(JSON.stringify(payload))})`);
  }, [highlightId, reports]);

  return (
    <WebView
      ref={webViewRef}
      style={styles.map}
      originWhitelist={['*']}
      source={{ html: MAP_HTML, baseUrl: 'https://unpkg.com/' }}
      javaScriptEnabled
      domStorageEnabled
      androidLayerType="hardware"
      onLoadEnd={() => {
        ready.current = true;
        if (location) {
          inject(
            `window.followUser(${location.latitude}, ${location.longitude}, ${location.accuracy || 0})`,
          );
        }
        inject(`window.setPath(${JSON.stringify(JSON.stringify(path))})`);
        const payload = hazardsWithColor(reports).map((item) => ({
          ...item,
          highlight: item.id === highlightId,
        }));
        inject(`window.setHazards(${JSON.stringify(JSON.stringify(payload))})`);
      }}
    />
  );
}

const MAP_HTML = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #DCEBF2; }
      .leaflet-div-icon {
        background: transparent !important;
        border: none !important;
      }
      .hazard-pin {
        width: 26px; height: 26px; border-radius: 50%;
        border: 2px solid #ffffff; box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        color: #ffffff; font: 700 13px -apple-system, sans-serif;
      }
      .hazard-pin.hot {
        width: 32px; height: 32px;
        box-shadow: 0 0 0 8px rgba(229,72,77,0.22);
      }
      .risk-pin {
        width: 28px; height: 28px; border-radius: 50%;
        background: #ffffff;
        border: 2.5px solid #FF3B30;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
        display: flex; align-items: center; justify-content: center;
        font: 700 14px -apple-system, sans-serif;
      }
      .user-loc {
        width: 48px; height: 48px; position: relative;
        border-radius: 50%;
      }
      .user-loc-pulse {
        position: absolute; left: 0; top: 0; width: 48px; height: 48px;
        border-radius: 50%;
        background: rgba(26, 115, 232, 0.28);
        animation: user-pulse 2s ease-out infinite;
      }
      .user-loc-dot {
        position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
        width: 18px; height: 18px; border-radius: 50%;
        background: #1A73E8; border: 3px solid #ffffff;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.28);
      }
      @keyframes user-pulse {
        0% { transform: scale(0.4); opacity: 0.65; }
        100% { transform: scale(1); opacity: 0; }
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      var map = L.map('map', { zoomControl: false, attributionControl: false })
        .setView([12.8797, 121.774], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

      var userMarker = null;
      var userCircle = null;
      var pathLine = null;
      var hazardLayer = L.layerGroup().addTo(map);
      var userIcon = L.divIcon({
        className: 'user-div-icon',
        html: '<div class="user-loc"><div class="user-loc-pulse"></div><div class="user-loc-dot"></div></div>',
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      window.followUser = function (lat, lng, accuracy) {
        var latlng = L.latLng(lat, lng);
        var radius = Math.max(accuracy || 0, 16);
        if (userCircle) { userCircle.setLatLng(latlng).setRadius(radius); }
        else {
          userCircle = L.circle(latlng, {
            radius: radius, color: '#1A73E8', weight: 1, fillColor: '#1A73E8', fillOpacity: 0.16
          }).addTo(map);
        }
        if (userMarker) { userMarker.setLatLng(latlng); }
        else { userMarker = L.marker(latlng, { icon: userIcon, zIndexOffset: 800 }).addTo(map); }
        map.setView(latlng, Math.max(map.getZoom(), 17), { animate: true, duration: 0.35 });
      };

      window.setPath = function (json) {
        var pts = JSON.parse(json).map(function (p) { return [p.latitude, p.longitude]; });
        if (pathLine) { pathLine.setLatLngs(pts); }
        else if (pts.length) {
          pathLine = L.polyline(pts, { color: '#015144', weight: 5, opacity: 0.9 }).addTo(map);
        }
      };

      window.setHazards = function (json) {
        hazardLayer.clearLayers();
        JSON.parse(json).forEach(function (h) {
          if (!isFinite(h.latitude) || !isFinite(h.longitude)) return;
          var color = h.color || '#FF9500';
          if (h.zoneM) {
            L.circle([h.latitude, h.longitude], {
              radius: h.zoneM * 1.25, color: color, weight: 0,
              fillColor: color, fillOpacity: 0.07
            }).addTo(hazardLayer);
            L.circle([h.latitude, h.longitude], {
              radius: h.zoneM, color: color, weight: 0,
              fillColor: color, fillOpacity: 0.14
            }).addTo(hazardLayer);
          }
          var size = h.highlight ? 32 : 28;
          var icon = L.divIcon({
            className: '',
            html: '<div class="risk-pin" style="border-color:' + color + ';color:' + color + '">!</div>',
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          });
          L.marker([h.latitude, h.longitude], { icon: icon, zIndexOffset: 400 }).addTo(hazardLayer);
        });
      };
    </script>
  </body>
</html>`;

const styles = StyleSheet.create({
  map: { flex: 1, backgroundColor: '#DCEBF2' },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.backgroundElement,
  },
  fallbackText: { fontSize: 14, color: C.textSecondary },
});
