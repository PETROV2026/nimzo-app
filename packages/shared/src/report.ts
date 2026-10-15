import { z } from 'zod';

export const reportStatusSchema = z.enum(['draft', 'pending', 'awaiting_approval', 'sent']);

export type ReportStatus = z.infer<typeof reportStatusSchema>;

export const reportStatusLabels: Record<ReportStatus, string> = {
  draft: 'Activo',
  pending: 'Pendiente',
  awaiting_approval: 'Autorización',
  sent: 'Enviado',
};
