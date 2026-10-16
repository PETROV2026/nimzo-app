import Button from '@mui/material/Button';
import { Link, useParams } from 'react-router';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { PageHeader } from '@/components/page-header';

import { BranchForm } from './branch-form';
import { SystemsBox } from './systems-box';
import { useBranchCrumbs } from './use-branch-crumbs';

export function BranchEdit() {
  const { id = '' } = useParams();
  const { crumbs, clientId } = useBranchCrumbs({ branchId: id });
  const createTo = clientId ? `/branches/create?client=${clientId}` : '/branches/create';

  return (
    <>
      <Breadcrumbs items={crumbs} />
      <PageHeader
        title="Editar sucursal"
        action={
          <Button component={Link} to={createTo} variant="outlined" size="small">
            Agregar sucursal
          </Button>
        }
      />
      <BranchForm key={id} action="edit" id={id}>
        <SystemsBox branchId={Number(id)} />
      </BranchForm>
    </>
  );
}
