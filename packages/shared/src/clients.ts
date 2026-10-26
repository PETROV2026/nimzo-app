import { z } from 'zod';

import type { Tables } from './database.types';
import { optionalText } from './form-fields';

export type Client = Tables<'clients'>;

export const clientFormSchema = z.object({
  name: z.string().trim().min(1, 'Ingresa el nombre del cliente'),
  tax_id: optionalText
    .refine(
      (value) => value === null || /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/i.test(value),
      'Ingresa un RFC válido (12 o 13 caracteres)',
    )
    .transform((value) => value?.toUpperCase() ?? null),
  contact_name: optionalText,
  contact_email: optionalText.refine(
    (value) => value === null || z.email().safeParse(value).success,
    'Ingresa un correo válido',
  ),
  contact_phone: optionalText,
  notes: optionalText,
  is_active: z.boolean(),
});

export type ClientFormInput = z.input<typeof clientFormSchema>;
export type ClientFormValues = z.output<typeof clientFormSchema>;

export const clientCreateSchema = clientFormSchema.extend({
  technician_id: z.uuid({ error: 'Elige el técnico' }),
});

export type ClientCreateInput = z.input<typeof clientCreateSchema>;
export type ClientCreateValues = z.output<typeof clientCreateSchema>;
