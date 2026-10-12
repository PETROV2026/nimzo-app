import { z } from 'zod';

export const userRoleSchema = z.enum(['tecnico', 'supervisor', 'administrador']);

export type UserRole = z.infer<typeof userRoleSchema>;

/** Display labels shown to users. */
export const userRoleLabels: Record<UserRole, string> = {
  tecnico: 'Técnico',
  supervisor: 'Supervisor',
  administrador: 'Administrador',
};
