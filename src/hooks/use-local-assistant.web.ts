import { useCallback, useState } from 'react';

import type { PendingReport } from '@/services/dally-tools';

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
  const confirmPin = useCallback(async (_location: { latitude: number; longitude: number }) => {}, []);
  const cancelPending = useCallback(() => {}, []);

  return {
    status: 'error' as AssistantStatus,
    downloadProgress: 0,
    loadProgress: 0,
    error,
    messages: [] as ChatMessage[],
    isGenerating: false,
    pendingReport: null as PendingReport | null,
    send,
    confirmPin,
    cancelPending,
    retry,
  };
}
