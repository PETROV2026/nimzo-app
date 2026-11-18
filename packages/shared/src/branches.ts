import { z } from 'zod';

import type { Tables } from './database.types';
import { optionalText, requiredText } from './form-fields';
import { requiredState } from './mexican-states';

export type Branch = Tables<'branches'>;

export const branchFormSchema = z.object({
  name: z.string().trim().min(1, 'Ingresa el nombre de la sucursal'),
  address: requiredText('Ingresa la dirección'),
  city: requiredText('Ingresa la ciudad'),
  state: requiredState('Elige el estado'),
  contact_name: optionalText,
  contact_email: optionalText.refine(
    (value) => value === null || z.email().safeParse(value).success,
    'Ingresa un correo válido',
  ),
  contact_phone: optionalText,
  is_active: z.boolean(),
});

export type BranchFormInput = z.input<typeof branchFormSchema>;
export type BranchFormValues = z.output<typeof branchFormSchema>;

export const branchCreateSchema = branchFormSchema.extend({
  client_id: z.uuid({ error: 'Elige el cliente' }),
});

export type BranchCreateInput = z.input<typeof branchCreateSchema>;
