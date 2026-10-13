import Button from '@mui/material/Button';
import { Link, useParams } from 'react-router';

import { PageHeader } from '@/components/page-header';

import { ClientForm } from './client-form';

export function ClientEdit() {
  const { id } = useParams();

  return (
    <>
      <PageHeader
        title="Editar cliente"
        action={
          <Button component={Link} to="/clients/create" variant="outlined" size="small">
            Agregar cliente
          </Button>
        }
      />
      <ClientForm action="edit" id={id} />
    </>
  );
}
