import { feedbackFilesBucket } from '@nimzo/shared';
import { File } from 'expo-file-system';
import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import {
  feedbackStore,
  markFeedbackRejected,
  pendingFeedback,
  removeFeedback,
  type QueuedFeedback,
} from '@/feedback/feedback-db';
import {
  feedbackPhotoPath,
  isAlreadyUploaded,
  uploadOutcome,
} from '@/feedback/feedback-upload-rules';
import { reportError } from '@/lib/monitoring';
import { deletePhoto } from '@/lib/save-photo';
import { supabase } from '@/lib/supabase';
import { useOnline } from '@/lib/use-online';

const requestTimeoutMs = 30_000;

let running: Promise<void> | null = null;

function withTimeout<T>(promise: PromiseLike<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Feedback upload timed out')), requestTimeoutMs);
  });
  return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timer));
}

async function uploadPhotos(item: QueuedFeedback) {
  const paths: string[] = [];
  for (const [index, uri] of item.photoUris.entries()) {
    const path = feedbackPhotoPath(item.technicianId, item.id, index);
    const file = new File(uri);
    if (!file.exists) continue;
    const { error } = await withTimeout(
      supabase.storage
        .from(feedbackFilesBucket)
        .upload(path, await file.arrayBuffer(), { contentType: 'image/jpeg' }),
    );
    if (error && !isAlreadyUploaded(error as { statusCode?: string; message?: string })) {
      throw error;
    }
    paths.push(path);
  }
  return paths;
}

async function send(item: QueuedFeedback) {
  const photoPaths = await uploadPhotos(item);
  const { error } = await withTimeout(
    supabase.from('feedback_messages').insert({
      id: item.id,
      technician_id: item.technicianId,
      kind: item.kind,
      message: item.message,
      screen: item.screen,
      app_version: item.appVersion,
      os_version: item.osVersion,
      photo_paths: photoPaths,
      written_at: item.writtenAt,
    }),
  );
  const outcome = uploadOutcome(error);
  if (outcome === 'sent') {
    removeFeedback(item.id);
    item.photoUris.forEach(deletePhoto);
  } else if (outcome === 'rejected' && error) {
    markFeedbackRejected(item.id, error.code);
    reportError(new Error(`Feedback rejected: ${error.code}`));
  } else if (error) {
    throw error;
  }
}

async function run(technicianId: string) {
  for (const item of pendingFeedback(technicianId)) {
    await send(item);
  }
}

export function syncFeedback(technicianId: string) {
  running ??= run(technicianId)
    .catch((error: unknown) => {
      if (error instanceof Error && !/timed out|network/i.test(error.message)) reportError(error);
    })
    .finally(() => {
      running = null;
    });
  return running;
}

export function useFeedbackSync(technicianId: string) {
  const online = useOnline();
  const pendingCount = useSyncExternalStore(feedbackStore.subscribe, () =>
    technicianId ? pendingFeedback(technicianId).length : 0,
  );

  useEffect(() => {
    if (!technicianId || !online || pendingCount === 0) return;
    syncFeedback(technicianId);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncFeedback(technicianId);
    });
    return () => subscription.remove();
  }, [technicianId, online, pendingCount]);
}
