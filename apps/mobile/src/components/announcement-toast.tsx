import { useEffect, useSyncExternalStore } from 'react';
import { useToast } from '@/components/toast';

type Announcement = { id: number; title: string; description?: string };

let current: Announcement | null = null;
const listeners = new Set<() => void>();

export function announce(title: string, description?: string) {
  current = { id: Date.now(), title, description };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function AnnouncementToast() {
  const announcement = useSyncExternalStore(subscribe, () => current);
  const { toast, showToast } = useToast();

  useEffect(() => {
    if (!announcement) return;
    showToast(announcement.title, announcement.description);
    current = null;
  }, [announcement, showToast]);

  return toast;
}
