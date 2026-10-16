import { z } from 'zod';

import type { Tables } from './database.types';
import { userRoleSchema } from './roles';

export type Profile = Tables<'profiles'>;

const roleField = z.enum(userRoleSchema.options, { error: 'Elige el rol' });

const fullNameField = z.string().trim().min(1, 'Ingresa el nombre completo');

export const passwordField = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña no puede tener más de 72 caracteres');

export const userCreateSchema = z.object({
  full_name: fullNameField,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Ingresa el correo')
    .pipe(z.email('Ingresa un correo válido')),
  role: roleField,
  password: passwordField,
});

export type UserCreateInput = z.input<typeof userCreateSchema>;
export type UserCreateValues = z.output<typeof userCreateSchema>;

export const userUpdateSchema = z.object({
  full_name: fullNameField,
  role: roleField,
});

export type UserUpdateInput = z.input<typeof userUpdateSchema>;

export const passwordResetSchema = z.object({ password: passwordField });

export type PasswordResetInput = z.input<typeof passwordResetSchema>;

export const userRoleDescriptions: Record<z.infer<typeof userRoleSchema>, string> = {
  technician: 'Llena, firma y envía los formatos desde la app móvil.',
  supervisor: 'Firma y autoriza los formatos desde la app móvil.',
  admin: 'Administra el panel web: clientes, sucursales, sistemas y usuarios.',
};
