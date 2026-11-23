import { createContext, useContext } from 'react';
import type { ViewInstance } from 'react-native';

export type FormLayout = {
  hidden: ReadonlySet<string>;
  registerField: (id: string) => (view: ViewInstance | null) => void;
};

export const FormLayoutContext = createContext<FormLayout>({
  hidden: new Set(),
  registerField: () => () => undefined,
});

export function useFormLayout() {
  return useContext(FormLayoutContext);
}

export const requiredMessage = 'Completa este campo';
