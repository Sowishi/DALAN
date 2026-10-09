import React from "react";
import {
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Brand, C, EASE_OUT, Risk } from "../theme";
import { PhoneFrame, StatusBar, BrandMark } from "../PhoneFrame";
import { Icon } from "../Icon";
import { Finger, SceneBackground, SceneFade, SceneLabel } from "../shared";

const CATS: {
  label: string;
  icon: React.ComponentProps<typeof Icon>["name"];
  color: string;
}[] = [
  { label: "Open Manhole", icon: "warning", color: "#F59E0B" },
  { label: "Flooding", icon: "water", color: "#3B82F6" },
  { label: "Broken light", icon: "warning", color: "#EAB308" },
  { label: "Obstruction", icon: "warning", color: "#E11D48" },
  { label: "Safety concern", icon: "shield", color: "#7C3AED" },
  { label: "Other", icon: "leaf", color: "#16A34A" },
];

const MapBase: React.FC = () => (
  <svg width="680" height="1454" viewBox="0 0 680 1454" style={{ position: "absolute", inset: 0 }}>
    <rect width="680" height="1454" fill="#E7EDEB" />
    <rect x="80" y="420" width="190" height="150" rx="18" fill="#D7E8D5" />
    <rect x="420" y="880" width="190" height="160" rx="18" fill="#D7E8D5" />
    <path d="M-20 980 C 180 940 260 1040 460 1020 C 580 1008 640 1060 720 1040 L720 1200 L-20 1240 Z" fill="#C6DEF0" />
    <g stroke="#FFFFFF" strokeWidth="26" strokeLinecap="round" fill="none">
      <path d="M-20 420 H720" /><path d="M-20 820 H720" />
      <path d="M330 -20 V1480" /><path d="M130 -20 V1480" /><path d="M540 -20 V1480" />
    </g>
  </svg>
);

