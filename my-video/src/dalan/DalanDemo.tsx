import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  Series,
  staticFile,
  useVideoConfig,
} from "remotion";
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

// Voiceover narration (ElevenLabs). `to` is sized to each clip's length so the
// subtitle stays on screen while the line is spoken.
export const CAPTIONS = [
  { text: "DALAN shows what is on the road before you leave.", from: 25, to: 120, audio: "audio/vo/vo-1.mp3" },
  { text: "Ask Dally about flooding nearby,", from: 445, to: 520, audio: "audio/vo/vo-2.mp3" },
  {
    text: "and get weather, air, and flood conditions that stay on your phone.",
    from: 625,
    to: 758,
    audio: "audio/vo/vo-3.mp3",
  },
  { text: "See hazards on the map,", from: 820, to: 884, audio: "audio/vo/vo-4.mp3" },
  { text: "pin a report,", from: 1120, to: 1232, audio: "audio/vo/vo-5.mp3" },
  { text: "and track the distance you actually move.", from: 1400, to: 1482, audio: "audio/vo/vo-6.mp3" },
  { text: "Find your way, every journey.", from: 1655, to: 1728, audio: "audio/vo/vo-7.mp3" },
];

export const DalanDemo: React.FC = () => {
  const { fps } = useVideoConfig();

  // Soft music bed that gently ducks under the narration.
  const musicVolume = (f: number) => {
    const base = interpolate(
      f,
      [0, fps, TOTAL_FRAMES - fps * 1.5, TOTAL_FRAMES],
      [0, 0.2, 0.2, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
    const speaking = CAPTIONS.some((c) => f >= c.from - 6 && f <= c.to + 6);
    return base * (speaking ? 0.5 : 1);
  };

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

      {/* Upbeat music bed (loops to fill the full timeline). */}
      <Audio src={staticFile("audio/music.mp3")} loop volume={musicVolume} />

      {/* Voiceover — each line placed at its caption's start frame. */}
      {CAPTIONS.map((c) => (
        <Sequence key={c.audio} from={c.from} premountFor={fps} name={`VO: ${c.text}`}>
          <Audio src={staticFile(c.audio)} volume={1} />
        </Sequence>
      ))}

      <VoiceCaptions lines={CAPTIONS} />
    </AbsoluteFill>
  );
};
