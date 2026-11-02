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

export type ScheduleResult =
  { ok: true; notificationId: string } | { ok: false; reason: 'permission' | 'failed' };

async function hasPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function remindersChannel() {
  try {
    await Notifications.setNotificationChannelAsync(channelId, {
      name: 'Recordatorios de notas',
      importance: AndroidImportance.HIGH,
    });
    return channelId;
  } catch (error) {
    console.warn('Could not create the note reminders channel; using the default one.', error);
    return undefined;
  }
}

export async function scheduleReminder(note: Note, remindAt: Date): Promise<ScheduleResult> {
  try {
    const channel = await remindersChannel();
    if (!(await hasPermission())) return { ok: false, reason: 'permission' };
    const snippet = note.body.trim() || note.checklist.find((item) => !item.done)?.text || '';
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: note.title.trim() || 'Recordatorio de tu nota',
        body: snippet || 'Toca para abrir la nota.',
        data: { noteId: note.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: remindAt,
        ...(channel ? { channelId: channel } : {}),
      },
    });
    return { ok: true, notificationId };
  } catch (error) {
    console.warn('Could not schedule the note reminder.', error);
    return { ok: false, reason: 'failed' };
  }
}

export async function cancelReminder(notificationId: string | null) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    return;
  }
}

function openNoteFrom(response: Notifications.NotificationResponse | null) {
  const noteId = response?.notification.request.content.data?.noteId;
  if (typeof noteId !== 'string') return;
  router.navigate({ pathname: '/notes', params: { noteId, openedAt: String(Date.now()) } });
}

export function useOpenNoteFromNotification() {
  useEffect(() => {
    openNoteFrom(Notifications.getLastNotificationResponse());
    Notifications.clearLastNotificationResponse();
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openNoteFrom(response);
      Notifications.clearLastNotificationResponse();
    });
    return () => subscription.remove();
  }, []);
}
