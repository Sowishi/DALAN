import React from "react";
import {
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Brand, C, EASE_OUT, FONT } from "../theme";
import { PhoneFrame, StatusBar } from "../PhoneFrame";
import { Icon } from "../Icon";
import { Finger, SceneBackground, SceneFade } from "../shared";

const Field: React.FC<{ label: string; value: string; dots?: boolean }> = ({
  label,
  value,
  dots,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    <span style={{ fontSize: 24, fontWeight: 600, color: C.text }}>{label}</span>
    <div
      style={{
        height: 86,
        borderRadius: 16,
        background: C.backgroundElement,
        border: `1px solid ${C.backgroundSelected}`,
        display: "flex",
        alignItems: "center",
        paddingLeft: 26,
        fontSize: dots ? 34 : 28,
        letterSpacing: dots ? 6 : 0,
        color: C.text,
      }}
    >
      {value}
    </div>
  </div>
);

const LoginContent: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = (delay: number) => ({
    opacity: interpolate(frame - delay, [0, fps * 0.5], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(...EASE_OUT),
    }),
    translate: `0px ${interpolate(frame - delay, [0, fps * 0.6], [16, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(...EASE_OUT),
    })}px`,
  });

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <StatusBar />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 44px",
          gap: 40,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, ...rise(0) }}>
          <img src={staticFile("brand/dalan.png")} width={170} height={170} style={{ objectFit: "contain" }} />
          <span style={{ fontSize: 42, fontWeight: 700, color: C.text }}>Welcome back</span>
          <span style={{ fontSize: 26, color: C.textSecondary }}>Find your way, every journey</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22, ...rise(fps * 0.25) }}>
          <Field label="Email" value="alex@dalan.app" />
          <Field label="Password" value="••••••••" dots />
          <span style={{ alignSelf: "flex-end", fontSize: 24, fontWeight: 600, color: Brand.green }}>
            Forgot password?
          </span>

          <div
            style={{
              height: 88,
              borderRadius: 16,
              background: Brand.green,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              color: Brand.white,
            }}
          >
            Sign In
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ flex: 1, height: 1, background: C.backgroundSelected }} />
            <span style={{ fontSize: 24, color: C.textSecondary }}>or</span>
            <div style={{ flex: 1, height: 1, background: C.backgroundSelected }} />
          </div>

          <div
            data-google
            style={{
              height: 88,
              borderRadius: 16,
              background: Brand.white,
              border: `2px solid ${Brand.green}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
            }}
          >
            <Icon name="google" size={30} />
            <span style={{ fontSize: 28, fontWeight: 700, color: Brand.green }}>
              Continue with Google
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Loader: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = interpolate(frame % Math.round(fps * 1.8), [0, fps * 0.9, fps * 1.8], [1, 1.06, 1], {
    easing: Easing.inOut(Easing.ease),
  });
  const spin = (frame * 7) % 360;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
        padding: "0 60px",
        textAlign: "center",
      }}
    >
      <img
        src={staticFile("brand/dally.png")}
        width={220}
        height={220}
        style={{ objectFit: "contain", scale: `${pulse}` }}
      />
      <svg width="54" height="54" viewBox="0 0 54 54" style={{ rotate: `${spin}deg` }}>
        <circle cx="27" cy="27" r="22" fill="none" stroke={C.backgroundSelected} strokeWidth="5" />
        <path
          d="M27 5a22 22 0 0 1 22 22"
          fill="none"
          stroke={Brand.green}
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
      <span style={{ fontSize: 36, fontWeight: 600, color: C.text }}>Getting things ready</span>
      <span style={{ fontSize: 27, lineHeight: 1.4, color: C.textSecondary }}>
        Saving weather, air, flood, and reports on this phone.
      </span>
    </div>
  );
};

// 0:06–0:14 — Sign in. Login screen, tap Continue with Google, then the loader.
export const SignInScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tapAt = fps * 5; // 150
  const press = interpolate(frame, [tapAt - 4, tapAt, tapAt + 8], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const loginOpacity = interpolate(frame, [tapAt + 8, tapAt + 20], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const loaderOpacity = interpolate(frame, [tapAt + 14, tapAt + 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Finger travels toward the Google button and lifts after the tap.
  const fx = interpolate(frame, [fps * 2, fps * 4.9], [740, 540], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });
  const fy = interpolate(frame, [fps * 2, fps * 4.9], [1620, 1400], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });
  const fingerOpacity = interpolate(
    frame,
    [fps * 1.6, fps * 2, tapAt + 6, tapAt + 16],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <SceneFade>
      <SceneBackground />
      <PhoneFrame>
        <div style={{ position: "absolute", inset: 0, opacity: loginOpacity, display: "flex", fontFamily: FONT }}>
          <LoginContent />
        </div>
        {loaderOpacity > 0 ? (
          <div style={{ position: "absolute", inset: 0, opacity: loaderOpacity, display: "flex", fontFamily: FONT }}>
            <Loader />
          </div>
        ) : null}
      </PhoneFrame>
      {fingerOpacity > 0 ? <Finger x={fx} y={fy} press={press} opacity={fingerOpacity} /> : null}
    </SceneFade>
  );
};
