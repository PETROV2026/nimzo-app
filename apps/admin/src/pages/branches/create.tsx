import { useSearchParams } from 'react-router';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { PageHeader } from '@/components/page-header';

import { BranchForm } from './branch-form';
import { useBranchCrumbs } from './use-branch-crumbs';

export function BranchCreate() {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('client') ?? undefined;
  const { crumbs } = useBranchCrumbs({ clientId });

  return (
    <>
      <Breadcrumbs items={crumbs} />
      <PageHeader title="Agregar sucursal" />
      <BranchForm key={clientId ?? 'none'} action="create" clientId={clientId} />
    </>
  );
}
