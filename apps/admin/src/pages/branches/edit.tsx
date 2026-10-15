import Button from '@mui/material/Button';
import { Link, useParams } from 'react-router';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { PageHeader } from '@/components/page-header';

import { BranchForm } from './branch-form';
import { SystemsBox } from './systems-box';
import { useBranchCrumbs } from './use-branch-crumbs';

export function BranchEdit() {
  const { clientId = '', id = '' } = useParams();
  const crumbs = useBranchCrumbs(clientId, id);

  return (
    <>
      <Breadcrumbs items={crumbs} />
      <PageHeader
        title="Editar sucursal"
        action={
          <Button
            component={Link}
            to={`/clients/${clientId}/branches/create`}
            variant="outlined"
            size="small"
          >
            Agregar sucursal
          </Button>
        }
      />
      <BranchForm action="edit" clientId={clientId} id={id}>
        <SystemsBox branchId={Number(id)} />
      </BranchForm>
    </>
  );
}
