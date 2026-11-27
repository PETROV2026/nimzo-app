import { useEffect } from 'react';
import { Directory, File, Paths } from 'expo-file-system';
import { db } from '@/db/database';
import { deletePhoto, photosFolder } from '@/lib/save-photo';
import { parseAnswers, unusedPhotoFiles } from '@/reports/report-rules';

let openForms = 0;

export function useOpenForm() {
  useEffect(() => {
    openForms += 1;
    return () => {
      openForms -= 1;
    };
  }, []);
}

export async function cleanUnusedPhotos() {
  const folder = new Directory(Paths.document, photosFolder);
  if (openForms > 0 || !folder.exists) return;
  const rows = await db.getAllAsync<{ answers: string }>('select answers from reports');
  if (openForms > 0) return;
  const files = folder
    .list()
    .filter((item) => item instanceof File)
    .map((item) => item.uri);
  const answers = rows.map((row) => parseAnswers(row.answers));
  for (const uri of unusedPhotoFiles(files, answers)) deletePhoto(uri);
}
