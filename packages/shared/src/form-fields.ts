import { z } from 'zod';

export const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === '' ? null : value))
  .nullable();

export function requiredText(message: string) {
  return z
    .string()
    .nullable()
    .transform((value) => value ?? '')
    .pipe(z.string().trim().min(1, message));
}

export function requiredEmail(message: string) {
  return requiredText(message).pipe(z.email('Ingresa un correo válido'));
}
