import { z } from 'zod';

import type { Tables } from './database.types';

export const reportStatusSchema = z.enum(['draft', 'pending', 'sent']);

export type ReportStatus = z.infer<typeof reportStatusSchema>;

export const reportStatusLabels: Record<ReportStatus, string> = {
  draft: 'Activo',
  pending: 'Pendiente',
  sent: 'Enviado',
};

export type Report = Tables<'reports'>;

export function formatFolio(folio: number): string {
  return String(folio).padStart(6, '0');
}
