import { z } from 'zod';

import type { Tables } from './database.types';
import { optionalText } from './form-fields';
import { mexicanStateSchema } from './mexican-states';

export type Branch = Tables<'branches'>;

export const branchFormSchema = z.object({
  name: z.string().trim().min(1, 'Ingresa el nombre de la sucursal'),
  address: optionalText,
  city: optionalText,
  state: mexicanStateSchema.nullable(),
  contact_name: optionalText,
  contact_phone: optionalText,
  is_active: z.boolean(),
});

export type BranchFormInput = z.input<typeof branchFormSchema>;
export type BranchFormValues = z.output<typeof branchFormSchema>;

export const branchCreateSchema = branchFormSchema.extend({
  client_id: z.number({ error: 'Elige el cliente' }),
});

export type BranchCreateInput = z.input<typeof branchCreateSchema>;
