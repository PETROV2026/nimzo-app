import { PageHeader } from '@/components/page-header';

import { ClientForm } from './client-form';

export function ClientCreate() {
  return (
    <>
      <PageHeader title="Agregar cliente" />
      <ClientForm action="create" />
    </>
  );
}
