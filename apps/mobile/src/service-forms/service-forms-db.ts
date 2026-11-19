import { useSyncExternalStore } from 'react';
import type { ServiceForm } from '@nimzo/shared';
import { db } from '@/db/database';
import { createTableStore } from '@/db/table-store';
import { compareCatalogForms } from '@/service-forms/catalog-order';
import { shouldReplaceCatalog } from '@/service-forms/catalog-sync-rules';

export type LocalServiceForm = Pick<
  ServiceForm,
  'code' | 'name' | 'subtitle' | 'icon_path' | 'updated_at'
>;

const catalogKey = 'catalog';

const serviceFormsStore = createTableStore(() =>
  db
    .getAllSync<LocalServiceForm>(
      'select code, name, subtitle, icon_path, updated_at from service_forms',
    )
    .sort(compareCatalogForms),
);

export function useServiceForms() {
  return useSyncExternalStore(serviceFormsStore.subscribe, () =>
    serviceFormsStore.snapshot(catalogKey),
  );
}

export function saveServiceForms(forms: readonly LocalServiceForm[]) {
  const saved = db.getAllSync<{ code: string; updated_at: string }>(
    'select code, updated_at from service_forms',
  );
  if (!shouldReplaceCatalog(saved, forms)) return false;

  db.withTransactionSync(() => {
    db.runSync('delete from service_forms');
    const insert = db.prepareSync(
      'insert into service_forms (code, name, subtitle, icon_path, updated_at) values (?, ?, ?, ?, ?)',
    );
    try {
      for (const form of forms) {
        insert.executeSync(form.code, form.name, form.subtitle, form.icon_path, form.updated_at);
      }
    } finally {
      insert.finalizeSync();
    }
  });
  serviceFormsStore.notify();
  return true;
}
