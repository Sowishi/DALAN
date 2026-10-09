import { useSyncExternalStore } from 'react';

let active = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setActivityOverlay(next: boolean) {
  if (active === next) return;
  active = next;
  listeners.forEach((listener) => listener());
}

export function useActivityOverlay() {
  return useSyncExternalStore(subscribe, () => active, () => false);
}
