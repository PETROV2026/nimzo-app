import type { FeedbackKind } from '@nimzo/shared';
import { randomUUID } from 'expo-crypto';
import { db } from '@/db/database';
import { createTableStore } from '@/db/table-store';

export type QueuedFeedback = {
  id: string;
  technicianId: string;
  kind: FeedbackKind;
  message: string;
  screen: string;
  appVersion: string;
  osVersion: string;
  photoUris: string[];
  writtenAt: string;
  syncError: string | null;
};

type FeedbackRow = {
  id: string;
  technician_id: string;
  kind: FeedbackKind;
  message: string;
  screen: string;
  app_version: string;
  os_version: string;
  photo_uris: string;
  written_at: string;
  sync_error: string | null;
};

function parseUris(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((uri) => typeof uri === 'string') : [];
  } catch {
    return [];
  }
}

function fromRow(row: FeedbackRow): QueuedFeedback {
  return {
    id: row.id,
    technicianId: row.technician_id,
    kind: row.kind,
    message: row.message,
    screen: row.screen,
    appVersion: row.app_version,
    osVersion: row.os_version,
    photoUris: parseUris(row.photo_uris),
    writtenAt: row.written_at,
    syncError: row.sync_error,
  };
}

export const feedbackStore = createTableStore((technicianId) =>
  db
    .getAllSync<FeedbackRow>(
      'select * from feedback_outbox where technician_id = ? order by written_at',
      technicianId,
    )
    .map(fromRow),
);

type NewFeedback = Omit<QueuedFeedback, 'id' | 'technicianId' | 'writtenAt' | 'syncError'>;

export function queueFeedback(technicianId: string, feedback: NewFeedback) {
  db.runSync(
    `insert into feedback_outbox
       (id, technician_id, kind, message, screen, app_version, os_version, photo_uris, written_at)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    randomUUID(),
    technicianId,
    feedback.kind,
    feedback.message,
    feedback.screen,
    feedback.appVersion,
    feedback.osVersion,
    JSON.stringify(feedback.photoUris),
    new Date().toISOString(),
  );
  feedbackStore.notify();
}

export function pendingFeedback(technicianId: string) {
  return feedbackStore.snapshot(technicianId).filter((item) => item.syncError === null);
}

export function removeFeedback(id: string) {
  db.runSync('delete from feedback_outbox where id = ?', id);
  feedbackStore.notify();
}

export function markFeedbackRejected(id: string, reason: string) {
  db.runSync('update feedback_outbox set sync_error = ? where id = ?', reason, id);
  feedbackStore.notify();
}
