import type { FeedbackKind } from '@nimzo/shared';
import type { CrudFilter } from '@refinedev/core';

export type KindFilter = 'all' | FeedbackKind;

export function kindCrudFilter(kind: KindFilter): CrudFilter[] {
  return kind === 'all' ? [] : [{ field: 'kind', operator: 'eq', value: kind }];
}
