import { z } from 'zod';

import type { Tables } from './database.types';
import { optionalText } from './form-fields';

export type ServiceForm = Tables<'service_forms'>;

export const serviceFormCodeSchema = z
  .string()
  .trim()
  .regex(
    /^[a-z][a-z0-9_]*$/,
    'Usa minúsculas sin acentos, números y guiones bajos, por ejemplo smoke_detectors_annual',
  );

export const serviceFormSchema = z.object({
  code: serviceFormCodeSchema,
  name: z.string().trim().min(1, 'Ingresa el nombre del formato'),
  subtitle: optionalText,
  icon_path: z.string().nullable(),
  is_active: z.boolean(),
});

export type ServiceFormInput = z.input<typeof serviceFormSchema>;
export type ServiceFormValues = z.output<typeof serviceFormSchema>;

export function formTitle(form: Pick<ServiceForm, 'name' | 'subtitle'>): string {
  return form.subtitle ? `${form.name} · ${form.subtitle}` : form.name;
}

export const formIconBucket = 'form-icons';
export const formIconMaxBytes = 524288;
export const formIconTypes = ['image/svg+xml', 'image/png', 'image/webp'] as const;
