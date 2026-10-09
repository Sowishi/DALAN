import { Composition, Folder, staticFile } from "remotion";
import {
  CaptionedVideo,
  calculateCaptionedVideoMetadata,
  captionedVideoSchema,
} from "./CaptionedVideo";
import { DalanDemo, DURATIONS, TOTAL_FRAMES } from "./dalan/DalanDemo";
import { OpenScene } from "./dalan/scenes/OpenScene";
import { SignInScene } from "./dalan/scenes/SignInScene";
import { DallyScene } from "./dalan/scenes/DallyScene";
import { MapScene } from "./dalan/scenes/MapScene";
import { ReportScene } from "./dalan/scenes/ReportScene";
import { MoveScene } from "./dalan/scenes/MoveScene";
import { CloseScene } from "./dalan/scenes/CloseScene";

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DalanDemo"
        component={DalanDemo}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      <Folder name="Scenes">
        <Composition
          id="Open"
          component={OpenScene}
          durationInFrames={DURATIONS.open}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="SignIn"
          component={SignInScene}
          durationInFrames={DURATIONS.signIn}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="Dally"
          component={DallyScene}
          durationInFrames={DURATIONS.dally}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="Map"
          component={MapScene}
          durationInFrames={DURATIONS.map}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="Report"
          component={ReportScene}
          durationInFrames={DURATIONS.report}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="Move"
          component={MoveScene}
          durationInFrames={DURATIONS.move}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        <Composition
          id="Close"
          component={CloseScene}
          durationInFrames={DURATIONS.close}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
      </Folder>

      <Composition
        id="CaptionedVideo"
        component={CaptionedVideo}
        calculateMetadata={calculateCaptionedVideoMetadata}
        schema={captionedVideoSchema}
        width={1080}
        height={1920}
        defaultProps={{
          src: staticFile("sample-video.mp4"),
        }}
      />
    </>
  );
};
