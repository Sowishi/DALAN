import { requireOptionalNativeModule } from 'expo-modules-core';

type SpeechVoice = {
  identifier: string;
  name: string;
  language: string;
  quality: string;
};

type SpeechModule = {
  VoiceQuality: { Enhanced: string };
  getAvailableVoicesAsync: () => Promise<SpeechVoice[]>;
  speak: (text: string, options?: { voice?: string; rate?: number }) => void;
  stop: () => Promise<void>;
};

function loadSpeech(): SpeechModule | null {
  if (!requireOptionalNativeModule('ExpoSpeech')) return null;
  try {
    return require('expo-speech') as SpeechModule;
  } catch {
    return null;
  }
}

let englishVoice: Promise<string | undefined> | null = null;
let queue: Promise<void> = Promise.resolve();
let generation = 0;

function clarityScore(voice: SpeechVoice, enhanced: string) {
  const language = voice.language.toLowerCase().replace(/_/g, '-');
  if (!language.startsWith('en')) return -1;

  const label = `${voice.name} ${voice.identifier}`.toLowerCase();
  let score = voice.quality === enhanced ? 40 : 0;
  if (language.startsWith('en-us')) score += 30;
  else if (language.startsWith('en-gb')) score += 26;
  else if (language.startsWith('en-au')) score += 18;
  else score += 8;
  if (label.includes('local')) score += 8;
  if (label.includes('google') || label.includes('enhanced') || label.includes('premium')) score += 6;
  if (/(compact|very-low|low-quality)/.test(label)) score -= 25;
  if (label.includes('network') && !label.includes('local')) score -= 30;
  return score;
}

function englishVoiceId(speech: SpeechModule) {
  englishVoice ??= speech
    .getAvailableVoicesAsync()
    .then((voices) => {
      const ranked = voices
        .map((voice) => ({ voice, score: clarityScore(voice, speech.VoiceQuality.Enhanced) }))
        .filter((item) => item.score >= 0)
        .sort((a, b) => b.score - a.score);
      return ranked[0]?.voice.identifier;
    })
    .catch(() => undefined);
  return englishVoice;
}

function enqueue(task: () => Promise<void>) {
  queue = queue.then(task, task);
}

export async function stopSpeech() {
  generation += 1;
  const speech = loadSpeech();
  if (!speech) return;
  try {
    await speech.stop();
  } catch {
    // Already idle.
  }
}

export function speakText(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const speech = loadSpeech();
  if (!speech) return;

  const token = ++generation;
  enqueue(async () => {
    try {
      await speech.stop();
    } catch {
      // Ignore.
    }
    if (token !== generation) return;
    const voice = await englishVoiceId(speech);
    if (token !== generation) return;
    try {
      speech.speak(trimmed, voice ? { voice, rate: 0.94 } : { rate: 0.94 });
    } catch {
      // Speech is optional.
    }
  });
}
