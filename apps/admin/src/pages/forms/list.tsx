import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { formTitle, toSearchText, type ServiceForm } from '@nimzo/shared';
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

import { FormIcon } from './form-icon';

function NameCell({ form }: { form: ServiceForm }) {
  const { mutate: update, mutation } = useUpdate<ServiceForm>();
  const editTo = `/forms/${form.id}/edit`;

  function toggleActive() {
    update({
      resource: 'service_forms',
      id: form.id,
      values: { is_active: !form.is_active },
      mutationMode: 'undoable',
      undoableTimeout: 5000,
      successNotification: {
        type: 'success',
        message: form.is_active ? 'Formato desactivado' : 'Formato activado',
        description: formTitle(form),
      },
    });
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, minWidth: 0 }}>
      <FormIcon path={form.icon_path} size={40} />
      <Box sx={{ minWidth: 0 }}>
        <Link component={RouterLink} to={editTo} sx={{ fontWeight: 600 }}>
          {form.name}
        </Link>
        {form.subtitle && (
          <Typography component="span" color="text.secondary" sx={{ ml: 0.75 }}>
            {form.subtitle}
          </Typography>
        )}
        <RowActions
          label={`formato ${formTitle(form)}`}
          editTo={editTo}
          active={form.is_active}
          onToggleActive={toggleActive}
          pending={mutation.isPending}
        />
      </Box>
    </Box>
  );
}

export function ServiceFormList() {
  const gridProps = useCatalogGridProps();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  const { dataGridProps, setFilters } = useDataGrid<ServiceForm>({
    resource: 'service_forms',
    sorters: {
      initial: [
        { field: 'name', order: 'asc' },
        { field: 'subtitle', order: 'asc' },
      ],
    },
    pagination: { pageSize: 50 },
  });

  const filters: CrudFilter[] = [...statusCrudFilter(status)];
  if (search.trim()) {
    filters.push({ field: 'search_text', operator: 'contains', value: toSearchText(search) });
  }
  useDebouncedFilters(setFilters, filters);

  const columns = useMemo<GridColDef<ServiceForm>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Formato',
        flex: 1,
        minWidth: 280,
        renderCell: ({ row }) => <NameCell form={row} />,
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

  const filtering = search.trim().length > 0 || status !== 'all';
  const emptyState = filtering ? (
    <GridEmptyState
      title="No se encontraron formatos"
      description="Busca por nombre o subtítulo, o cambia el filtro de estado."
    />
  ) : (
    <GridEmptyState
      title="Aún no hay formatos"
      description="Agrega el primero con el botón de arriba."
    />
  );

  return (
    <>
      <PageHeader
        title="Formatos"
        description="Los formatos de servicio que llenan los técnicos en la app."
        action={
          <Button component={RouterLink} to="/forms/create" variant="outlined" size="small">
            Agregar formato
          </Button>
        }
      />

      <ListToolbar>
        <StatusLinks
          resource="service_forms"
          value={status}
          onChange={setStatus}
          labels={{ all: 'Todos', active: 'Activos', inactive: 'Inactivos' }}
        />
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Buscar formatos"
          label="Buscar formatos por nombre o subtítulo"
        />
      </ListToolbar>

      <Paper variant="outlined">
        <DataGrid
          {...dataGridProps}
          {...gridProps}
          pageSizeOptions={[50, 100]}
          columns={columns}
          slots={{ noRowsOverlay: () => emptyState, noResultsOverlay: () => emptyState }}
        />
      </Paper>
    </>
  );
}
