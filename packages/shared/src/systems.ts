import { z } from 'zod';

import { Constants, type Tables } from './database.types';
import { optionalText } from './form-fields';

export type System = Tables<'systems'>;

export const systemTypeSchema = z.enum(Constants.public.Enums.system_type, {
  error: 'Elige el tipo de sistema',
});

export type SystemType = z.infer<typeof systemTypeSchema>;

export const systemTypeLabels: Record<SystemType, string> = {
  sprinkler: 'Rociadores automáticos',
  hydrant: 'Red de hidrantes',
  fire_pump: 'Bombas contra incendio',
  fire_extinguisher: 'Extintores',
  fire_alarm: 'Detección y alarma',
  kitchen_suppression: 'Supresión en cocinas',
  clean_agent: 'Supresión por agente limpio',
  other: 'Otro',
};

export const systemFormSchema = z.object({
  system_type: systemTypeSchema,
  name: z.string().trim().min(1, 'Ingresa un nombre para identificar el sistema'),
  location: optionalText,
  notes: optionalText,
  is_active: z.boolean(),
});

export type SystemFormInput = z.input<typeof systemFormSchema>;
export type SystemFormValues = z.output<typeof systemFormSchema>;

export const systemCreateSchema = systemFormSchema.extend({
  branch_id: z.number({ error: 'Elige la sucursal' }),
});

export type SystemCreateInput = z.input<typeof systemCreateSchema>;
