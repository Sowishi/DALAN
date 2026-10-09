import React from "react";
import {
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Brand, C, EASE_OUT } from "../theme";
import { PhoneFrame, StatusBar } from "../PhoneFrame";
import { Icon } from "../Icon";
import { SceneBackground, SceneFade, SceneLabel } from "../shared";

const appear = (frame: number, from: number, fps: number) => ({
  opacity: interpolate(frame - from, [0, fps * 0.45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  }),
  translate: `0px ${interpolate(frame - from, [0, fps * 0.5], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  })}px`,
});

const USER_TEXT = "Any flooding nearby?";

const Bubble: React.FC<{
  role: "user" | "assistant";
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ role, children, style }) => {
  const user = role === "user";
  return (
    <div
      style={{
        maxWidth: "84%",
        alignSelf: user ? "flex-end" : "flex-start",
        background: user ? Brand.green : C.backgroundElement,
        color: user ? Brand.white : C.text,
        borderRadius: 30,
        borderBottomRightRadius: user ? 10 : 30,
        borderBottomLeftRadius: user ? 30 : 10,
        padding: "20px 28px",
        fontSize: 28,
        lineHeight: 1.4,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const ConditionRow: React.FC<{
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <Icon name={icon} size={24} color={Brand.green} strokeWidth={1.8} />
    <span style={{ flex: 1, fontSize: 24, color: C.textSecondary }}>{label}</span>
    <span style={{ fontSize: 24, fontWeight: 600, color: C.text }}>{value}</span>
  </div>
);

// 0:14–0:26 — Dally. User asks, Dally answers plainly, then on-device conditions.
export const DallyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const typeStart = fps * 0.8;
  const typeEnd = fps * 2.8;
  const typedCount = Math.floor(
    interpolate(frame, [typeStart, typeEnd], [0, USER_TEXT.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const sendAt = fps * 3.1;
  const sent = frame >= sendAt;
  const draft = sent ? "" : USER_TEXT.slice(0, typedCount);

  const thinkingStart = fps * 3.4;
  const replyAt = fps * 4.6;
  const thinking = frame >= thinkingStart && frame < replyAt;
  const dot = (i: number) =>
    interpolate((frame - thinkingStart) % Math.round(fps * 0.6), [0, fps * 0.2 + i * 2, fps * 0.4], [0.3, 1, 0.3], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const generating = frame >= sendAt && frame < replyAt;

  return (
    <SceneFade>
      <SceneBackground />
      <SceneLabel>Ask Dally</SceneLabel>
      <PhoneFrame>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
          <StatusBar />
          {/* header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "6px 32px 10px",
              gap: 16,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 52, fontWeight: 700, color: C.text, letterSpacing: -1 }}>
                Dally
              </div>
              <div style={{ fontSize: 25, color: C.textSecondary }}>
                Your helper for road hindrances
              </div>
            </div>
            <div
              style={{
                width: 66,
                height: 66,
                borderRadius: 33,
                background: "rgba(255,255,255,0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24">
                <path d="M4 9v6h4l5 4V5L8 9H4Z" fill={Brand.green} />
                <path d="M16 8a5 5 0 0 1 0 8M18.5 5.5a9 9 0 0 1 0 13" fill="none" stroke={Brand.green} strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* thread */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              gap: 18,
              padding: "0 32px 20px",
            }}
          >
            {sent ? (
              <Bubble role="user" style={appear(frame, sendAt, fps)}>
                {USER_TEXT}
              </Bubble>
            ) : null}

            {thinking ? (
              <Bubble role="assistant">
                <div style={{ display: "flex", gap: 10, padding: "4px 2px" }}>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        background: C.textSecondary,
                        opacity: dot(i),
                      }}
                    />
                  ))}
                </div>
              </Bubble>
            ) : null}

            {frame >= replyAt ? (
              <Bubble role="assistant" style={appear(frame, replyAt, fps)}>
                One flood is reported nearby — about 1.2 km away. Slow down and stay out
                of deep water.
              </Bubble>
            ) : null}

            {frame >= replyAt + fps * 1.1 ? (
              <div
                style={{
                  alignSelf: "flex-start",
                  maxWidth: "90%",
                  background: Brand.white,
                  border: `1px solid ${C.hairline}`,
                  borderRadius: 26,
                  padding: "22px 26px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  ...appear(frame, replyAt + fps * 1.1, fps),
                }}
              >
                <div style={{ fontSize: 23, fontWeight: 700, color: C.text }}>
                  Conditions right now
                </div>
                <ConditionRow icon="thermometer" label="Temperature" value="29°" />
                <ConditionRow icon="weather" label="Weather" value="Cloudy" />
                <ConditionRow icon="humidity" label="Humidity" value="72%" />
                <ConditionRow icon="leaf" label="Air" value="Moderate" />
                <ConditionRow icon="warning" label="Flood outlook" value="Watch" />
                <div style={{ fontSize: 20, color: C.textSecondary, marginTop: 2 }}>
                  Saved on this phone · available offline
                </div>
              </div>
            ) : null}
          </div>

          {/* composer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "10px 32px 34px",
            }}
          >
            <div
              style={{
                flex: 1,
                minHeight: 84,
                borderRadius: 42,
                background: "#F4F6F5",
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "0 28px",
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  background: "#8EBFB3",
                  rotate: "45deg",
                }}
              />
              <span
                style={{
                  fontSize: 28,
                  color: draft ? C.text : C.textSecondary,
                }}
              >
                {draft || "Ask Dally…"}
                {!sent && draft && frame % 16 < 8 ? "|" : ""}
              </span>
            </div>
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: 42,
                background: Brand.green,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {generating ? (
                <svg width="40" height="40" viewBox="0 0 40 40" style={{ rotate: `${(frame * 10) % 360}deg` }}>
                  <path d="M20 4a16 16 0 0 1 16 16" fill="none" stroke={Brand.white} strokeWidth="4" strokeLinecap="round" />
                </svg>
              ) : (
                <Icon name="arrow-up" size={38} color={Brand.white} strokeWidth={2.4} />
              )}
            </div>
          </div>
        </div>
      </PhoneFrame>
    </SceneFade>
  );
};
