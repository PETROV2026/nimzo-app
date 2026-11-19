import { useEffect } from 'react';
import { AppState } from 'react-native';
import { reportError } from '@/lib/monitoring';
import { supabase } from '@/lib/supabase';
import { useOnline } from '@/lib/use-online';
import { isDownloadDue, isServerError } from '@/service-forms/catalog-sync-rules';
import { saveServiceForms } from '@/service-forms/service-forms-db';

const requestTimeoutMs = 15_000;

let running: Promise<void | null> | null = null;
let lastDownloadAt: number | null = null;

async function download() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const { data, error } = await supabase
      .from('service_forms')
      .select('code, name, subtitle, icon_path, updated_at')
      .eq('is_active', true)
      .abortSignal(controller.signal);
    if (error) throw error;
    saveServiceForms(data);
    lastDownloadAt = Date.now();
  } finally {
    clearTimeout(timer);
  }
}

export function syncServiceForms({ force = false }: { force?: boolean } = {}) {
  if (!running && !isDownloadDue(lastDownloadAt, Date.now(), { force })) {
    return Promise.resolve(null);
  }
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
    syncServiceForms({ force: true });
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncServiceForms();
    });
    return () => subscription.remove();
  }, [technicianId, online]);
}
