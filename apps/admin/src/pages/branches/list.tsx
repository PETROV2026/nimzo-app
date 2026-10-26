import Box from '@mui/material/Box';
//import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import {
  mexicanStateLabels,
  type Branch,
  type MexicanState,
  type Profile,
  toSearchText,
} from '@nimzo/shared';
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

type BranchRow = Branch & {
  clients: { name: string } | null;
  systems?: { count: number }[];
  technician?: { full_name: string } | null;
};

function NameCell({ branch }: { branch: Branch }) {
  const { mutate: update, mutation } = useUpdate<Branch>();
  const editTo = `/branches/${branch.id}/edit`;

  function toggleActive() {
    update({
      resource: 'branches',
      id: branch.id,
      values: { is_active: !branch.is_active },
      mutationMode: 'undoable',
      undoableTimeout: 5000,
      successNotification: {
        type: 'success',
        message: branch.is_active ? 'Sucursal desactivada' : 'Sucursal activada',
        description: branch.name,
      },
    });
  }

  return (
    <Box sx={{ py: 1, minWidth: 0 }}>
      <Link component={RouterLink} to={editTo} sx={{ fontWeight: 600 }}>
        {branch.name}
      </Link>
      <RowActions
        label={`sucursal ${branch.name}`}
        editTo={editTo}
        active={branch.is_active}
        onToggleActive={toggleActive}
        pending={mutation.isPending}
      />
    </Box>
  );
}

export function BranchList() {
  const gridProps = useCatalogGridProps();
  const isWide = useMediaQuery(theme.breakpoints.up('lg'));
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [technician, setTechnician] = useState<Profile | null>(null);

  const { dataGridProps, setFilters } = useDataGrid<BranchRow>({
    resource: 'branches',
    meta: { select: '*, clients(name), systems(count), technician:profiles(full_name)' },
    sorters: { initial: [{ field: 'name', order: 'asc' }] },
    pagination: { pageSize: 20 },
  });

  const filters: CrudFilter[] = [...statusCrudFilter(status), ...technicianCrudFilter(technician)];
  if (search.trim()) {
    filters.push({ field: 'search_text', operator: 'contains', value: toSearchText(search) });
  }
  useDebouncedFilters(setFilters, filters);

  const columns = useMemo<GridColDef<BranchRow>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Sucursal',
        flex: 1.2,
        minWidth: 220,
        renderCell: ({ row }) => <NameCell branch={row} />,
      },
      {
        field: 'client_id',
        headerName: 'Cliente',
        flex: 1,
        minWidth: 200,
        sortable: false,
        renderCell: ({ row }) => (
          <Link component={RouterLink} to={`/clients/${row.client_id}/edit`}>
            {row.clients?.name ?? '—'}
          </Link>
        ),
      },
      {
        field: 'city',
        headerName: 'Ubicación',
        flex: 1,
        minWidth: 200,
        sortable: false,
        valueGetter: (_, row) => {
          const state = row.state ? mexicanStateLabels[row.state as MexicanState] : null;
          return [row.city, state].filter(Boolean).join(', ') || '—';
        },
      },
      {
        field: 'technician',
        headerName: 'Técnico',
        minWidth: 180,
        sortable: false,
        valueGetter: (_, row) => row.technician?.full_name ?? '—',
      },
      {
        field: 'systems',
        headerName: 'Sistemas',
        minWidth: 100,
        sortable: false,
        valueGetter: (_, row) => row.systems?.[0]?.count ?? 0,
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
      title="No se encontraron sucursales"
      description="Prueba con otro nombre o cambia los filtros."
    />
  ) : (
    <GridEmptyState
      title="Aún no hay sucursales"
      description="Agrega la primera con el botón de arriba, o desde la página de un cliente."
    />
  );

  return (
    <>
      <PageHeader
        title="Sucursales"
        // action={
        //   <Button component={RouterLink} to="/branches/create" variant="outlined" size="small">
        //     Agregar sucursal
        //   </Button>
        // }
      />

      <ListToolbar>
        <StatusLinks
          resource="branches"
          value={status}
          onChange={setStatus}
          labels={{ all: 'Todas', active: 'Activas', inactive: 'Inactivas' }}
        />
        <Box
          sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, width: { xs: '100%', sm: 'auto' } }}
        >
          <TechnicianFilter value={technician} onChange={setTechnician} />
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Buscar sucursales"
            label="Buscar sucursales por nombre o ciudad"
          />
        </Box>
      </ListToolbar>

      <Paper variant="outlined">
        <DataGrid
          {...dataGridProps}
          {...gridProps}
          columns={columns}
          columnVisibilityModel={{ systems: isWide }}
          slots={{ noRowsOverlay: () => emptyState, noResultsOverlay: () => emptyState }}
        />
      </Paper>
    </>
  );
}
