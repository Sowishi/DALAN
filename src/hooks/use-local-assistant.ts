import { File, Paths } from 'expo-file-system';
import * as Location from 'expo-location';
import { initLlama, type LlamaContext } from 'llama.rn';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ASSISTANT_GUIDE } from '@/constants/assistant-guide';
import { HAZARD_META } from '@/constants/hazards';
import {
  formatConditionsReply,
  isConditionsFresh,
  isConditionsIntent,
  loadConditions,
  readCachedConditions,
  summarizeConditions,
  type Conditions,
  type PlaceCoords,
} from '@/services/conditions';
import {
  detectHazardType,
  extractDetails,
  formatListReply,
  isAffirmative,
  isListIntent,
  isNegative,
  isReportIntent,
  listReports,
  submitReport,
  type PendingReport,
} from '@/services/dally-tools';
import { setSharedLlama } from '@/services/local-llm';
import { isExpoGo } from '@/utils/is-expo-go';

export type AssistantStatus = 'downloading' | 'loading' | 'ready' | 'error';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const MODEL_FILENAME = 'qwen2.5-0.5b-instruct-q4_k_m.gguf';
const MODEL_URL =
  'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf';
const MIN_MODEL_BYTES = 300 * 1024 * 1024;
const N_CTX = 1024;
const N_PREDICT = 128;
const HISTORY_MESSAGES = 4;
const STOP_WORDS = ['</s>', '<|im_end|>', '<|endoftext|>'];

function toModelPath(uri: string) {
  if (uri.startsWith('file://')) {
    return decodeURIComponent(uri.replace('file://', ''));
  }
  return uri;
}

