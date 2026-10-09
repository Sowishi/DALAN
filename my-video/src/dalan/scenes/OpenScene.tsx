import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Brand, C, EASE_OUT, FONT } from "../theme";

// 0:00–0:06 — Open. White screen, logo scales in, title, subtitle, drawn line.
export const OpenScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoOpacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });
  const logoScale = interpolate(
    frame,
    [0, fps * 0.7, fps * 1.1],
    [0.8, 1.06, 1],
    { extrapolateRight: "clamp", easing: Easing.bezier(...EASE_OUT) },
  );

  const titleT = frame - fps * 0.5;
  const titleOpacity = interpolate(titleT, [0, fps * 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });
  const titleY = interpolate(titleT, [0, fps * 0.6], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });

  const subT = frame - fps * 1.0;
  const subOpacity = interpolate(subT, [0, fps * 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });

  const lineW = interpolate(frame - fps * 1.5, [0, fps * 1.1], [0, 460], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });

  return (
    <AbsoluteFill
      style={{
        background: "#ffffff",
        fontFamily: FONT,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <img
          src={staticFile("brand/dalan.png")}
          width={300}
          height={300}
          style={{
            objectFit: "contain",
            opacity: logoOpacity,
            scale: `${logoScale}`,
          }}
        />
        <div
          style={{
            marginTop: 24,
            fontSize: 150,
            fontWeight: 800,
            letterSpacing: -5,
            color: Brand.green,
            opacity: titleOpacity,
            translate: `0px ${titleY}px`,
          }}
        >
          DALAN
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 44,
            fontWeight: 500,
            color: C.textSecondary,
            opacity: subOpacity,
          }}
        >
          See the road before you take it.
        </div>
        <div
          style={{
            marginTop: 34,
            width: lineW,
            height: 4,
            borderRadius: 2,
            background: Brand.green,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
