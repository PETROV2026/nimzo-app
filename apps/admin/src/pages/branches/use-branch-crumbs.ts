import type { Branch, Client } from '@nimzo/shared';
import { useOne } from '@refinedev/core';

import type { Crumb } from '@/components/breadcrumbs';

export function useBranchCrumbs(clientId: string, branchId?: string): Crumb[] {
  const { result: client } = useOne<Client>({ resource: 'clients', id: clientId });
  const { result: branch } = useOne<Branch>({
    resource: 'branches',
    id: branchId ?? '',
    queryOptions: { enabled: Boolean(branchId) },
  });

  return [
    { label: 'Clientes', to: '/clients' },
    { label: client?.name, to: `/clients/${clientId}/edit` },
    { label: branchId ? branch?.name : 'Agregar sucursal' },
  ];
}
