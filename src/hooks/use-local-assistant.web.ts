import { useCallback, useState } from 'react';

export type AssistantStatus = 'downloading' | 'loading' | 'ready' | 'error';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const WEB_ERROR = 'On-device chat runs on a phone or emulator.';

export function useLocalAssistant() {
  const [error] = useState<string | null>(WEB_ERROR);

  const send = useCallback(async (_text: string) => {}, []);
  const retry = useCallback(async () => {}, []);

  return {
    status: 'error' as AssistantStatus,
    downloadProgress: 0,
    loadProgress: 0,
    error,
    messages: [] as ChatMessage[],
    isGenerating: false,
    send,
    retry,
  };
}
