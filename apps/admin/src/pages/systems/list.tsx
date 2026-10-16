import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { systemTypeLabels, systemTypeSchema, type System, type SystemType } from '@nimzo/shared';
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
import { statusCrudFilter, type StatusFilter } from '@/lib/status-filter';
import { useDebouncedFilters } from '@/lib/use-debounced-filters';
import { theme } from '@/theme';

import { SystemDialog } from './system-dialog';

type SystemRow = System & {
  branches: { name: string; clients: { name: string } | null } | null;
};

type DialogState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; systemId: number };

function NameCell({ system, onEdit }: { system: System; onEdit: () => void }) {
  const { mutate: update, mutation } = useUpdate<System>();

  function toggleActive() {
    update({
      resource: 'systems',
      id: system.id,
      values: { is_active: !system.is_active },
      mutationMode: 'undoable',
      undoableTimeout: 5000,
      successNotification: {
        type: 'success',
        message: system.is_active ? 'Sistema desactivado' : 'Sistema activado',
        description: system.name,
      },
    });
  }

  return (
    <Box sx={{ py: 1, minWidth: 0 }}>
      <Link component="button" type="button" onClick={onEdit} sx={{ fontWeight: 600 }}>
        {system.name}
      </Link>
      <RowActions
        label={`sistema ${system.name}`}
        onEdit={onEdit}
        active={system.is_active}
        onToggleActive={toggleActive}
        pending={mutation.isPending}
      />
    </Box>
  );
}

export function SystemList() {
  const gridProps = useCatalogGridProps();
  const isWide = useMediaQuery(theme.breakpoints.up('lg'));
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [type, setType] = useState<SystemType | ''>('');
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });

  const { dataGridProps, setFilters } = useDataGrid<SystemRow>({
    resource: 'systems',
    meta: { select: '*, branches(name, clients(name))' },
    sorters: { initial: [{ field: 'name', order: 'asc' }] },
    pagination: { pageSize: 20 },
  });

  const filters: CrudFilter[] = [...statusCrudFilter(status)];
  if (type) filters.push({ field: 'system_type', operator: 'eq', value: type });
  if (search.trim()) filters.push({ field: 'name', operator: 'contains', value: search.trim() });
  useDebouncedFilters(setFilters, filters);

  const columns = useMemo<GridColDef<SystemRow>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Sistema',
        flex: 1.2,
        minWidth: 220,
        renderCell: ({ row }) => (
          <NameCell system={row} onEdit={() => setDialog({ mode: 'edit', systemId: row.id })} />
        ),
      },
      {
        field: 'system_type',
        headerName: 'Tipo',
        flex: 1,
        minWidth: 190,
        valueFormatter: (value: SystemType) => systemTypeLabels[value],
      },
      {
        field: 'branch_id',
        headerName: 'Sucursal',
        flex: 1.2,
        minWidth: 220,
        sortable: false,
        renderCell: ({ row }) => (
          <Box sx={{ lineHeight: 1.4, py: 1 }}>
            <Link component={RouterLink} to={`/branches/${row.branch_id}/edit`}>
              {row.branches?.name ?? '—'}
            </Link>
            {row.branches?.clients && (
              <Typography variant="body2" color="text.secondary">
                {row.branches.clients.name}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        field: 'location',
        headerName: 'Ubicación',
        minWidth: 160,
        sortable: false,
        valueFormatter: (value) => value ?? '—',
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

  const filtering = search.trim().length > 0 || status !== 'all' || type !== '';
  const emptyState = filtering ? (
    <GridEmptyState
      title="No se encontraron sistemas"
      description="Prueba con otro nombre o cambia los filtros."
    />
  ) : (
    <GridEmptyState
      title="Aún no hay sistemas"
      description="Agrega el primero con el botón de arriba, o desde la página de una sucursal."
    />
  );

  return (
    <>
      <PageHeader
        title="Sistemas"
        action={
          <Button variant="outlined" size="small" onClick={() => setDialog({ mode: 'create' })}>
            Agregar sistema
          </Button>
        }
      />

      <ListToolbar>
        <StatusLinks
          resource="systems"
          value={status}
          onChange={setStatus}
          labels={{ all: 'Todos', active: 'Activos', inactive: 'Inactivos' }}
        />
        <Box
          sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, width: { xs: '100%', sm: 'auto' } }}
        >
          <TextField
            select
            label="Tipo"
            value={type}
            onChange={(event) => setType(event.target.value as SystemType | '')}
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            sx={{ width: { xs: '100%', sm: 240 } }}
          >
            <MenuItem value="">Todos los tipos</MenuItem>
            {systemTypeSchema.options.map((option) => (
              <MenuItem key={option} value={option}>
                {systemTypeLabels[option]}
              </MenuItem>
            ))}
          </TextField>
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Buscar sistemas"
            label="Buscar sistemas por nombre"
          />
        </Box>
      </ListToolbar>

      <Paper variant="outlined">
        <DataGrid
          {...dataGridProps}
          {...gridProps}
          columns={columns}
          columnVisibilityModel={{ location: isWide }}
          slots={{ noRowsOverlay: () => emptyState, noResultsOverlay: () => emptyState }}
        />
      </Paper>

      {dialog.mode !== 'closed' && (
        <SystemDialog
          systemId={dialog.mode === 'edit' ? dialog.systemId : undefined}
          onClose={() => setDialog({ mode: 'closed' })}
        />
      )}
    </>
  );
}
