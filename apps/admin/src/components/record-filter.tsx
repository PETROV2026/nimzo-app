import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { toSearchText } from '@nimzo/shared';
import type { BaseRecord, CrudFilter } from '@refinedev/core';
import { useAutocomplete } from '@refinedev/mui';
import { useState } from 'react';

type RecordFilterProps<T extends BaseRecord> = {
  resource: string;
  label: string;
  placeholder: string;
  noOptionsText: string;
  value: string | undefined;
  onChange: (id: string | undefined) => void;
  getOptionLabel: (record: T) => string;
  getOptionDetail?: (record: T) => string | undefined;
  sortField: string;
  select?: string;
  filters?: CrudFilter[];
};

export function RecordFilter<T extends BaseRecord>({
  resource,
  label,
  placeholder,
  noOptionsText,
  value,
  onChange,
  getOptionLabel,
  getOptionDetail,
  sortField,
  select,
  filters = [],
}: RecordFilterProps<T>) {
  const [selected, setSelected] = useState<T | null>(null);
  const { autocompleteProps } = useAutocomplete<T>({
    resource,
    defaultValue: value,
    filters,
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
      onChange={(_, record) => {
        setSelected(record);
        onChange(record ? String(record.id) : undefined);
      }}
      getOptionLabel={getOptionLabel}
      getOptionKey={(option) => String(option.id)}
      isOptionEqualToValue={(option, chosen) => option.id === chosen.id}
      noOptionsText={noOptionsText}
      loadingText="Buscando…"
      sx={{ width: { xs: '100%', sm: 240 } }}
      renderOption={({ key, ...props }, option) => {
        const detail = getOptionDetail?.(option);
        return (
          <li key={key} {...props}>
            <Box sx={{ minWidth: 0 }}>
              <Typography>{getOptionLabel(option)}</Typography>
              {detail && (
                <Typography variant="body2" color="text.secondary">
                  {detail}
                </Typography>
              )}
            </Box>
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      )}
    />
  );
}
