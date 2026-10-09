import React from "react";
import {
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Brand, C, EASE_OUT } from "../theme";
import { PhoneFrame, StatusBar, BrandMark } from "../PhoneFrame";
import { Icon } from "../Icon";
import { SceneBackground, SceneFade, SceneLabel } from "../shared";

const MODES: { label: string; icon: React.ComponentProps<typeof Icon>["name"] }[] = [
  { label: "Walk", icon: "walk" },
  { label: "Run", icon: "run" },
  { label: "Cycle", icon: "bike" },
  { label: "Drive", icon: "car" },
];

// 0:46–0:54 — Move. Modes, a short route traces, weekly totals count up.
export const MoveScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const trace = interpolate(frame, [fps * 1.2, fps * 4.2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });

  const count = interpolate(frame, [fps * 3.4, fps * 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });
  const km = (count * 12.4).toFixed(1);
  const kcal = Math.round(count * 640);

  return (
    <SceneFade>
      <SceneBackground />
      <SceneLabel>Your movement, counted</SceneLabel>
      <PhoneFrame>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
          <StatusBar />
          <div style={{ display: "flex", alignItems: "center", padding: "6px 28px 10px" }}>
            <BrandMark logo={staticFile("brand/dalan.png")} size={34} />
          </div>

          <div style={{ padding: "0 36px", display: "flex", flexDirection: "column", gap: 26 }}>
            <div>
              <div style={{ fontSize: 54, fontWeight: 700, color: C.text, letterSpacing: -1 }}>
                Move
              </div>
              <div style={{ fontSize: 26, color: C.textSecondary }}>
                Track your journey, your way
              </div>
            </div>

            {/* modes */}
            <div style={{ display: "flex", gap: 14 }}>
              {MODES.map((m) => {
                const active = m.label === "Run";
                return (
                  <div
                    key={m.label}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 10,
                      padding: "20px 0",
                      borderRadius: 22,
                      background: active ? Brand.green : C.backgroundElement,
                    }}
                  >
                    <Icon name={m.icon} size={38} color={active ? "#fff" : C.text} strokeWidth={2} />
                    <span style={{ fontSize: 22, fontWeight: 600, color: active ? "#fff" : C.text }}>
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* route map */}
            <div
              style={{
                height: 440,
                borderRadius: 28,
                overflow: "hidden",
                background: "#E7EDEB",
                position: "relative",
              }}
            >
              <svg width="100%" height="100%" viewBox="0 0 608 440" preserveAspectRatio="none">
                <rect width="608" height="440" fill="#E7EDEB" />
                <g stroke="#FFFFFF" strokeWidth="22" strokeLinecap="round" fill="none">
                  <path d="M-20 140 H628" /><path d="M-20 320 H628" />
                  <path d="M160 -20 V460" /><path d="M440 -20 V460" />
                </g>
                <rect x="200" y="180" width="200" height="100" rx="14" fill="#D7E8D5" />
                {/* traced route */}
                <path
                  d="M90 380 C 160 300 160 240 300 230 C 430 220 440 150 540 90"
                  fill="none"
                  stroke={Brand.green}
                  strokeWidth="12"
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - trace}
                />
                {/* start dot */}
                <circle cx="90" cy="380" r="12" fill={Brand.green} stroke="#fff" strokeWidth="4" />
                {/* moving head */}
                {trace > 0.02 ? (
                  <circle
                    cx={interpolate(trace, [0, 1], [90, 540])}
                    cy={interpolate(trace, [0, 0.5, 1], [380, 232, 90])}
                    r="14"
                    fill={Brand.yellow}
                    stroke="#fff"
                    strokeWidth="4"
                  />
                ) : null}
              </svg>
            </div>

            {/* this week */}
            <div style={{ fontSize: 30, fontWeight: 700, color: C.text }}>This week</div>
            <div style={{ display: "flex", gap: 18 }}>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: 22,
                  borderRadius: 26,
                  background: C.backgroundElement,
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    background: "rgba(1,81,68,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="pin" size={30} color={Brand.green} />
                </div>
                <div>
                  <div style={{ fontSize: 34, fontWeight: 700, color: C.text }}>{km} km</div>
                  <div style={{ fontSize: 22, color: C.textSecondary }}>Distance</div>
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: 22,
                  borderRadius: 26,
                  background: C.backgroundElement,
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    background: "rgba(247,104,8,0.10)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="flame" size={30} color="#F76808" />
                </div>
                <div>
                  <div style={{ fontSize: 34, fontWeight: 700, color: C.text }}>
                    {kcal.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 22, color: C.textSecondary }}>Est. calories</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PhoneFrame>
    </SceneFade>
  );
};
