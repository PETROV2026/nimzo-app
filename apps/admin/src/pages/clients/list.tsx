import Box from '@mui/material/Box';
//import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { toSearchText, type Client, type Profile } from '@nimzo/shared';
import { useUpdate, type CrudFilter } from '@refinedev/core';
import { useDataGrid } from '@refinedev/mui';
import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router';

import { useCatalogGridProps } from '@/components/catalog-grid';
import { GridEmptyState } from '@/components/grid-empty-state';
import { ListToolbar } from '@/components/list-toolbar';
import { PageHeader } from '@/components/page-header';
import { RowActions } from '@/components/row-actions';
import { SearchField } from '@/components/search-field';
import { StatusChip } from '@/components/status-chip';
import { StatusLinks } from '@/components/status-links';
import { TechnicianFilter } from '@/components/technician-field';
import { statusCrudFilter, type StatusFilter } from '@/lib/status-filter';
import { technicianCrudFilter } from '@/lib/technician-filter';
import { useDebouncedFilters } from '@/lib/use-debounced-filters';
import { theme } from '@/theme';

type ClientRow = Client & {
  branches?: { count: number }[];
  technician?: { full_name: string } | null;
};

function NameCell({ client }: { client: Client }) {
  const { mutate: update, mutation } = useUpdate<Client>();
  const editTo = `/clients/${client.id}/edit`;

  function toggleActive() {
    update({
      resource: 'clients',
      id: client.id,
      values: { is_active: !client.is_active },
      mutationMode: 'undoable',
      undoableTimeout: 5000,
      successNotification: {
        type: 'success',
        message: client.is_active ? 'Cliente desactivado' : 'Cliente activado',
        description: client.name,
      },
    });
  }

  return (
    <Box sx={{ py: 1, minWidth: 0 }}>
      <Link component={RouterLink} to={editTo} sx={{ fontWeight: 600 }}>
        {client.name}
      </Link>
      <RowActions
        label={`cliente ${client.name}`}
        editTo={editTo}
        active={client.is_active}
        onToggleActive={toggleActive}
        pending={mutation.isPending}
      />
    </Box>
  );
}

export function ClientList() {
  const gridProps = useCatalogGridProps();
  const isWide = useMediaQuery(theme.breakpoints.up('lg'));
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [technician, setTechnician] = useState<Profile | null>(null);

  const { dataGridProps, setFilters } = useDataGrid<ClientRow>({
    resource: 'clients',
    meta: { select: '*, branches(count), technician:profiles(full_name)' },
    sorters: { initial: [{ field: 'name', order: 'asc' }] },
    pagination: { pageSize: 20 },
  });

  const filters: CrudFilter[] = [...statusCrudFilter(status), ...technicianCrudFilter(technician)];
  if (search.trim()) {
    filters.push({ field: 'search_text', operator: 'contains', value: toSearchText(search) });
  }
  useDebouncedFilters(setFilters, filters);

  const columns = useMemo<GridColDef<ClientRow>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Cliente',
        flex: 1.4,
        minWidth: 240,
        renderCell: ({ row }) => <NameCell client={row} />,
      },
      {
        field: 'tax_id',
        headerName: 'RFC',
        minWidth: 150,
        valueFormatter: (value) => value ?? '—',
      },
      {
        field: 'technician',
        headerName: 'Técnico',
        minWidth: 180,
        sortable: false,
        valueGetter: (_, row) => row.technician?.full_name ?? '—',
      },
      {
        field: 'contact_name',
        headerName: 'Contacto',
        flex: 1,
        minWidth: 200,
        sortable: false,
        renderCell: ({ row }) =>
          row.contact_name || row.contact_email ? (
            <Box sx={{ lineHeight: 1.4, py: 1 }}>
              <Typography>{row.contact_name ?? '—'}</Typography>
              {row.contact_email && (
                <Typography variant="body2" color="text.secondary">
                  {row.contact_email}
                </Typography>
              )}
            </Box>
          ) : (
            '—'
          ),
      },
      {
        field: 'contact_phone',
        headerName: 'Teléfono',
        minWidth: 140,
        sortable: false,
        valueFormatter: (value) => value ?? '—',
      },
      {
        field: 'branches',
        headerName: 'Sucursales',
        minWidth: 110,
        sortable: false,
        valueGetter: (_, row) => row.branches?.[0]?.count ?? 0,
      },
      {
        field: 'is_active',
        headerName: 'Estado',
        minWidth: 120,
        renderCell: ({ row }) => <StatusChip active={row.is_active} />,
      },
    ],
    [],
  );

  const filtering = search.trim().length > 0 || status !== 'all' || technician !== null;
  const emptyState = filtering ? (
    <GridEmptyState
      title="No se encontraron clientes"
      description="Prueba con otro nombre o cambia los filtros."
    />
  ) : (
    <GridEmptyState
      title="Aún no hay clientes"
      description="Agrega el primero con el botón de arriba."
    />
  );

  return (
    <>
      <PageHeader
        title="Clientes"
        // action={
        //   <Button component={RouterLink} to="/clients/create" variant="outlined" size="small">
        //     Agregar cliente
        //   </Button>
        // }
      />

      <ListToolbar>
        <StatusLinks
          resource="clients"
          value={status}
          onChange={setStatus}
          labels={{ all: 'Todos', active: 'Activos', inactive: 'Inactivos' }}
        />
        <Box
          sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, width: { xs: '100%', sm: 'auto' } }}
        >
          <TechnicianFilter value={technician} onChange={setTechnician} />
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Buscar clientes"
            label="Buscar clientes por nombre o RFC"
          />
        </Box>
      </ListToolbar>

      <Paper variant="outlined">
        <DataGrid
          {...dataGridProps}
          {...gridProps}
          columns={columns}
          columnVisibilityModel={{ tax_id: isWide, contact_phone: isWide }}
          slots={{ noRowsOverlay: () => emptyState, noResultsOverlay: () => emptyState }}
        />
      </Paper>
    </>
  );
}
