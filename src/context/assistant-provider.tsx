import { createContext, useContext, type ReactNode } from 'react';

import { useLocalAssistant } from '@/hooks/use-local-assistant';

type AssistantApi = ReturnType<typeof useLocalAssistant>;

const AssistantContext = createContext<AssistantApi | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const value = useLocalAssistant();
  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() {
  const value = useContext(AssistantContext);
  if (!value) {
    throw new Error('useAssistant must be used within AssistantProvider');
  }
  return value;
}
