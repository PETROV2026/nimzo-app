import { reportFilesBucket, signatureBucket } from '@nimzo/shared';
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

const profileSignatureDirectory = new Directory(Paths.document, 'profile-signature');

function profileSignatureFile(path: string) {
  return new File(profileSignatureDirectory, path.replace('/', '-'));
}

export async function cacheProfileSignature(path: string) {
  const cached = profileSignatureFile(path);
  if (cached.exists) return;
  const { data, error } = await supabase.storage.from(signatureBucket).createSignedUrl(path, 60);
  if (error) throw error;
  clearProfileSignature();
  profileSignatureDirectory.create({ idempotent: true });
  await File.downloadFileAsync(data.signedUrl, cached);
}

export function clearProfileSignature() {
  if (profileSignatureDirectory.exists) profileSignatureDirectory.delete();
}

export function copyProfileSignature(path: string) {
  const cached = profileSignatureFile(path);
  if (!cached.exists) return null;
  const file = newSignatureFile();
  cached.copy(file);
  return file.uri;
}

type ReportSignatures = {
  supervisorSignature: string;
  technicianSignature: string;
};

async function uploadReportFile(path: string, uri: string) {
  const bucket = supabase.storage.from(reportFilesBucket);
  const { error } = await bucket.upload(path, await new File(uri).bytes(), {
    contentType: 'image/png',
  });
  if (!error) return;
  const { data: alreadyUploaded } = await bucket.exists(path);
  if (!alreadyUploaded) throw error;
}

export async function uploadReportSignatures(
  technicianId: string,
  reportId: string,
  { supervisorSignature, technicianSignature }: ReportSignatures,
) {
  const folder = `${technicianId}/${reportId}`;
  const paths = {
    supervisorSignaturePath: `${folder}/${new File(supervisorSignature).name}`,
    technicianSignaturePath: `${folder}/${new File(technicianSignature).name}`,
  };
  await Promise.all([
    uploadReportFile(paths.supervisorSignaturePath, supervisorSignature),
    uploadReportFile(paths.technicianSignaturePath, technicianSignature),
  ]);
  return paths;
}
