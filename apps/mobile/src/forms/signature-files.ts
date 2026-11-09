import { signatureBucket } from '@nimzo/shared';
import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { supabase } from '@/lib/supabase';

function newSignatureFile() {
  const directory = new Directory(Paths.document, 'signatures');
  if (!directory.exists) directory.create();
  return new File(directory, `${randomUUID()}.png`);
}

export function saveSignaturePng(png: Uint8Array) {
  const file = newSignatureFile();
  file.write(png);
  return file.uri;
}

export function deleteSignatureFile(uri: string) {
  const file = new File(uri);
  if (file.exists) file.delete();
}

export async function copyProfileSignature(path: string) {
  const { data, error } = await supabase.storage.from(signatureBucket).createSignedUrl(path, 60);
  if (error) throw error;
  const file = await File.downloadFileAsync(data.signedUrl, newSignatureFile());
  return file.uri;
}