function nextId(role: ChatMessage['role']) {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useLocalAssistant() {
  const contextRef = useRef<LlamaContext | null>(null);
  const cancelledRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const generatingRef = useRef(false);
  const prepareIdRef = useRef(0);

  const [status, setStatus] = useState<AssistantStatus>('downloading');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingReport, setPendingReport] = useState<PendingReport | null>(null);
  const pendingRef = useRef<PendingReport | null>(null);

  const releaseContext = useCallback(async () => {
    const ctx = contextRef.current;
    contextRef.current = null;
    setSharedLlama(null);
    if (ctx) {
      await ctx.release().catch(() => undefined);
    }
  }, []);

  const prepare = useCallback(async () => {
    const prepareId = ++prepareIdRef.current;
    const isStale = () => prepareId !== prepareIdRef.current || cancelledRef.current;

    cancelledRef.current = false;
    abortRef.current?.abort();
    await releaseContext();
    if (isStale()) return;

    if (isExpoGo()) {
      setStatus('error');
      setError('On-device chat needs a development build. Expo Go cannot load this model.');
      return;
    }

    setError(null);
    setDownloadProgress(0);
    setLoadProgress(0);
    setStatus('downloading');

    try {
      const file = new File(Paths.document, MODEL_FILENAME);
      const usable = file.exists && file.size >= MIN_MODEL_BYTES;

      if (!usable) {
        if (file.exists) {
          file.delete();
        }

        const controller = new AbortController();
        abortRef.current = controller;

        const task = File.createDownloadTask(MODEL_URL, file, {
          headers: { 'User-Agent': 'DALAN/1.0' },
          signal: controller.signal,
          onProgress: ({ bytesWritten, totalBytes }) => {
            if (cancelledRef.current) return;
            if (totalBytes > 0) {
              setDownloadProgress(Math.min(1, bytesWritten / totalBytes));
            }
          },
        });

        const downloaded = await task.downloadAsync();
        if (isStale()) return;
        if (!downloaded || !downloaded.exists || downloaded.size < MIN_MODEL_BYTES) {
          throw new Error('The model download did not finish. Check Wi-Fi and try again.');
        }
        setDownloadProgress(1);
      } else {
        setDownloadProgress(1);
      }

      if (isStale()) return;

      setStatus('loading');
      const context = await initLlama(
        {
          model: toModelPath(file.uri),
          n_ctx: N_CTX,
          n_gpu_layers: 0,
          use_mlock: false,
        },
        (progress) => {
          if (!cancelledRef.current) {
            setLoadProgress(Math.min(1, progress > 1 ? progress / 100 : progress));
          }
        },
      );

      if (isStale()) {
        await context.release().catch(() => undefined);
        return;
      }

      contextRef.current = context;
      setSharedLlama(context);
      setLoadProgress(1);
      setStatus('ready');
    } catch (err) {
      if (isStale()) return;
      const message = err instanceof Error ? err.message : 'Could not prepare the local model.';
      if (err instanceof Error && (err.name === 'AbortError' || /abort|cancel/i.test(message))) {
        return;
      }
      setError(message);
      setStatus('error');
    }
  }, [releaseContext]);

  useEffect(() => {
    cancelledRef.current = false;
    void prepare();

    return () => {
      prepareIdRef.current += 1;
      cancelledRef.current = true;
      abortRef.current?.abort();
      void releaseContext();
    };
  }, [prepare, releaseContext]);

  const currentCoords = useCallback(async (fallback?: PlaceCoords) => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) return fallback;
      const fix = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return { latitude: fix.coords.latitude, longitude: fix.coords.longitude };
    } catch {
      return fallback;
    }
  }, []);

  const ensureConditions = useCallback(async () => {
    const cached = await readCachedConditions();
    if (isConditionsFresh(cached)) {
      void currentCoords(cached?.coords).then((coords) => loadConditions(coords).catch(() => undefined));
      return { data: cached, offline: false };
    }

    const coords = await currentCoords(cached?.coords);
    return loadConditions(coords);
  }, [currentCoords]);

  const appendDally = useCallback((content: string) => {
    setMessages((prev) => [...prev, { id: nextId('assistant'), role: 'assistant', content }]);
  }, []);

  const setPending = useCallback((next: PendingReport | null) => {
    pendingRef.current = next;
    setPendingReport(next);
  }, []);

  const cancelPending = useCallback(() => {
    if (!pendingRef.current) return;
    setPending(null);
    appendDally('Okay, I cancelled that report.');
  }, [appendDally, setPending]);

  const confirmPin = useCallback(
    async (location: { latitude: number; longitude: number }) => {
      const pending = pendingRef.current;
      if (!pending) return;

      try {
        await submitReport({
          type: pending.type,
          description: pending.description,
          latitude: location.latitude,
          longitude: location.longitude,
        });
        setPending(null);
        appendDally(
          `Posted. Your ${HAZARD_META[pending.type].label} report is on the Map now.`,
        );
      } catch {
        appendDally('I could not save that report. Check your connection and try again.');
      }
    },
    [appendDally, setPending],
  );

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || generatingRef.current) return;

    const userMessage: ChatMessage = { id: nextId('user'), role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);

    const pending = pendingRef.current;
    if (pending?.awaiting === 'confirm') {
      if (isAffirmative(trimmed)) {
        setPending({ ...pending, awaiting: 'location' });
        appendDally('Pin the exact spot on the map, then tap Use this location.');
        return;
      }
      if (isNegative(trimmed)) {
        cancelPending();
        return;
      }
    }

    if (isReportIntent(trimmed)) {
      const type = detectHazardType(trimmed) ?? 'other';
      const description = extractDetails(trimmed, type);
      setPending({ type, description, awaiting: 'location' });
      const detail = description ? `: ${description}` : '';
      appendDally(
        `I can file a ${HAZARD_META[type].label} report${detail}. Pin the exact spot on the map, then tap Post report.`,
      );
      return;
    }

    if (isListIntent(trimmed)) {
      try {
        const { reports } = await listReports();
        const origin = await currentCoords();
        const cached = detectHazardType(trimmed) === 'flood' ? await readCachedConditions() : null;
        appendDally(formatListReply(reports, trimmed, origin ?? null, cached?.floodLabel));
      } catch {
        appendDally('I could not load live reports. Check your connection and try again.');
      }
      return;
    }

    let conditions: { data: Conditions | null; offline: boolean } = { data: null, offline: true };
    try {
      conditions = await ensureConditions();
    } catch {
      conditions = { data: await readCachedConditions(), offline: true };
    }

    if (isConditionsIntent(trimmed)) {
      appendDally(formatConditionsReply(conditions.data, conditions.offline));
      return;
    }

    const context = contextRef.current;
    if (!context) return;

    generatingRef.current = true;
    setIsGenerating(true);

    const assistantMessage: ChatMessage = { id: nextId('assistant'), role: 'assistant', content: '' };
    setMessages((prev) => [...prev, assistantMessage]);

    const history = [...messages, userMessage].slice(-HISTORY_MESSAGES).map((item) => ({
      role: item.role,
      content: item.content,
    }));

    try {
      let liveReports = 'No live reports right now.';
      try {
        liveReports = (await listReports()).summary;
      } catch {
        // Keep chatting even if Firestore is unreachable.
      }

      await context.clearCache();
      const result = await context.completion(
        {
          messages: [
            {
              role: 'system',
              content: `${ASSISTANT_GUIDE}\n${summarizeConditions(conditions.data, conditions.offline)}\nLive reports:\n${liveReports}`,
            },
            ...history,
          ],
          n_predict: N_PREDICT,
          temperature: 0.7,
          stop: STOP_WORDS,
        },
        (data) => {
          const streamed = data.accumulated_text ?? data.content;
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (!last || last.id !== assistantMessage.id) return prev;
            next[next.length - 1] = {
              ...last,
              content: streamed && streamed.length > 0 ? streamed : `${last.content}${data.token ?? ''}`,
            };
            return next;
          });
        },
      );

      const finalText = (result.content || result.text || '').trim();
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.id === assistantMessage.id) {
          next[next.length - 1] = {
            ...last,
            content: finalText || last.content.trim() || 'I do not know.',
          };
        }
        return next;
      });
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.id === assistantMessage.id) {
          next[next.length - 1] = {
            ...last,
            content: last.content.trim() || 'I could not finish that reply. Try again.',
          };
        }
        return next;
      });
    } finally {
      generatingRef.current = false;
      setIsGenerating(false);
    }
  }, [appendDally, cancelPending, ensureConditions, messages, setPending]);

  return {
    status,
    downloadProgress,
    loadProgress,
    error,
    messages,
    isGenerating,
    pendingReport,
    send,
    confirmPin,
    cancelPending,
    retry: prepare,
  };
}
