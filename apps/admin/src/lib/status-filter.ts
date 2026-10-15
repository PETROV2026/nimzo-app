import type { CrudFilter } from '@refinedev/core';

export type StatusFilter = 'all' | 'active' | 'inactive';

export function statusCrudFilter(status: StatusFilter): CrudFilter[] {
  if (status === 'all') return [];
  return [{ field: 'is_active', operator: 'eq', value: status === 'active' }];
}
