import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Brand, C, EASE_OUT, FONT } from "./theme";

/** Soft near-white backdrop with a faint green wash — generous, calm, no neon. */
export const SceneBackground: React.FC<{ readonly children?: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #FFFFFF 0%, #F2F7F6 60%, #EAF2F0 100%)",
        fontFamily: FONT,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Fade the whole scene in at the start and out at the end for soft cuts. */
export const SceneFade: React.FC<{ readonly children: React.ReactNode }> = ({
  children,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const f = Math.round(fps * 0.4);
  const opacity = interpolate(
    frame,
    [0, f, durationInFrames - f, durationInFrames],
    [0, 1, 1, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

/** Top headline label for a scene (brand green, inside the safe area). */
export const SceneLabel: React.FC<{
  readonly children: React.ReactNode;
  readonly from?: number;
}> = ({ children, from = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - from;
  const opacity = interpolate(t, [0, fps * 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });
  const translate = interpolate(t, [0, fps * 0.6], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });
  return (
    <div
      style={{
        position: "absolute",
        top: 104,
        left: 0,
        right: 0,
        textAlign: "center",
        fontSize: 64,
        fontWeight: 700,
        letterSpacing: -1.4,
        color: Brand.green,
        opacity,
        translate: `0px ${translate}px`,
      }}
    >
      {children}
    </div>
  );
};

/** A fingertip used to show taps on the phone. x/y are canvas coordinates. */
export const Finger: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly press?: number; // 0..1 press amount
  readonly opacity?: number;
}> = ({ x, y, press = 0, opacity = 1 }) => {
  const scale = interpolate(press, [0, 1], [1, 0.82]);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity,
        translate: "-26px -14px",
        scale,
        pointerEvents: "none",
      }}
    >
      {/* tap ripple */}
      <div
        style={{
          position: "absolute",
          left: -22,
          top: -30,
          width: 96,
          height: 96,
          borderRadius: 48,
          background: Brand.green,
          opacity: press * 0.18,
          scale: `${0.6 + press * 0.9}`,
        }}
      />
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: 27,
          background: "rgba(17,17,17,0.78)",
          border: "3px solid rgba(255,255,255,0.9)",
          boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
        }}
      />
    </div>
  );
};

type Line = { readonly text: string; readonly from: number; readonly to: number };

/**
 * Subtle voiceover captions pinned near the bottom safe area.
 * Rendered once over the whole timeline (frames are absolute).
 */
export const VoiceCaptions: React.FC<{ readonly lines: Line[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      {lines.map((line) => {
        const inOut = interpolate(
          frame,
          [line.from, line.from + 8, line.to - 8, line.to],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        if (inOut <= 0) return null;
        return (
          <div
            key={line.text}
            style={{
              position: "absolute",
              bottom: 86,
              left: 120,
              right: 120,
              textAlign: "center",
              fontSize: 34,
              lineHeight: 1.3,
              fontWeight: 500,
              color: C.textSecondary,
              opacity: inOut,
            }}
          >
            {line.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
