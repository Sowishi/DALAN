// Generates DALAN demo audio with ElevenLabs:
//  - per-line voiceover (TTS) -> public/audio/vo/vo-N.mp3
//  - an upbeat background music bed -> public/audio/music.mp3
//
// Usage:  ELEVENLABS_API_KEY=sk_... node generate-audio.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) {
  console.error("Missing ELEVENLABS_API_KEY");
  process.exit(1);
}

// Current ElevenLabs "default" voices that free accounts can use via API.
const CANDIDATE_VOICES = [
  ["Brian", "nPczCjzI2devNBz1zQrb"],
  ["Bill", "pqHfZKP75CvOlQylNhV4"],
  ["George", "JBFqnCBsd6RMkjVDRZzb"],
  ["Daniel", "onwK4e9ZLuTAKqWW03F9"],
  ["Chris", "iP95p4xoKVk53GoZ742B"],
  ["Sarah", "EXAVITQu4vr4xnSDxMaL"],
  ["Laura", "FGY2WhTYpPnrIDTdsKH5"],
  ["Aria", "9BWtsMINqrJLrRacOk9x"],
  ["Roger", "CwhRBWXzGAHq8TQ4Fs17"],
];

// The key lacks voices_read, so probe candidates with a tiny TTS call.
async function resolveVoice() {
  for (const [name, id] of CANDIDATE_VOICES) {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${id}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({ text: "Dalan.", model_id: "eleven_multilingual_v2" }),
      },
    );
    if (res.ok) {
      console.log(`  using voice: ${name} (${id})`);
      return id;
    }
    console.warn(`  ${name} not usable (${res.status})`);
  }
  throw new Error("No usable default voice found for this account.");
}

const LINES = [
  "DALAN shows what is on the road before you leave.",
  "Ask Dally about flooding nearby,",
  "and get weather, air, and flood conditions that stay on your phone.",
  "See hazards on the map,",
  "pin a report,",
  "and track the distance you actually move.",
  "Find your way, every journey.",
];

mkdirSync("public/audio/vo", { recursive: true });

async function tts(text, index, voiceId) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.75,
          style: 0.35,
          use_speaker_boost: true,
        },
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`TTS ${index} failed ${res.status}: ${await res.text()}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const path = `public/audio/vo/vo-${index}.mp3`;
  writeFileSync(path, buf);
  console.log(`  wrote ${path} (${buf.length} bytes)`);
}

async function music() {
  const prompt =
    "Upbeat, modern, optimistic corporate tech background music for a mobile app product demo. " +
    "Light plucky synth and soft piano with a gentle driving beat, warm and friendly, clean and minimal, " +
    "no vocals. Positive and forward-moving but understated so narration sits on top.";

  // Try the ElevenLabs Music API first (full-length track).
  try {
    const res = await fetch(
      "https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128",
      {
        method: "POST",
        headers: {
          "xi-api-key": KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({ prompt, music_length_ms: 60000 }),
      },
    );
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      writeFileSync("public/audio/music.mp3", buf);
      console.log(`  wrote public/audio/music.mp3 via Music API (${buf.length} bytes)`);
      return;
    }
    console.warn(`  Music API ${res.status}: ${await res.text()}`);
  } catch (e) {
    console.warn(`  Music API error: ${e.message}`);
  }

  // Fallback: sound-generation (<=22s), looped in Remotion.
  const res = await fetch(
    "https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128",
    {
      method: "POST",
      headers: {
        "xi-api-key": KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: prompt,
        duration_seconds: 22,
        prompt_influence: 0.4,
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`Music fallback failed ${res.status}: ${await res.text()}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync("public/audio/music.mp3", buf);
  console.log(`  wrote public/audio/music.mp3 via sound-generation loop (${buf.length} bytes)`);
}

console.log("Resolving voice...");
const voiceId = await resolveVoice();
console.log("Generating voiceover...");
for (let i = 0; i < LINES.length; i++) {
  await tts(LINES[i], i + 1, voiceId);
}
console.log("Generating music...");
await music();
console.log("Done.");
