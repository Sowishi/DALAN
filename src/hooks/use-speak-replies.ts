import { requireOptionalNativeModule } from 'expo-modules-core';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { ChatMessage } from '@/hooks/use-local-assistant';

type SpeechVoice = {
  identifier: string;
  name: string;
  language: string;
  quality: string;
};

type SpeechOptions = {
  voice?: string;
  rate?: number;
};

type SpeechModule = {
  VoiceQuality: { Enhanced: string };
  getAvailableVoicesAsync: () => Promise<SpeechVoice[]>;
  speak: (text: string, options?: SpeechOptions) => void;
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

async function halt(speech: SpeechModule | null) {
  if (!speech) return;
  try {
    await speech.stop();
  } catch {
    // Ignore a speaker that is already idle.
  }
}

let queue: Promise<void> = Promise.resolve();

function enqueue(task: () => Promise<void>) {
  queue = queue.then(task, task);
}

export function useSpeakReplies(messages: ChatMessage[], isGenerating: boolean) {
  const spokenId = useRef<string | null>(null);
  const sawHistory = useRef(false);
  const generation = useRef(0);
  const mutedRef = useRef(false);
  const focusedRef = useRef(true);
  const [muted, setMutedState] = useState(false);

  const stop = useCallback(() => {
    generation.current += 1;
    enqueue(() => halt(loadSpeech()));
  }, []);

  const setMuted = useCallback(
    (next: boolean) => {
      mutedRef.current = next;
      setMutedState(next);
      if (next) stop();
    },
    [stop],
  );

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      return () => {
        focusedRef.current = false;
        stop();
      };
    }, [stop]),
  );

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!sawHistory.current) {
      sawHistory.current = true;
      if (last?.role === 'assistant') spokenId.current = last.id;
    }

    if (!last || last.role !== 'assistant' || isGenerating) return;
    const text = last.content.trim();
    if (!text || spokenId.current === last.id) return;
    spokenId.current = last.id;
    if (mutedRef.current || !focusedRef.current) return;

    const speech = loadSpeech();
    if (!speech) return;

    const token = ++generation.current;
    enqueue(async () => {
      await halt(speech);
      if (token !== generation.current) return;
      const voice = await englishVoiceId(speech);
      if (token !== generation.current || mutedRef.current) return;
      try {
        speech.speak(text, voice ? { voice, rate: 0.92 } : { rate: 0.92 });
      } catch {
        // Chat still works if speaking fails.
      }
    });
  }, [isGenerating, messages]);

  return { stop, muted, setMuted };
}
