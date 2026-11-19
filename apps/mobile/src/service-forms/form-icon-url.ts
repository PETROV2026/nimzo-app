import { formIconBucket } from '@nimzo/shared';
import { supabase } from '@/lib/supabase';
import type { LocalServiceForm } from '@/service-forms/service-forms-db';

export function formIconUrl({ icon_path, updated_at }: LocalServiceForm) {
  if (!icon_path) return null;
  const { data } = supabase.storage.from(formIconBucket).getPublicUrl(icon_path);
  return `${data.publicUrl}?v=${encodeURIComponent(updated_at)}`;
}
