import { randomUUID } from 'expo-crypto';
import { db } from '@/db/database';
import { createTableStore } from '@/db/table-store';

export type NoteColor = 'none' | 'teal' | 'yellow' | 'orange' | 'gray';

export type ChecklistItem = { id: string; text: string; done: boolean };

export type Note = {
  id: string;
  technicianId: string;
  title: string;
  body: string;
  checklist: ChecklistItem[];
  clientId: string | null;
  clientName: string | null;
  pinned: boolean;
  color: NoteColor;
  remindAt: string | null;
  notificationId: string | null;
  createdAt: string;
  updatedAt: string;
};

type NoteRow = {
  id: string;
  technician_id: string;
  title: string;
  body: string;
  checklist: string;
  client_id: string | null;
  client_name: string | null;
  pinned: number;
  color: NoteColor;
  remind_at: string | null;
  notification_id: string | null;
  created_at: string;
  updated_at: string;
};

function isChecklistItem(value: unknown): value is ChecklistItem {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' && typeof item.text === 'string' && typeof item.done === 'boolean'
  );
}

function parseChecklist(value: string): ChecklistItem[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(isChecklistItem) : [];
  } catch {
    return [];
  }
}

function fromRow(row: NoteRow): Note {
  return {
    id: row.id,
    technicianId: row.technician_id,
    title: row.title,
    body: row.body,
    checklist: parseChecklist(row.checklist),
    clientId: row.client_id,
    clientName: row.client_name,
    pinned: row.pinned === 1,
    color: row.color,
    remindAt: row.remind_at,
    notificationId: row.notification_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const notesStore = createTableStore((technicianId) =>
  db
    .getAllSync<NoteRow>(
      'select * from notes where technician_id = ? order by pinned desc, updated_at desc',
      technicianId,
    )
    .map(fromRow),
);

export function getNote(id: string, technicianId: string) {
  const row = db.getFirstSync<NoteRow>(
    'select * from notes where id = ? and technician_id = ?',
    id,
    technicianId,
  );
  return row ? fromRow(row) : null;
}

export function notesWithReminders() {
  return db.getAllSync<NoteRow>('select * from notes where remind_at is not null').map(fromRow);
}

export function setNotificationId(id: string, notificationId: string | null) {
  db.runSync('update notes set notification_id = ? where id = ?', notificationId, id);
  notesStore.notify();
}

export function createNote(technicianId: string): Note {
  const now = new Date().toISOString();
  const note: Note = {
    id: randomUUID(),
    technicianId,
    title: '',
    body: '',
    checklist: [],
    clientId: null,
    clientName: null,
    pinned: false,
    color: 'none',
    remindAt: null,
    notificationId: null,
    createdAt: now,
    updatedAt: now,
  };
  db.runSync(
    'insert into notes (id, technician_id, created_at, updated_at) values (?, ?, ?, ?)',
    note.id,
    technicianId,
    now,
    now,
  );
  notesStore.notify();
  return note;
}

export function saveNote(note: Note) {
  const updatedAt = new Date().toISOString();
  db.runSync(
    `update notes set title = ?, body = ?, checklist = ?, client_id = ?, client_name = ?,
       pinned = ?, color = ?, remind_at = ?, notification_id = ?, updated_at = ?
     where id = ?`,
    note.title,
    note.body,
    JSON.stringify(note.checklist),
    note.clientId,
    note.clientName,
    note.pinned ? 1 : 0,
    note.color,
    note.remindAt,
    note.notificationId,
    updatedAt,
    note.id,
  );
  notesStore.notify();
}

export function deleteNote(id: string) {
  db.runSync('delete from notes where id = ?', id);
  notesStore.notify();
}

export function isEmptyNote(note: Note) {
  return (
    note.title.trim() === '' &&
    note.body.trim() === '' &&
    note.checklist.every((item) => item.text.trim() === '') &&
    !note.clientId &&
    !note.remindAt
  );
}

export function newChecklistItem(): ChecklistItem {
  return { id: randomUUID(), text: '', done: false };
}
