export type {
  CheckStatus,
  CheckValue,
  YesNoValue,
  TextValue,
  DateValue,
  TimeValue,
  OptionValue,
  CheckboxValue,
  PhotosValue,
} from '@nimzo/shared';

export type FieldProps<F, V> = {
  field: F;
  value?: V;
  onChange: (value: V | undefined) => void;
  error?: string;
};
