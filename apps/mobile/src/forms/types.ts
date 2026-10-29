export type CheckStatus = 'na' | 'x' | 'ok';
export type CheckValue = { status: CheckStatus; value?: number };
export type YesNoValue = 'yes' | 'no';
export type TextValue = string | number;
export type DateValue = string;
export type TimeValue = string;
export type OptionValue = string;
export type CheckboxValue = boolean;

export type FieldProps<F, V> = {
  field: F;
  value?: V;
  onChange: (value: V) => void;
  error?: string;
};