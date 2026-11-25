import type { FeedbackKind } from '@nimzo/shared';
import type { CrudFilter } from '@refinedev/core';

export const kindFilters = ['all', 'bug', 'idea'] as const satisfies readonly (
  'all' | FeedbackKind
)[];

export type KindFilter = (typeof kindFilters)[number];

export function kindCrudFilter(kind: KindFilter): CrudFilter[] {
  return kind === 'all' ? [] : [{ field: 'kind', operator: 'eq', value: kind }];
}
