import { z } from 'zod';

const phonePattern = /^\+?[\d\s().-]+$/;

export function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, '').length;
  return phonePattern.test(value) && digits >= 7 && digits <= 15;
}

export function requiredPhone(message: string) {
  return z
    .string()
    .nullable()
    .transform((value) => value ?? '')
    .pipe(z.string().trim().min(1, message))
    .refine(
      (value) => value === '' || isValidPhone(value),
      'Escribe un teléfono válido, por ejemplo 81 1234 5678',
    );
}
