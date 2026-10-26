import type { Profile } from '@nimzo/shared';
import type { CrudFilter } from '@refinedev/core';

export function technicianCrudFilter(technician: Profile | null): CrudFilter[] {
  return technician ? [{ field: 'technician_id', operator: 'eq', value: technician.id }] : [];
}
