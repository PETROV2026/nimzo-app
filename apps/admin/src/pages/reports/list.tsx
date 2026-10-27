import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { formatFolio, type Profile, type Report } from '@nimzo/shared';
import { useDataGrid } from '@refinedev/mui';
import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router';

import { useCatalogGridProps } from '@/components/catalog-grid';
import { GridEmptyState } from '@/components/grid-empty-state';
import { ListToolbar } from '@/components/list-toolbar';
import { PageHeader } from '@/components/page-header';
import { TechnicianFilter } from '@/components/technician-field';
import { technicianCrudFilter } from '@/lib/technician-filter';
import { useDebouncedFilters } from '@/lib/use-debounced-filters';

import { formatSentAt } from './format';

type ReportRow = Report & {
  technician: { full_name: string; email: string | null } | null;
  client: { name: string } | null;
  branch: { name: string } | null;
  form: { name: string; subtitle: string | null } | null;
};

export function ReportList() {
  const gridProps = useCatalogGridProps();
  const [technician, setTechnician] = useState<Profile | null>(null);

  const { dataGridProps, setFilters } = useDataGrid<ReportRow>({
    resource: 'reports',
    meta: {
      select:
        'id, folio, sent_at, client_id, branch_id, technician:profiles(full_name, email), client:clients(name), branch:branches(name), form:service_forms(name, subtitle)',
    },
    sorters: { initial: [{ field: 'sent_at', order: 'desc' }] },
    pagination: { pageSize: 20 },
  });

  useDebouncedFilters(setFilters, technicianCrudFilter(technician));

  const columns = useMemo<GridColDef<ReportRow>[]>(
    () => [
      {
        field: 'folio',
        headerName: 'Folio',
        minWidth: 110,
        renderCell: ({ row }) => (
          <Typography sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {formatFolio(row.folio)}
          </Typography>
        ),
      },
      {
        field: 'sent_at',
        headerName: 'Enviado',
        minWidth: 190,
        valueFormatter: (value: string) => formatSentAt(value),
      },
      {
        field: 'technician',
        headerName: 'Técnico',
        flex: 1,
        minWidth: 200,
        sortable: false,
        renderCell: ({ row }) => (
          <Box sx={{ lineHeight: 1.4, py: 1 }}>
            <Typography>{row.technician?.full_name ?? '—'}</Typography>
            {row.technician?.email && (
              <Typography variant="body2" color="text.secondary">
                {row.technician.email}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        field: 'client',
        headerName: 'Cliente y sucursal',
        flex: 1.2,
        minWidth: 220,
        sortable: false,
        renderCell: ({ row }) => (
          <Box sx={{ lineHeight: 1.4, py: 1 }}>
            <Link component={RouterLink} to={`/clients/${row.client_id}/edit`}>
              {row.client?.name ?? '—'}
            </Link>
            {row.branch && (
              <Typography variant="body2" color="text.secondary">
                {row.branch.name}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        field: 'form',
        headerName: 'Formato',
        flex: 1.2,
        minWidth: 220,
        sortable: false,
        renderCell: ({ row }) => (
          <Box sx={{ lineHeight: 1.4, py: 1 }}>
            <Typography>{row.form?.name ?? '—'}</Typography>
            {row.form?.subtitle && (
              <Typography variant="body2" color="text.secondary">
                {row.form.subtitle}
              </Typography>
            )}
          </Box>
        ),
      },
    ],
    [],
  );

  const emptyState = technician ? (
    <GridEmptyState
      title="Este técnico aún no ha enviado reportes"
      description="Elige otro técnico o quita el filtro."
    />
  ) : (
    <GridEmptyState
      title="Aún no hay reportes"
      description="Los reportes aparecen aquí cuando un técnico los envía desde la app."
    />
  );

  return (
    <>
      <PageHeader title="Reportes" />

      <ListToolbar>
        <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <TechnicianFilter value={technician} onChange={setTechnician} />
        </Box>
      </ListToolbar>

      <Paper variant="outlined">
        <DataGrid
          {...dataGridProps}
          {...gridProps}
          getRowClassName={({ indexRelativeToCurrentPage }) =>
            indexRelativeToCurrentPage % 2 ? 'row-alt' : ''
          }
          columns={columns}
          slots={{ noRowsOverlay: () => emptyState, noResultsOverlay: () => emptyState }}
        />
      </Paper>
    </>
  );
}
