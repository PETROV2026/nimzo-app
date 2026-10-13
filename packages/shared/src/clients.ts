import { z } from 'zod';

import type { Tables } from './database.types';

export type Client = Tables<'clients'>;

// Empty inputs arrive as '' from forms; store them as null.
const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === '' ? null : value))
  .nullable();

/**
 * Editable fields of a client, shared by the admin panel form and (later) the mobile app.
 * Mexican RFC: 12 characters for companies, 13 for individuals.
 */
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