const Form: React.FC<{ selectAt: number }> = ({ selectAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <StatusBar />
      <div style={{ display: "flex", alignItems: "center", padding: "6px 28px 14px" }}>
        <BrandMark logo={staticFile("brand/dalan.png")} size={34} />
      </div>
      <div style={{ padding: "0 36px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div style={{ fontSize: 50, fontWeight: 700, color: C.text, letterSpacing: -1 }}>
            Submit report
          </div>
          <div style={{ fontSize: 26, color: C.textSecondary }}>
            Tell us what is harming your environment
          </div>
        </div>
        <div style={{ fontSize: 25, fontWeight: 600, color: C.text }}>Select category</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          {CATS.map((cat, i) => {
            const isFlood = cat.label === "Flooding";
            const selected = isFlood && frame >= selectAt;
            return (
              <div
                key={cat.label}
                style={{
                  width: "47%",
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                  padding: "22px 10px",
                  borderRadius: 18,
                  background: selected ? "#EEF4F2" : C.pill,
                  border: `2px solid ${selected ? Brand.green : "#DCE0E4"}`,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    background: `${cat.color}1A`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name={cat.icon} size={32} color={cat.color} strokeWidth={1.9} />
                </div>
                <span style={{ fontSize: 23, fontWeight: selected ? 700 : 500, color: C.text }}>
                  {cat.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Picker: React.FC<{ confirmAt: number }> = ({ confirmAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // crosshair settles as the pin "drops" onto the spot
  const drop = interpolate(frame, [0, fps * 0.9], [-40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });
  const confirmed = frame >= confirmAt;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <MapBase />
      {/* center crosshair pin */}
      <div
        style={{
          position: "absolute",
          left: 340,
          top: 560,
          translate: "-32px -70px",
        }}
      >
        <div style={{ translate: `0px ${drop}px` }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              background: confirmed ? Risk.high : Brand.green,
              border: "4px solid #fff",
              boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="water" size={34} color="#fff" strokeWidth={2.4} />
          </div>
          <div
            style={{
              width: 0,
              height: 0,
              margin: "-4px auto 0",
              borderLeft: "9px solid transparent",
              borderRight: "9px solid transparent",
              borderTop: `14px solid ${confirmed ? Risk.high : Brand.green}`,
            }}
          />
        </div>
      </div>

      <StatusBar />
      <div style={{ position: "absolute", top: 70, left: 24 }}>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            background: Brand.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          }}
        >
          <Icon name="chevron-back" size={30} color={C.text} />
        </div>
      </div>

      {/* bottom sheet */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          background: Brand.white,
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
          padding: "34px 40px 44px",
          boxShadow: "0 -10px 30px rgba(0,0,0,0.10)",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div style={{ fontSize: 36, fontWeight: 700, color: C.text }}>File Flooding</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Icon name="pin" size={28} color={Brand.green} />
          <span style={{ fontSize: 24, color: C.textSecondary }}>Pin the exact spot</span>
        </div>
        <div
          style={{
            height: 92,
            borderRadius: 46,
            background: Brand.green,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <Icon name="check" size={32} color="#fff" strokeWidth={2.6} />
          <span style={{ fontSize: 30, fontWeight: 700, color: Brand.white }}>
            Confirm location
          </span>
        </div>
      </div>
    </div>
  );
};

const Result: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = interpolate(frame, [0, fps * 0.5, fps * 0.8], [0, 1.15, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });
  const toast = interpolate(frame, [fps * 0.5, fps * 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <MapBase />
      <div style={{ position: "absolute", left: 340, top: 560, translate: "-32px -70px", scale: `${pop}` }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            background: Risk.high,
            border: "4px solid #fff",
            boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="water" size={34} color="#fff" strokeWidth={2.4} />
        </div>
        <div
          style={{
            width: 0,
            height: 0,
            margin: "-4px auto 0",
            borderLeft: "9px solid transparent",
            borderRight: "9px solid transparent",
            borderTop: `14px solid ${Risk.high}`,
          }}
        />
      </div>
      <StatusBar />
      <div
        style={{
          position: "absolute",
          left: 40,
          right: 40,
          bottom: 70,
          background: Brand.green,
          borderRadius: 28,
          padding: "26px 30px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          opacity: toast,
          translate: `0px ${(1 - toast) * 20}px`,
          boxShadow: "0 12px 30px rgba(1,81,68,0.3)",
        }}
      >
        <Icon name="check" size={32} color={Brand.yellow} strokeWidth={2.6} />
        <span style={{ fontSize: 27, fontWeight: 600, color: "#fff" }}>
          Report posted. It now shows on the map.
        </span>
      </div>
    </div>
  );
};

// 0:36–0:46 — Report. Pick Flood, drop a pin, confirm, marker appears on the map.
export const ReportScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const formOut = fps * 4;
  const pickerIn = fps * 4.2;
  const pickerOut = fps * 7.6;
  const resultIn = fps * 7.8;

  const selectAt = fps * 1.9;
  const confirmAt = fps * 6.9;

  const formOpacity = interpolate(frame, [formOut, formOut + fps * 0.4], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pickerOpacity = interpolate(
    frame,
    [pickerIn, pickerIn + fps * 0.4, pickerOut, pickerOut + fps * 0.4],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const resultOpacity = interpolate(frame, [resultIn, resultIn + fps * 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Finger A → Flood tile; Finger B → Confirm button.
  const fingerA = interpolate(frame, [fps * 0.9, fps * 1.6, selectAt + fps * 0.3, selectAt + fps * 0.7], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pressA = interpolate(frame, [selectAt - 4, selectAt, selectAt + 8], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fingerB = interpolate(frame, [fps * 5.4, fps * 6, confirmAt + fps * 0.3, confirmAt + fps * 0.7], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pressB = interpolate(frame, [confirmAt - 4, confirmAt, confirmAt + 8], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneFade>
      <SceneBackground />
      <SceneLabel>Pin it. Share it.</SceneLabel>
      <PhoneFrame>
        {formOpacity > 0 ? (
          <div style={{ position: "absolute", inset: 0, opacity: formOpacity }}>
            <Form selectAt={selectAt} />
          </div>
        ) : null}
        {pickerOpacity > 0 ? (
          <div style={{ position: "absolute", inset: 0, opacity: pickerOpacity }}>
            <Picker confirmAt={confirmAt} />
          </div>
        ) : null}
        {resultOpacity > 0 ? (
          <div style={{ position: "absolute", inset: 0, opacity: resultOpacity }}>
            <Result />
          </div>
        ) : null}
      </PhoneFrame>
      {fingerA > 0 ? <Finger x={700} y={845} press={pressA} opacity={fingerA} /> : null}
      {fingerB > 0 ? <Finger x={560} y={1505} press={pressB} opacity={fingerB} /> : null}
    </SceneFade>
  );
};
