import { useSyncExternalStore } from 'react';
import type { ServiceForm } from '@nimzo/shared';
import { db } from '@/db/database';
import { createTableStore } from '@/db/table-store';
import { compareCatalogForms } from '@/service-forms/catalog-order';

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

export function replaceServiceForms(forms: readonly LocalServiceForm[]) {
  db.withTransactionSync(() => {
    db.runSync('delete from service_forms');
    for (const form of forms) {
      db.runSync(
        'insert into service_forms (code, name, subtitle, icon_path, updated_at) values (?, ?, ?, ?, ?)',
        form.code,
        form.name,
        form.subtitle,
        form.icon_path,
        form.updated_at,
      );
    }
  });
  serviceFormsStore.notify();
}
