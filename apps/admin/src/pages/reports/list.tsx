import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { formatFolio, type Report } from '@nimzo/shared';
import { useDataGrid } from '@refinedev/mui';
import { useMemo } from 'react';
import { Link as RouterLink } from 'react-router';

import { ClientFilter } from '@/components/client-filter';
import { useCatalogGridProps } from '@/components/catalog-grid';
import { GridEmptyState } from '@/components/grid-empty-state';
import { ListToolbar } from '@/components/list-toolbar';
import { PageHeader } from '@/components/page-header';
import { TechnicianFilter } from '@/components/technician-field';
import { technicianCrudFilter } from '@/lib/technician-filter';
import { useDebouncedFilters } from '@/lib/use-debounced-filters';
import { useDateParam, useDigitsParam, useIdParam } from '@/lib/use-list-params';

import { formatSentAt } from './format';
import { FOLIO_MAX_DIGITS, MIN_DATE, reportCrudFilters } from './report-filter';

const technicianClears = ['client'] as const;
const dateLimits = { min: MIN_DATE, max: '9999-12-31' };

type ReportRow = Report & {
  technician: { full_name: string; email: string | null } | null;
  client: { name: string } | null;
  branch: { name: string } | null;
  form: { name: string; subtitle: string | null } | null;
};

export function ReportList() {
  const gridProps = useCatalogGridProps();
  const [technicianId, setTechnicianId] = useIdParam('technician', technicianClears);
  const [clientId, setClientId] = useIdParam('client');
  const [folio, setFolio] = useDigitsParam('folio', FOLIO_MAX_DIGITS);
  const [from, setFrom] = useDateParam('from');
  const [to, setTo] = useDateParam('to');
  const datesReversed = from >= MIN_DATE && to >= MIN_DATE && to < from;

  const { dataGridProps, setFilters, setCurrentPage } = useDataGrid<ReportRow>({
    resource: 'reports',
    meta: {
      select:
        'id, folio, sent_at, client_id, branch_id, technician:profiles(full_name, email), client:clients(name), branch:branches(name), form:service_forms(name, subtitle)',
    },
    sorters: { initial: [{ field: 'sent_at', order: 'desc' }] },
    pagination: { pageSize: 20 },
  });

  const filters = [
    ...technicianCrudFilter(technicianId),
    ...reportCrudFilters({ folio, clientId, from, to }),
  ];
  useDebouncedFilters({ setFilters, setCurrentPage }, filters);

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

  const emptyState =
    filters.length > 0 ? (
      <GridEmptyState
        title="No se encontraron reportes"
        description="Revisa el folio y las fechas, o cambia los filtros."
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
        <Box
          sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 1.5, width: 1 }}
        >
          <TextField
            label="Folio"
            placeholder="Ej. 000123"
            value={folio}
            onChange={(event) => setFolio(event.target.value)}
            slotProps={{
              htmlInput: { inputMode: 'numeric', autoComplete: 'off' },
              inputLabel: { shrink: true },
            }}
            sx={{ width: { xs: '100%', sm: 130 } }}
          />
          <TechnicianFilter value={technicianId} onChange={setTechnicianId} />
          <ClientFilter
            key={technicianId ?? ''}
            value={clientId}
            onChange={setClientId}
            technicianId={technicianId}
          />
          <TextField
            type="date"
            label="Enviado desde"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            slotProps={{ htmlInput: dateLimits, inputLabel: { shrink: true } }}
            sx={{ width: { xs: '100%', sm: 170 } }}
          />
          <TextField
            type="date"
            label="Enviado hasta"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            error={datesReversed}
            helperText={datesReversed ? 'Es anterior a la fecha inicial.' : undefined}
            slotProps={{ htmlInput: dateLimits, inputLabel: { shrink: true } }}
            sx={{ width: { xs: '100%', sm: 170 } }}
          />
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
