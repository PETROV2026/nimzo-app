import type { CrudFilter } from '@refinedev/core';

export function technicianCrudFilter(technicianId: string | undefined): CrudFilter[] {
  return technicianId ? [{ field: 'technician_id', operator: 'eq', value: technicianId }] : [];
}
