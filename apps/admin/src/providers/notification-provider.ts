import type { NotificationProvider } from '@refinedev/core';
import { toast } from 'sonner';

const ERROR_DURATION_MS = 8000;

const undoToasts = new Map<string, string | number>();

function closeUndo(key: string) {
  const id = undoToasts.get(key);
  if (id === undefined) return;
  undoToasts.delete(key);
  toast.dismiss(id);
}

export const notificationProvider: NotificationProvider = {
  open: ({ key, message, description, type, undoableTimeout = 0, cancelMutation }) => {
    if (type === 'progress') {
      const undoKey = key ?? message;
      if (undoableTimeout <= 0) {
        closeUndo(undoKey);
        return;
      }
      if (undoToasts.has(undoKey)) return;
      const id = toast(message, {
        description,
        duration: Infinity,
        action: {
          label: 'Deshacer',
          onClick: () => {
            undoToasts.delete(undoKey);
            cancelMutation?.();
          },
        },
      });
      undoToasts.set(undoKey, id);
      return;
    }

    if (type === 'error') {
      toast.error(message, { id: key, description, duration: ERROR_DURATION_MS });
      return;
    }
    toast.success(message, { id: key, description });
  },
  close: (key) => {
    closeUndo(key);
    toast.dismiss(key);
  },
};
