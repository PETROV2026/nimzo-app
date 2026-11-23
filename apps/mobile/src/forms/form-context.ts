import { createContext, useContext } from 'react';
import type { ViewInstance } from 'react-native';
import type { FormProgress } from '@/forms/form-values';

export type FormLayout = {
  hidden: ReadonlySet<string>;
  numbers: ReadonlyMap<string, string>;
  registerField: (id: string) => (view: ViewInstance | null) => void;
};

export const FormLayoutContext = createContext<FormLayout>({
  hidden: new Set(),
  numbers: new Map(),
  registerField: () => () => undefined,
});

export function useFormLayout() {
  return useContext(FormLayoutContext);
}

export const FormProgressContext = createContext<FormProgress>({
  answered: 0,
  total: 0,
  report: { answered: 0, total: 0 },
  sections: [],
});

export function useFormProgress() {
  return useContext(FormProgressContext);
}

export const requiredMessage = 'Completa este campo';
