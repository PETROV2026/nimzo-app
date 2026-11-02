import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { useEffect } from 'react';
import type { Note } from '@/notes/notes-db';

const channelId = 'note-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureReady() {
  await Notifications.setNotificationChannelAsync(channelId, {
    name: 'Recordatorios de notas',
    importance: AndroidImportance.HIGH,
  });
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleReminder(note: Note, remindAt: Date) {
  if (!(await ensureReady())) return null;
  const snippet = note.body.trim() || note.checklist.find((item) => !item.done)?.text || '';
  return Notifications.scheduleNotificationAsync({
    content: {
      title: note.title.trim() || 'Recordatorio de tu nota',
      body: snippet || 'Toca para abrir la nota.',
      data: { noteId: note.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: remindAt,
      channelId,
    },
  });
}

export async function cancelReminder(notificationId: string | null) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    return;
  }
}

export function useOpenNoteFromNotification() {
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    const noteId = response?.notification.request.content.data?.noteId;
    if (typeof noteId === 'string') router.navigate({ pathname: '/notes', params: { noteId } });
  }, [response]);
}
