import { z } from 'zod';

export const reportStatusSchema = z.enum(['activo', 'pendiente', 'autorizacion', 'enviado']);

export type ReportStatus = z.infer<typeof reportStatusSchema>;

export const reportStatusLabels: Record<ReportStatus, string> = {
  activo: 'Activo',
  pendiente: 'Pendiente',
  autorizacion: 'Autorización',
  enviado: 'Enviado',
};
