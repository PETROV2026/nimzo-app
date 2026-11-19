import { useEffect } from 'react';
import { AppState } from 'react-native';
import { reportError } from '@/lib/monitoring';
import { supabase } from '@/lib/supabase';
import { useOnline } from '@/lib/use-online';
import { replaceServiceForms } from '@/service-forms/service-forms-db';

let running: Promise<void | null> | null = null;

function isServerError(error: unknown): error is { code: string; message: string } {
  return typeof error === 'object' && error !== null && 'code' in error && Boolean(error.code);
}

async function download() {
  const { data, error } = await supabase
    .from('service_forms')
    .select('code, name, subtitle, icon_path, updated_at')
    .eq('is_active', true);
  if (error) throw error;
  replaceServiceForms(data);
}

export function syncServiceForms() {
  running ??= download()
    .catch((error: unknown) => {
      if (error instanceof Error) {
        reportError(error);
      } else if (isServerError(error)) {
        reportError(new Error(`Service form download failed: ${error.code} ${error.message}`));
      }
      return null;
    })
    .finally(() => {
      running = null;
    });
  return running;
}

export function useServiceFormsSync(technicianId: string) {
  const online = useOnline();

  useEffect(() => {
    if (!technicianId || !online) return;
    syncServiceForms();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncServiceForms();
    });
    return () => subscription.remove();
  }, [technicianId, online]);
}
