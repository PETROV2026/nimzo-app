import { z } from 'zod';

export const reportStatusSchema = z.enum(['draft', 'pending', 'sent']);

export type ReportStatus = z.infer<typeof reportStatusSchema>;

export const reportStatusLabels: Record<ReportStatus, string> = {
  draft: 'Activo',
  pending: 'Pendiente',
  sent: 'Enviado',
};
