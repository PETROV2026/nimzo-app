import { PageHeader } from '@/components/page-header';

import { ClientForm } from './client-form';

export function ClientCreate() {
  return (
    <>
      <PageHeader
        title="Agregar cliente"
        description="Después podrás registrar sus sucursales y sistemas contra incendio."
        back={{ to: '/clients', label: 'Clientes' }}
      />
      <ClientForm action="create" />
    </>
  );
}
