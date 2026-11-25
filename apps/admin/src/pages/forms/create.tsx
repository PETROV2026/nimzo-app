import { Breadcrumbs } from '@/components/breadcrumbs';
import { PageHeader } from '@/components/page-header';
import { listPath } from '@/lib/list-path';

import { ServiceFormForm } from './service-form-form';

export function ServiceFormCreate() {
  return (
    <>
      <Breadcrumbs
        items={[{ label: 'Formatos', to: listPath('/forms') }, { label: 'Agregar formato' }]}
      />
      <PageHeader title="Agregar formato" />
      <ServiceFormForm action="create" />
    </>
  );
}
