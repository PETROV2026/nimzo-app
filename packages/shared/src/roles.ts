import { z } from 'zod';

export const userRoleSchema = z.enum(['technician', 'supervisor', 'admin']);

export type UserRole = z.infer<typeof userRoleSchema>;

export const userRoleLabels: Record<UserRole, string> = {
  technician: 'Técnico',
  supervisor: 'Supervisor',
  admin: 'Administrador',
};
