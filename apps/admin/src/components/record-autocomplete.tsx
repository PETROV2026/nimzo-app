import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import type { BaseRecord, CrudFilter } from '@refinedev/core';
import { toSearchText } from '@nimzo/shared';
import { useAutocomplete } from '@refinedev/mui';
import { useState, type Ref } from 'react';

type RecordAutocompleteProps<T extends BaseRecord> = {
  resource: string;
  label: string;
  value: string | undefined;
  onChange: (id: string | undefined) => void;
  onBlur?: () => void;
  inputRef?: Ref<HTMLInputElement>;
  getOptionLabel: (record: T) => string;
  select?: string;
  filters?: CrudFilter[];
  sortField?: string;
  error?: string;
  helperText?: string;
  autoFocus?: boolean;
  noOptionsText: string;
};

export function RecordAutocomplete<T extends BaseRecord>({
  resource,
  label,
  value,
  onChange,
  onBlur,
  inputRef,
  getOptionLabel,
  select,
  filters = [],
  sortField = 'name',
  error,
  helperText,
  autoFocus,
  noOptionsText,
}: RecordAutocompleteProps<T>) {
  const [selected, setSelected] = useState<T | null>(null);
  const { autocompleteProps } = useAutocomplete<T>({
    resource,
    defaultValue: value,
    filters: [{ field: 'is_active', operator: 'eq', value: true }, ...filters],
    sorters: [{ field: sortField, order: 'asc' }],
    meta: select ? { select } : undefined,
    onSearch: (search) => [
      { field: 'search_text', operator: 'contains', value: toSearchText(search) },
    ],
    pagination: { pageSize: 25 },
  });

  const current =
    selected && selected.id === value
      ? selected
      : (autocompleteProps.options.find((option) => option.id === value) ?? null);

  return (
    <Autocomplete
      {...autocompleteProps}
      value={current}
      onChange={(_, option) => {
        setSelected(option);
        onChange(option ? String(option.id) : undefined);
      }}
      onBlur={onBlur}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={(option, current) => option.id === current.id}
      noOptionsText={noOptionsText}
      loadingText="Buscando…"
      renderInput={(params) => (
        <TextField
          {...params}
          inputRef={inputRef}
          label={label}
          required
          autoFocus={autoFocus}
          error={!!error}
          helperText={error ?? helperText}
        />
      )}
    />
  );
}
