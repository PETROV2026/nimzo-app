import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { isOverdue } from '@/notes/format';
import { notesWithReminders, setNotificationId, type Note } from '@/notes/notes-db';

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

async function hasPermission(ask: boolean) {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!ask) return false;
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

export function reminderContent(note: Note) {
  const snippet = note.body.trim() || note.checklist.find((item) => !item.done)?.text || '';
  return {
    title: note.title.trim() || 'Recordatorio de tu nota',
    body: snippet || 'Toca para abrir la nota.',
  };
}

export function reminderKey(note: Note) {
  const { title, body } = reminderContent(note);
  return `${title}\n${body}`;
}

export async function scheduleReminder(
  note: Note,
  remindAt: Date,
  askPermission = true,
): Promise<ScheduleResult> {
  try {
    const channel = await remindersChannel();
    if (!(await hasPermission(askPermission))) return { ok: false, reason: 'permission' };
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: { ...reminderContent(note), data: { noteId: note.id } },
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

export async function refreshReminder(note: Note) {
  if (!note.notificationId || !note.remindAt || isOverdue(note.remindAt)) return;
  const result = await scheduleReminder(note, new Date(note.remindAt), false);
  if (!result.ok) return;
  await cancelReminder(note.notificationId);
  setNotificationId(note.id, result.notificationId);
}

export async function syncReminders(technicianId: string | null) {
  try {
    const notes = notesWithReminders();
    const own = notes.filter((note) => note.technicianId === technicianId);
    const ownIds = new Set(own.map((note) => note.notificationId));
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (!ownIds.has(notification.identifier)) {
        await cancelReminder(notification.identifier);
      }
    }
    for (const note of notes) {
      if (note.technicianId !== technicianId && note.notificationId) {
        setNotificationId(note.id, null);
      }
    }
    const live = new Set(scheduled.map((notification) => notification.identifier));
    for (const note of own) {
      if (!note.remindAt || isOverdue(note.remindAt)) continue;
      if (note.notificationId && live.has(note.notificationId)) continue;
      const result = await scheduleReminder(note, new Date(note.remindAt), false);
      if (result.ok) setNotificationId(note.id, result.notificationId);
    }
  } catch (error) {
    console.warn('Could not sync the note reminders.', error);
  }
}

export function useReminderOwner(technicianId: string | null | undefined) {
  useEffect(() => {
    if (technicianId === undefined) return;
    void syncReminders(technicianId);
  }, [technicianId]);
}

export type NotificationAccess = 'granted' | 'askable' | 'blocked';

function accessFrom(permission: Notifications.NotificationPermissionsStatus): NotificationAccess {
  if (permission.granted) return 'granted';
  return permission.canAskAgain ? 'askable' : 'blocked';
}

export function useNotificationAccess() {
  const [access, setAccess] = useState<NotificationAccess | null>(null);

  useEffect(() => {
    let cancelled = false;
    function check() {
      Notifications.getPermissionsAsync()
        .then((permission) => {
          if (!cancelled) setAccess(accessFrom(permission));
        })
        .catch(() => undefined);
    }
    check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  async function enable() {
    if (access === 'askable') {
      await remindersChannel();
      const permission = await Notifications.requestPermissionsAsync();
      setAccess(accessFrom(permission));
      return;
    }
    await Linking.openSettings();
  }

  return { access, enable };
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
