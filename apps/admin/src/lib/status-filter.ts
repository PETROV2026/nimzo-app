import type { CrudFilter } from '@refinedev/core';

export const statusFilters = ['all', 'active', 'inactive'] as const;

export type StatusFilter = (typeof statusFilters)[number];

export function statusCrudFilter(status: StatusFilter): CrudFilter[] {
  if (status === 'all') return [];
  return [{ field: 'is_active', operator: 'eq', value: status === 'active' }];
}
