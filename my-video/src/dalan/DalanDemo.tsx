import React from "react";
import { AbsoluteFill, Series, useVideoConfig } from "remotion";
import { OpenScene } from "./scenes/OpenScene";
import { SignInScene } from "./scenes/SignInScene";
import { DallyScene } from "./scenes/DallyScene";
import { MapScene } from "./scenes/MapScene";
import { ReportScene } from "./scenes/ReportScene";
import { MoveScene } from "./scenes/MoveScene";
import { CloseScene } from "./scenes/CloseScene";
import { VoiceCaptions } from "./shared";

// 60s @ 30fps = 1800 frames, 1080x1920.
export const DURATIONS = {
  open: 180, // 0:00–0:06
  signIn: 240, // 0:06–0:14
  dally: 360, // 0:14–0:26
  map: 300, // 0:26–0:36
  report: 300, // 0:36–0:46
  move: 240, // 0:46–0:54
  close: 180, // 0:54–1:00
} as const;

export const TOTAL_FRAMES = Object.values(DURATIONS).reduce((a, b) => a + b, 0);

// Voiceover narration, surfaced as subtle captions (absolute frames).
const CAPTIONS = [
  { text: "DALAN shows what is on the road before you leave.", from: 25, to: 300 },
  { text: "Ask Dally about flooding nearby,", from: 445, to: 620 },
  {
    text: "and get weather, air, and flood conditions that stay on your phone.",
    from: 625,
    to: 775,
  },
  { text: "See hazards on the map,", from: 820, to: 1010 },
  { text: "pin a report,", from: 1120, to: 1300 },
  { text: "and track the distance you actually move.", from: 1400, to: 1600 },
  { text: "Find your way, every journey.", from: 1655, to: 1795 },
];

export const DalanDemo: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#ffffff" }}>
      <Series>
        <Series.Sequence name="Open" durationInFrames={DURATIONS.open} premountFor={fps}>
          <OpenScene />
        </Series.Sequence>
        <Series.Sequence name="Sign in" durationInFrames={DURATIONS.signIn} premountFor={fps}>
          <SignInScene />
        </Series.Sequence>
        <Series.Sequence name="Dally" durationInFrames={DURATIONS.dally} premountFor={fps}>
          <DallyScene />
        </Series.Sequence>
        <Series.Sequence name="Map" durationInFrames={DURATIONS.map} premountFor={fps}>
          <MapScene />
        </Series.Sequence>
        <Series.Sequence name="Report" durationInFrames={DURATIONS.report} premountFor={fps}>
          <ReportScene />
        </Series.Sequence>
        <Series.Sequence name="Move" durationInFrames={DURATIONS.move} premountFor={fps}>
          <MoveScene />
        </Series.Sequence>
        <Series.Sequence name="Close" durationInFrames={DURATIONS.close} premountFor={fps}>
          <CloseScene />
        </Series.Sequence>
      </Series>
      <VoiceCaptions lines={CAPTIONS} />
    </AbsoluteFill>
  );
};
