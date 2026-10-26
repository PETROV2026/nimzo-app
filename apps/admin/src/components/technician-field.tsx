import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { toSearchText, type Profile } from '@nimzo/shared';
import { useAutocomplete } from '@refinedev/mui';
import type { Ref } from 'react';

import { RecordAutocomplete } from '@/components/record-autocomplete';

type TechnicianFieldProps = {
  value: string | undefined;
  onChange: (id: string | undefined) => void;
  onBlur?: () => void;
  inputRef?: Ref<HTMLInputElement>;
  error?: string;
};

export function TechnicianField(props: TechnicianFieldProps) {
  return (
    <RecordAutocomplete<Profile>
      {...props}
      resource="profiles"
      label="Técnico"
      sortField="full_name"
      filters={[{ field: 'role', operator: 'eq', value: 'technician' }]}
      getOptionLabel={(profile) =>
        profile.email ? `${profile.full_name} · ${profile.email}` : profile.full_name
      }
      helperText="El cliente, sus sucursales y sus reportes serán de este técnico."
      noOptionsText="No hay técnicos activos"
    />
  );
}

type TechnicianFilterProps = {
  value: Profile | null;
  onChange: (technician: Profile | null) => void;
};

export function TechnicianFilter({ value, onChange }: TechnicianFilterProps) {
  const { autocompleteProps } = useAutocomplete<Profile>({
    resource: 'profiles',
    filters: [{ field: 'role', operator: 'eq', value: 'technician' }],
    sorters: [{ field: 'full_name', order: 'asc' }],
    onSearch: (search) => [
      { field: 'search_text', operator: 'contains', value: toSearchText(search) },
    ],
    pagination: { pageSize: 25 },
  });

  return (
    <Autocomplete
      {...autocompleteProps}
      value={value}
      onChange={(_, technician) => onChange(technician)}
      getOptionLabel={(technician) => technician.full_name}
      isOptionEqualToValue={(option, current) => option.id === current.id}
      noOptionsText="No hay técnicos"
      loadingText="Buscando…"
      sx={{ width: { xs: '100%', sm: 240 } }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Técnico"
          placeholder="Todos los técnicos"
          slotProps={{ inputLabel: { shrink: true } }}
        />
      )}
    />
  );
}
