import { z } from 'zod';

import { Constants, type Tables } from './database.types';

export type ServicePackage = Tables<'service_packages'>;
export type ServicePackageForm = Tables<'service_package_forms'>;

export const serviceFrequencySchema = z.enum(Constants.public.Enums.service_frequency, {
  error: 'Elige la frecuencia',
});

export type ServiceFrequency = z.infer<typeof serviceFrequencySchema>;

export const serviceFrequencyLabels: Record<ServiceFrequency, string> = {
  weekly: 'Semanal',
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual',
};

export const serviceFrequencyKeywords: Record<ServiceFrequency, string> = {
  weekly: 'semanal',
  monthly: 'mensual',
  quarterly: 'trimestral',
  semiannual: 'semestral',
  annual: 'anual',
};
