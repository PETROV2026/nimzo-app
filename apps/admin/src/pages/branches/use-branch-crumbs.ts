import type { Branch, Client } from '@nimzo/shared';
import { useOne } from '@refinedev/core';

import type { Crumb } from '@/components/breadcrumbs';

export function useBranchCrumbs({ branchId, clientId }: { branchId?: string; clientId?: number }): {
  crumbs: Crumb[];
  clientId?: number;
} {
  const { result: branch } = useOne<Branch>({
    resource: 'branches',
    id: branchId ?? '',
    queryOptions: { enabled: Boolean(branchId) },
  });
  const resolvedClientId = branch?.client_id ?? clientId;
  const { result: client } = useOne<Client>({
    resource: 'clients',
    id: resolvedClientId ?? '',
    queryOptions: { enabled: resolvedClientId !== undefined },
  });

  if (!branchId && resolvedClientId === undefined) {
    return {
      crumbs: [{ label: 'Sucursales', to: '/branches' }, { label: 'Agregar sucursal' }],
    };
  }

  return {
    clientId: resolvedClientId,
    crumbs: [
      { label: 'Clientes', to: '/clients' },
      {
        label: client?.name,
        to: resolvedClientId ? `/clients/${resolvedClientId}/edit` : undefined,
      },
      { label: branchId ? branch?.name : 'Agregar sucursal' },
    ],
  };
}
