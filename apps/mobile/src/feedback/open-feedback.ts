import { useSyncExternalStore } from 'react';

let screen: string | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function openFeedback(from: string) {
  screen = from;
  notify();
}

export function closeFeedback() {
  screen = null;
  notify();
}

export function useFeedbackScreen() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => screen,
  );
}
