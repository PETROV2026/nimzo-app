import type { Profile } from '@nimzo/shared';
import type { Ref } from 'react';

import { RecordAutocomplete } from '@/components/record-autocomplete';
import { RecordFilter } from '@/components/record-filter';

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
  value: string | undefined;
  onChange: (id: string | undefined) => void;
};

export function TechnicianFilter({ value, onChange }: TechnicianFilterProps) {
  return (
    <RecordFilter<Profile>
      resource="profiles"
      label="Técnico"
      placeholder="Todos los técnicos"
      noOptionsText="No hay técnicos"
      value={value}
      onChange={onChange}
      getOptionLabel={(technician) => technician.full_name}
      sortField="full_name"
      filters={[{ field: 'role', operator: 'eq', value: 'technician' }]}
    />
  );
}
