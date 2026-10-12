import { z } from 'zod';

/**
 * Report lifecycle. The values are stored as-is in SQLite and Postgres,
 * so they must stay identical across the mobile app, the database and the admin panel.
 *
 * activo → pendiente → (autorizacion) → enviado
 */
export const reportStatusSchema = z.enum(['activo', 'pendiente', 'autorizacion', 'enviado']);

export type ReportStatus = z.infer<typeof reportStatusSchema>;

/** Display labels shown to users. */
export const reportStatusLabels: Record<ReportStatus, string> = {
  activo: 'Activo',
  pendiente: 'Pendiente',
  autorizacion: 'Autorización',
  enviado: 'Enviado',
};
