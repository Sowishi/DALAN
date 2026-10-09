import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Brand, C, EASE_OUT, FONT, Risk } from "../theme";
import { PhoneFrame, StatusBar, BrandMark } from "../PhoneFrame";
import { Icon } from "../Icon";
import { SceneBackground, SceneFade } from "../shared";

const ALERTS: {
  type: string;
  title: string;
  place: string;
  time: string;
  icon: React.ComponentProps<typeof Icon>["name"];
  color: string;
}[] = [
  { type: "Flooding", title: "Flooding reported", place: "Riverside Ave", time: "2m ago", icon: "water", color: Risk.high },
  { type: "Road closure", title: "Lane closed", place: "5th & Main", time: "18m ago", icon: "bus", color: Risk.moderate },
  { type: "Pothole", title: "Deep pothole", place: "Market St", time: "41m ago", icon: "warning", color: Risk.moderate },
];

// 0:54–1:00 — Close. Alerts flash, then the logo and tagline on green.
export const CloseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const alertsOpacity = interpolate(frame, [0, fps * 0.3, fps * 1, fps * 1.4], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const greenOpacity = interpolate(frame, [fps * 1.2, fps * 1.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });
  const endT = frame - fps * 1.6;
  const logoScale = interpolate(endT, [0, fps * 0.8], [0.86, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });
  const logoOpacity = interpolate(endT, [0, fps * 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tagOpacity = interpolate(endT, [fps * 0.5, fps * 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneFade>
      <SceneBackground />
      {alertsOpacity > 0 ? (
        <AbsoluteFill style={{ opacity: alertsOpacity }}>
          <PhoneFrame>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
              <StatusBar />
              <div style={{ display: "flex", alignItems: "center", padding: "6px 28px 14px" }}>
                <BrandMark logo={staticFile("brand/dalan.png")} size={34} />
              </div>
              <div style={{ padding: "0 36px", display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ fontSize: 54, fontWeight: 700, color: C.text, letterSpacing: -1 }}>
                  Alerts
                </div>
                {ALERTS.map((a) => (
                  <div
                    key={a.title}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 18,
                      padding: 24,
                      borderRadius: 26,
                      background: Brand.white,
                      border: `1px solid ${C.hairline}`,
                    }}
                  >
                    <div
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: 35,
                        background: `${a.color}1A`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon name={a.icon} size={34} color={a.color} strokeWidth={2} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: a.color }}>{a.type}</div>
                      <div style={{ fontSize: 26, fontWeight: 700, color: C.text }}>{a.title}</div>
                      <div style={{ fontSize: 22, color: C.textSecondary }}>{a.place}</div>
                    </div>
                    <span style={{ fontSize: 21, color: C.textSecondary }}>{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </PhoneFrame>
        </AbsoluteFill>
      ) : null}

      {greenOpacity > 0 ? (
        <AbsoluteFill
          style={{
            opacity: greenOpacity,
            background: Brand.green,
            justifyContent: "center",
            alignItems: "center",
            fontFamily: FONT,
          }}
        >
          <img
            src={staticFile("brand/dalan.png")}
            width={300}
            height={300}
            style={{
              objectFit: "contain",
              opacity: logoOpacity,
              scale: `${logoScale}`,
              filter: "brightness(0) invert(1)",
            }}
          />
          <div
            style={{
              marginTop: 24,
              fontSize: 150,
              fontWeight: 800,
              letterSpacing: -5,
              color: Brand.white,
              opacity: logoOpacity,
            }}
          >
            DALAN
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: 46,
              fontWeight: 500,
              color: "rgba(255,255,255,0.9)",
              opacity: tagOpacity,
            }}
          >
            Find your way, every <span style={{ color: Brand.yellow, fontWeight: 700 }}>journey.</span>
          </div>
        </AbsoluteFill>
      ) : null}
    </SceneFade>
  );
};
