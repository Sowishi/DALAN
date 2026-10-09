type CompletionResult = {
  content?: string;
  text?: string;
};

type LlamaLike = {
  completion: (
    params: {
      messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
      n_predict: number;
      temperature: number;
      stop: string[];
    },
  ) => Promise<CompletionResult>;
};

let shared: LlamaLike | null = null;
let busy = false;

export function setSharedLlama(context: LlamaLike | null) {
  shared = context;
}

export function hasSharedLlama() {
  return shared !== null;
}

export async function completeBrief(system: string, user: string): Promise<string | null> {
  if (!shared || busy) return null;
  busy = true;
  try {
    const result = await shared.completion({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      n_predict: 48,
      temperature: 0.4,
      stop: ['</s>', '<|im_end|>', '<|endoftext|>'],
    });
    const text = (result.content || result.text || '').trim();
    return text || null;
  } catch {
    return null;
  } finally {
    busy = false;
  }
}
