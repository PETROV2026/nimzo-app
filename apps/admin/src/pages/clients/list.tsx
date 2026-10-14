import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import type { Client } from '@nimzo/shared';
import { useList, useUpdate, type CrudFilter } from '@refinedev/core';
import { useDataGrid } from '@refinedev/mui';
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router';

import { PageHeader } from '@/components/page-header';
import { theme, tokens } from '@/theme';

type StatusFilter = 'all' | 'active' | 'inactive';

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
];

function statusCrudFilter(status: StatusFilter): CrudFilter[] {
  if (status === 'all') return [];
  return [{ field: 'is_active', operator: 'eq', value: status === 'active' }];
}

function useStatusCount(status: StatusFilter) {
  const { result } = useList({
    resource: 'clients',
    filters: statusCrudFilter(status),
    pagination: { pageSize: 1 },
  });
  return result.total;
}

function StatusLinks({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
}) {
  const counts = {
    all: useStatusCount('all'),
    active: useStatusCount('active'),
    inactive: useStatusCount('inactive'),
  };

  return (
    <Box
      component="ul"
      aria-label="Filtrar por estado"
      sx={{ display: 'flex', flexWrap: 'wrap', listStyle: 'none', m: 0, p: 0 }}
    >
      {statusFilters.map((filter, index) => {
        const current = filter.value === value;
        return (
          <Box component="li" key={filter.value} sx={{ display: 'flex', alignItems: 'center' }}>
            {index > 0 && (
              <Box component="span" aria-hidden sx={{ px: 1, color: 'text.disabled' }}>
                |
              </Box>
            )}
            <Link
              component="button"
              type="button"
              onClick={() => onChange(filter.value)}
              aria-current={current ? 'true' : undefined}
              underline={current ? 'none' : 'hover'}
              sx={{
                fontSize: 13,
                fontWeight: current ? 700 : 500,
                color: current ? 'text.primary' : 'primary.main',
              }}
            >
              {filter.label}
              {counts[filter.value] !== undefined && (
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                  {' '}
                  ({counts[filter.value]})
                </Box>
              )}
            </Link>
          </Box>
        );
      })}
    </Box>
  );
}

function EmptyState({ filtering }: { filtering: boolean }) {
  return (
    <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', p: 4, textAlign: 'center' }}>
      <Box>
        <Typography sx={{ fontWeight: 600 }} gutterBottom>
          {filtering ? 'No se encontraron clientes' : 'Aún no hay clientes'}
        </Typography>
        <Typography color="text.secondary">
          {filtering
            ? 'Prueba con otro nombre o cambia el filtro de estado.'
            : 'Agrega el primero con el botón de arriba.'}
        </Typography>
      </Box>
    </Box>
  );
}

function NameCell({ client }: { client: Client }) {
  const { mutate: update, mutation } = useUpdate<Client>();

  function toggleActive() {
    update({
      resource: 'clients',
      id: client.id,
      values: { is_active: !client.is_active },
      successNotification: {
        type: 'success',
        message: client.is_active ? 'Cliente desactivado' : 'Cliente activado',
        description: client.name,
      },
    });
  }

  return (
    <Box sx={{ py: 1, minWidth: 0 }}>
      <Link component={RouterLink} to={`/clients/${client.id}/edit`} sx={{ fontWeight: 600 }}>
        {client.name}
      </Link>
      <Box
        className="row-actions"
        sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: 13, mt: 0.25 }}
      >
        <Link component={RouterLink} to={`/clients/${client.id}/edit`} sx={{ fontSize: 13 }}>
          Editar
        </Link>
        <Box component="span" aria-hidden sx={{ color: 'text.disabled' }}>
          |
        </Box>
        <Link
          component="button"
          type="button"
          onClick={toggleActive}
          disabled={mutation.isPending}
          sx={{ fontSize: 13, color: client.is_active ? 'error.main' : 'primary.main' }}
        >
          {client.is_active ? 'Desactivar' : 'Activar'}
        </Link>
      </Box>
    </Box>
  );
}

export function ClientList() {
  const isWide = useMediaQuery(theme.breakpoints.up('lg'));
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  const { dataGridProps, setFilters } = useDataGrid<Client>({
    resource: 'clients',
    sorters: { initial: [{ field: 'name', order: 'asc' }] },
    pagination: { pageSize: 20 },
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      const filters: CrudFilter[] = [...statusCrudFilter(status)];
      if (search.trim())
        filters.push({ field: 'name', operator: 'contains', value: search.trim() });
      setFilters(filters, 'replace');
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, status, setFilters]);

  const columns = useMemo<GridColDef<Client>[]>(
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
        field: 'is_active',
        headerName: 'Estado',
        minWidth: 120,
        renderCell: ({ row }) =>
          row.is_active ? (
            <Chip size="small" label="Activo" color="primary" />
          ) : (
            <Chip size="small" label="Inactivo" variant="outlined" />
          ),
      },
    ],
    [],
  );

  const filtering = search.trim().length > 0 || status !== 'all';

  return (
    <>
      <PageHeader
        title="Clientes"
        action={
          <Button component={RouterLink} to="/clients/create" variant="outlined" size="small">
            Agregar cliente
          </Button>
        }
      />

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 1.5,
        }}
      >
        <StatusLinks value={status} onChange={setStatus} />
        <TextField
          placeholder="Buscar clientes"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ width: { xs: '100%', sm: 280 } }}
          slotProps={{
            htmlInput: { 'aria-label': 'Buscar clientes por nombre' },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Paper variant="outlined">
        <DataGrid
          {...dataGridProps}
          columns={columns}
          columnVisibilityModel={{ tax_id: isWide, contact_phone: isWide }}
          autoHeight
          rowHeight={68}
          disableRowSelectionOnClick
          pageSizeOptions={[20, 50, 100]}
          getRowClassName={({ row, indexRelativeToCurrentPage }) =>
            [
              indexRelativeToCurrentPage % 2 ? 'row-alt' : '',
              row.is_active ? '' : 'row-inactive',
            ].join(' ')
          }
          slots={{
            noRowsOverlay: () => <EmptyState filtering={filtering} />,
            noResultsOverlay: () => <EmptyState filtering />,
          }}
          sx={{
            '& .row-alt': { bgcolor: tokens.rowAlt },
            '& .row-inactive .MuiDataGrid-cell': { color: 'text.secondary' },
            '& .row-actions': { visibility: 'hidden' },
            '& .MuiDataGrid-row:hover .row-actions, & .MuiDataGrid-row:focus-within .row-actions': {
              visibility: 'visible',
            },
            '@media (hover: none)': { '& .row-actions': { visibility: 'visible' } },
            '& .MuiDataGrid-overlayWrapper': { minHeight: 200 },
          }}
        />
      </Paper>
    </>
  );
}
