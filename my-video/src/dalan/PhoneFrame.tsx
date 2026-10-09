import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Brand, C, EASE_OUT, FONT, PHONE } from "./theme";
import { Icon } from "./Icon";

const SCREEN_W = PHONE.width - PHONE.bezel * 2;
const SCREEN_H = PHONE.height - PHONE.bezel * 2;

/**
 * A hardware phone frame holding a recreated DALAN app screen.
 * Children are rendered into a clipped "screen" of fixed size so every
 * scene can lay out its mock UI at a consistent resolution.
 */
export const PhoneFrame: React.FC<{
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
  readonly screenBackground?: string;
}> = ({ children, style, screenBackground = C.background }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Gentle entrance: the phone rises and settles into place.
  const enterScale = interpolate(frame, [0, fps * 0.6], [0.955, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });
  const enterY = interpolate(frame, [0, fps * 0.7], [26, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });
  // Soft idle float so held frames never feel static.
  const floatY = Math.sin(frame / fps) * 5;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          width: PHONE.width,
          height: PHONE.height,
          borderRadius: PHONE.radius,
          background: "#0B1512",
          padding: PHONE.bezel,
          boxShadow: "0 40px 90px rgba(1,81,68,0.18)",
          translate: `0px ${enterY + floatY}px`,
          scale: `${enterScale}`,
          ...style,
        }}
      >
        <div
          style={{
            position: "relative",
            width: SCREEN_W,
            height: SCREEN_H,
            borderRadius: PHONE.screenRadius,
            overflow: "hidden",
            background: screenBackground,
            fontFamily: FONT,
          }}
        >
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const PHONE_SCREEN = { width: SCREEN_W, height: SCREEN_H } as const;

/** iOS-style status bar at the top of a screen. */
export const StatusBar: React.FC<{ readonly tint?: string }> = ({
  tint = "#111",
}) => {
  return (
    <div
      style={{
        height: 54,
        paddingTop: 14,
        paddingLeft: 44,
        paddingRight: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: tint,
        fontFamily: FONT,
      }}
    >
      <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: 0.3 }}>
        9:41
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* signal */}
        <svg width="26" height="16" viewBox="0 0 26 16">
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={i * 6}
              y={11 - i * 3.3}
              width="4"
              height={5 + i * 3.3}
              rx="1"
              fill={tint}
            />
          ))}
        </svg>
        {/* wifi */}
        <svg width="22" height="16" viewBox="0 0 22 16">
          <path
            d="M11 13.5 11 13.5M2 6a13 13 0 0 1 18 0M5 9.2a8.5 8.5 0 0 1 12 0M8 12.4a4 4 0 0 1 6 0"
            fill="none"
            stroke={tint}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="11" cy="13.5" r="1.3" fill={tint} />
        </svg>
        {/* battery */}
        <svg width="30" height="16" viewBox="0 0 30 16">
          <rect
            x="1"
            y="3"
            width="24"
            height="10"
            rx="3"
            fill="none"
            stroke={tint}
            strokeWidth="1.6"
            opacity="0.5"
          />
          <rect x="3" y="5" width="18" height="6" rx="1.5" fill={tint} />
          <rect x="26" y="6" width="2.5" height="4" rx="1" fill={tint} opacity="0.5" />
        </svg>
      </div>
    </div>
  );
};

/** DALAN wordmark + logo lockup used in app headers. */
export const BrandMark: React.FC<{
  readonly logo: string;
  readonly size?: number;
}> = ({ logo, size = 30 }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <img src={logo} width={size} height={size} style={{ objectFit: "contain" }} />
      <span
        style={{
          fontSize: size * 0.82,
          fontWeight: 800,
          color: Brand.green,
          letterSpacing: -1,
        }}
      >
        DALAN
      </span>
    </div>
  );
};

/** Shared bottom-of-conditions strip (temp / weather / humidity / air / flood). */
export const ConditionsStrip: React.FC<{
  readonly items: { icon: React.ComponentProps<typeof Icon>["name"]; text: string }[];
  readonly meta: string;
}> = ({ items, meta }) => {
  return (
    <div style={{ paddingLeft: 28, paddingRight: 28, paddingBottom: 18, gap: 7 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 18,
        }}
      >
        {items.map((item) => (
          <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Icon name={item.icon} size={22} color={C.textSecondary} strokeWidth={1.8} />
            <span style={{ fontSize: 22, fontWeight: 500, color: C.text }}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 20, color: C.textSecondary, marginTop: 6 }}>{meta}</div>
    </div>
  );
};
