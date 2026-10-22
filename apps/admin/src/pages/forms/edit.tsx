import Button from '@mui/material/Button';
import type { ServiceForm } from '@nimzo/shared';
import { useOne } from '@refinedev/core';
import { Link, useParams } from 'react-router';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { PageHeader } from '@/components/page-header';

import { ServiceFormForm } from './service-form-form';

export function ServiceFormEdit() {
  const { id = '' } = useParams();
  const { result } = useOne<ServiceForm>({ resource: 'service_forms', id });

  return (
    <>
      <Breadcrumbs items={[{ label: 'Formatos', to: '/forms' }, { label: result?.code }]} />
      <PageHeader
        title="Editar formato"
        action={
          <Button component={Link} to="/forms/create" variant="outlined" size="small">
            Agregar formato
          </Button>
        }
      />
      <ServiceFormForm key={id} action="edit" id={id} />
    </>
  );
}
