import { signatureBucket } from '@nimzo/shared';
import { Directory, File, Paths } from 'expo-file-system';
import { supabase } from '@/lib/supabase';

const directory = new Directory(Paths.document, 'profile-signature');
let downloading: { path: string; done: Promise<void> } | null = null;

function fileFor(path: string) {
  return new File(directory, path.replaceAll('/', '-'));
}

async function download(path: string) {
  const { data, error } = await supabase.storage.from(signatureBucket).createSignedUrl(path, 60);
  if (error) throw error;
  directory.create({ idempotent: true, intermediates: true });
  const partial = new File(directory, `${fileFor(path).name}.part`);
  if (partial.exists) partial.delete();
  try {
    await File.downloadFileAsync(data.signedUrl, partial);
  } catch (downloadError) {
    if (partial.exists) partial.delete();
    throw downloadError;
  }
  for (const entry of directory.list()) {
    if (entry.uri !== partial.uri) entry.delete();
  }
  partial.moveSync(fileFor(path));
}

export function cacheProfileSignature(path: string) {
  if (fileFor(path).exists) return Promise.resolve();
  if (downloading?.path === path) return downloading.done;
  const done = download(path).finally(() => {
    if (downloading?.done === done) downloading = null;
  });
  downloading = { path, done };
  return done;
}

export function cachedProfileSignature(path: string) {
  const file = fileFor(path);
  return file.exists ? file : null;
}

export function clearProfileSignature() {
  if (directory.exists) directory.delete();
}
