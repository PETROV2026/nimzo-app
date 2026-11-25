import type { Client } from '@nimzo/shared';

import { RecordFilter } from '@/components/record-filter';
import { technicianCrudFilter } from '@/lib/technician-filter';

type ClientOption = Client & { technician: { full_name: string } | null };

type ClientFilterProps = {
  value: string | undefined;
  onChange: (id: string | undefined) => void;
  technicianId: string | undefined;
};

export function ClientFilter({ value, onChange, technicianId }: ClientFilterProps) {
  return (
    <RecordFilter<ClientOption>
      resource="clients"
      label="Cliente"
      placeholder="Todos los clientes"
      noOptionsText="No hay clientes"
      value={value}
      onChange={onChange}
      getOptionLabel={(client) => client.name}
      getOptionDetail={(client) => client.technician?.full_name}
      sortField="name"
      select="*, technician:profiles(full_name)"
      filters={technicianCrudFilter(technicianId)}
    />
  );
}
