import { useParams } from 'react-router';

import { PageHeader } from '@/components/page-header';

import { ClientForm } from './client-form';

export function ClientEdit() {
  const { id } = useParams();

  return (
    <>
      <PageHeader title="Editar cliente" back={{ to: '/clients', label: 'Clientes' }} />
      <ClientForm action="edit" id={id} />
    </>
  );
}
