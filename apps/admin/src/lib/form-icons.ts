import { formIconBucket, formIconMaxBytes, formIconTypes } from '@nimzo/shared';

import { supabase } from '@/lib/supabase';

const extensions: Record<(typeof formIconTypes)[number], string> = {
  'image/svg+xml': 'svg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function formIconUrl(path: string | null | undefined) {
  if (!path) return null;
  return supabase.storage.from(formIconBucket).getPublicUrl(path).data.publicUrl;
}

export function validateFormIcon(file: File) {
  if (!(formIconTypes as readonly string[]).includes(file.type)) {
    return 'Usa un archivo SVG, PNG o WebP.';
  }
  if (file.size > formIconMaxBytes) {
    return 'El icono pesa más de 512 KB. Usa un SVG o reduce la imagen.';
  }
  return null;
}

export async function uploadFormIcon(file: File) {
  const extension = extensions[file.type as keyof typeof extensions];
  const path = `icons/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(formIconBucket)
    .upload(path, file, { contentType: file.type, cacheControl: '31536000' });
  if (error) throw new Error('No se pudo subir el icono. Revisa tu conexión e intenta de nuevo.');
  return path;
}

export async function removeFormIcon(path: string) {
  await supabase.storage.from(formIconBucket).remove([path]);
}
