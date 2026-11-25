import type { CrudFilter } from '@refinedev/core';

export const FOLIO_MAX_DIGITS = 9;
export const MIN_DATE = '2020-01-01';

type ReportFilters = { folio: string; clientId: string | undefined; from: string; to: string };

function startOfDay(date: string, addDays = 0) {
  const day = new Date(`${date}T00:00:00`);
  day.setDate(day.getDate() + addDays);
  return day.toISOString();
}

export function reportCrudFilters({ folio, clientId, from, to }: ReportFilters): CrudFilter[] {
  const filters: CrudFilter[] = [];
  if (folio) filters.push({ field: 'folio', operator: 'eq', value: Number(folio) });
  if (clientId) filters.push({ field: 'client_id', operator: 'eq', value: clientId });
  if (from >= MIN_DATE)
    filters.push({ field: 'sent_at', operator: 'gte', value: startOfDay(from) });
  if (to >= MIN_DATE) filters.push({ field: 'sent_at', operator: 'lt', value: startOfDay(to, 1) });
  return filters;
}
