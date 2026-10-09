import React from "react";
import {
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Brand, C, EASE_OUT, Risk } from "../theme";
import { PhoneFrame, StatusBar, BrandMark } from "../PhoneFrame";
import { Icon } from "../Icon";
import { SceneBackground, SceneFade, SceneLabel } from "../shared";
import { staticFile } from "remotion";

const Marker: React.FC<{
  x: number;
  y: number;
  color: string;
  icon: React.ComponentProps<typeof Icon>["name"];
  scale?: number;
}> = ({ x, y, color, icon, scale = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      translate: "-32px -70px",
      scale: `${scale}`,
    }}
  >
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: 32,
        background: color,
        border: "4px solid #fff",
        boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={icon} size={34} color="#fff" strokeWidth={2.4} />
    </div>
    <div
      style={{
        width: 0,
        height: 0,
        margin: "-4px auto 0",
        borderLeft: "9px solid transparent",
        borderRight: "9px solid transparent",
        borderTop: `14px solid ${color}`,
      }}
    />
  </div>
);

const FILTERS = [
  { label: "All", icon: "apps" as const, on: true },
  { label: "Roads", icon: "bus" as const, on: false },
  { label: "Safety", icon: "shield" as const, on: false },
  { label: "Lifestyle", icon: "leaf" as const, on: false },
];

// 0:26–0:36 — Map. City with hazard pins, filters, camera eases to a flood pin.
export const MapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Camera ease toward the flood pin at world (430, 980).
  const t = interpolate(frame, [fps * 3, fps * 7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });
  const scale = 1 + 0.3 * t;
  const px = 430;
  const py = 980;
  const cx = 340;
  const cy = 860;
  const tx = (cx - scale * px) * t;
  const ty = (cy - scale * py) * t;

  const ringOpacity = interpolate(frame, [fps * 4.5, fps * 5.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneFade>
      <SceneBackground />
      <SceneLabel>Live hindrances on the map</SceneLabel>
      <PhoneFrame screenBackground="#E7EDEB">
        {/* map world */}
        <div
          style={{
            position: "absolute",
            width: 680,
            height: 1454,
            transformOrigin: "0 0",
            translate: `${tx}px ${ty}px`,
            scale: `${scale}`,
          }}
        >
          <svg width="680" height="1454" viewBox="0 0 680 1454">
            <rect width="680" height="1454" fill="#E7EDEB" />
            {/* park / green block */}
            <rect x="60" y="520" width="200" height="170" rx="20" fill="#D7E8D5" />
            <rect x="430" y="1120" width="200" height="180" rx="20" fill="#D7E8D5" />
            {/* river */}
            <path
              d="M-20 1180 C 180 1120 240 980 420 980 C 560 980 620 900 720 940 L 720 1120 C 620 1100 560 1160 420 1160 C 260 1160 160 1260 -20 1300 Z"
              fill="#C6DEF0"
            />
            {/* roads */}
            <g stroke="#FFFFFF" strokeWidth="26" strokeLinecap="round" fill="none">
              <path d="M-20 360 H 720" />
              <path d="M-20 760 H 720" />
              <path d="M340 -20 V 1480" />
              <path d="M120 -20 V 1480" />
              <path d="M540 -20 V 1480" />
              <path d="M-20 1120 H 720" />
            </g>
            <g stroke="#EEF3F1" strokeWidth="12" strokeLinecap="round" fill="none">
              <path d="M230 360 L 540 760" />
              <path d="M120 980 L 540 1120" />
            </g>
          </svg>

          {/* 2 km proximity ring around the flood pin */}
          <div
            style={{
              position: "absolute",
              left: px,
              top: py,
              translate: "-150px -150px",
              width: 300,
              height: 300,
              borderRadius: 150,
              background: "rgba(255,59,48,0.10)",
              border: "2px solid rgba(255,59,48,0.5)",
              opacity: ringOpacity,
            }}
          />
          {/* user location dot */}
          <div
            style={{
              position: "absolute",
              left: 250,
              top: 1150,
              translate: "-16px -16px",
              width: 32,
              height: 32,
              borderRadius: 16,
              background: Brand.green,
              border: "4px solid #fff",
              boxShadow: "0 0 0 8px rgba(1,81,68,0.15)",
            }}
          />

          <Marker x={230} y={620} color={Risk.moderate} icon="warning" />
          <Marker x={540} y={520} color={Risk.moderate} icon="warning" />
          <Marker x={300} y={1120} color={Risk.moderate} icon="bus" />
          <Marker x={px} y={py} color={Risk.high} icon="water" scale={1 + 0.1 * t} />
        </div>

        {/* flood proximity label chip */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 60,
            display: "flex",
            justifyContent: "center",
            opacity: ringOpacity,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: Brand.white,
              borderRadius: 24,
              padding: "16px 26px",
              boxShadow: "0 10px 24px rgba(0,0,0,0.14)",
            }}
          >
            <Icon name="water" size={28} color={Risk.high} />
            <span style={{ fontSize: 26, fontWeight: 700, color: C.text }}>Flooding</span>
            <span style={{ fontSize: 24, color: C.textSecondary }}>1.2 km away</span>
          </div>
        </div>

        {/* top chrome */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            background: Brand.white,
            borderBottomLeftRadius: 36,
            borderBottomRightRadius: 36,
            boxShadow: "0 10px 24px rgba(0,0,0,0.10)",
            paddingBottom: 20,
          }}
        >
          <StatusBar />
          <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <BrandMark logo={staticFile("brand/dalan.png")} size={34} />
              <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                <Icon name="bell" size={30} color={C.text} strokeWidth={1.8} />
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    background: Brand.green,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 22,
                    fontWeight: 700,
                  }}
                >
                  A
                </div>
              </div>
            </div>

            <div
              style={{
                height: 70,
                borderRadius: 35,
                background: C.pill,
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "0 22px",
              }}
            >
              <Icon name="search" size={26} color={C.textSecondary} strokeWidth={1.8} />
              <span style={{ fontSize: 24, color: C.textSecondary }}>
                Search places, routes, or reports…
              </span>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              {FILTERS.map((f) => (
                <div
                  key={f.label}
                  style={{
                    flex: 1,
                    height: 58,
                    borderRadius: 29,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    background: f.on ? Brand.green : Brand.white,
                    border: f.on ? "none" : `1px solid ${C.hairline}`,
                  }}
                >
                  <Icon name={f.icon} size={22} color={f.on ? "#fff" : C.text} strokeWidth={1.8} />
                  <span style={{ fontSize: 21, fontWeight: 600, color: f.on ? "#fff" : C.text }}>
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PhoneFrame>
    </SceneFade>
  );
};
