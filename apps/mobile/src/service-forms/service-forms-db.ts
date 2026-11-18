import { useSyncExternalStore } from 'react';
import type { ServiceForm } from '@nimzo/shared';
import { db } from '@/db/database';
import { createTableStore } from '@/db/table-store';

export type LocalServiceForm = Pick<ServiceForm, 'code' | 'name' | 'subtitle' | 'icon_path'>;

export type RemoteServiceForm = LocalServiceForm & Pick<ServiceForm, 'updated_at'>;

const catalogKey = 'catalog';
const frequencyOrder = ['Semanal', 'Mensual', 'Trimestral', 'Semestral y anual', 'Anual'];

function byNameAndFrequency(a: LocalServiceForm, b: LocalServiceForm) {
  return (
    a.name.localeCompare(b.name, 'es') ||
    frequencyOrder.indexOf(a.subtitle ?? '') - frequencyOrder.indexOf(b.subtitle ?? '')
  );
}

const serviceFormsStore = createTableStore(() =>
  db
    .getAllSync<LocalServiceForm>('select code, name, subtitle, icon_path from service_forms')
    .sort(byNameAndFrequency),
);

export function useServiceForms() {
  return useSyncExternalStore(serviceFormsStore.subscribe, () =>
    serviceFormsStore.snapshot(catalogKey),
  );
}

export function replaceServiceForms(forms: readonly RemoteServiceForm[]) {
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
