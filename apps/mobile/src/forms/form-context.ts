import { createContext, useContext } from 'react';
import type { ViewInstance } from 'react-native';
import type { FormProgress } from '@/forms/form-values';

export type FormLayout = {
  numbers: ReadonlyMap<string, string>;
  registerField: (id: string) => (view: ViewInstance | null) => void;
};

export const FormLayoutContext = createContext<FormLayout>({
  numbers: new Map(),
  registerField: () => () => undefined,
});

export function useFormLayout() {
  return useContext(FormLayoutContext);
}

export const FormReadOnlyContext = createContext(false);

export function useFormReadOnly() {
  return useContext(FormReadOnlyContext);
}

export type FormScope = { prefix: string; hidden: ReadonlySet<string> };

export const FormScopeContext = createContext<FormScope>({ prefix: '', hidden: new Set() });

export function useFormScope() {
  return useContext(FormScopeContext);
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
