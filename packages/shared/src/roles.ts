import { z } from 'zod';

export const userRoleSchema = z.enum(['technician', 'admin']);

export type UserRole = z.infer<typeof userRoleSchema>;

export const userRoleLabels: Record<UserRole, string> = {
  technician: 'Técnico',
  admin: 'Administrador',
};
