import { z } from 'zod';

import type { Tables } from './database.types';
import { optionalText } from './form-fields';

export type ServiceForm = Tables<'service_forms'>;

export const serviceFormCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^F-SER-\d{3}$/, 'Usa el formato F-SER-000, por ejemplo F-SER-112');

export const serviceFormSchema = z.object({
  code: serviceFormCodeSchema,
  name: z.string().trim().min(1, 'Ingresa el nombre del formato'),
  subtitle: optionalText,
  icon_path: z.string().nullable(),
  is_active: z.boolean(),
});

export type ServiceFormInput = z.input<typeof serviceFormSchema>;
export type ServiceFormValues = z.output<typeof serviceFormSchema>;

export const formIconBucket = 'form-icons';
export const formIconMaxBytes = 524288;
export const formIconTypes = ['image/svg+xml', 'image/png', 'image/webp'] as const;
