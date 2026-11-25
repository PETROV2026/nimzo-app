import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { type FeedbackMessage, feedbackKindLabels, feedbackScreenLabel } from '@nimzo/shared';
import { useDataGrid } from '@refinedev/mui';
import { useMemo } from 'react';
import { Link as RouterLink } from 'react-router';

import { useCatalogGridProps } from '@/components/catalog-grid';
import { GridEmptyState } from '@/components/grid-empty-state';
import { ListToolbar } from '@/components/list-toolbar';
import { PageHeader } from '@/components/page-header';
import { TechnicianFilter } from '@/components/technician-field';
import { technicianCrudFilter } from '@/lib/technician-filter';
import { useDebouncedFilters } from '@/lib/use-debounced-filters';
import { useIdParam, useOptionParam } from '@/lib/use-list-params';

import { formatMessageDate } from './format';
import { kindCrudFilter, kindFilters } from './kind-filter';
import { KindLinks } from './kind-links';

type MessageRow = FeedbackMessage & {
  technician: { full_name: string; email: string | null } | null;
};

export function MessageList() {
  const gridProps = useCatalogGridProps();
  const [kind, setKind] = useOptionParam('kind', kindFilters, 'all');
  const [technicianId, setTechnicianId] = useIdParam('technician');

  const { dataGridProps, setFilters, setCurrentPage } = useDataGrid<MessageRow>({
    resource: 'feedback_messages',
    meta: {
      select:
        'id, kind, message, screen, photo_paths, created_at, technician:profiles(full_name, email)',
    },
    sorters: { initial: [{ field: 'created_at', order: 'desc' }] },
    pagination: { pageSize: 20 },
  });

  useDebouncedFilters({ setFilters, setCurrentPage }, [
    ...kindCrudFilter(kind),
    ...technicianCrudFilter(technicianId),
  ]);

  const columns = useMemo<GridColDef<MessageRow>[]>(
    () => [
      {
        field: 'created_at',
        headerName: 'Recibido',
        minWidth: 180,
        valueFormatter: (value: string) => formatMessageDate(value),
      },
      {
        field: 'kind',
        headerName: 'Tipo',
        minWidth: 100,
        renderCell: ({ row }) => (
          <Chip
            size="small"
            label={feedbackKindLabels[row.kind]}
            color={row.kind === 'bug' ? 'warning' : 'primary'}
            variant={row.kind === 'bug' ? 'filled' : 'outlined'}
          />
        ),
      },
      {
        field: 'message',
        headerName: 'Mensaje',
        flex: 2,
        minWidth: 280,
        sortable: false,
        renderCell: ({ row }) => (
          <Box sx={{ lineHeight: 1.4, py: 1, minWidth: 0 }}>
            <Link component={RouterLink} to={`/messages/${row.id}`} sx={{ fontWeight: 600 }}>
              <Box
                component="span"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  whiteSpace: 'normal',
                }}
              >
                {row.message}
              </Box>
            </Link>
            {row.photo_paths.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                {row.photo_paths.length === 1 ? '1 imagen' : `${row.photo_paths.length} imágenes`}
              </Typography>
            )}
          </Box>
        ),
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
        field: 'screen',
        headerName: 'Pantalla',
        minWidth: 120,
        sortable: false,
        valueFormatter: (value: string) => feedbackScreenLabel(value),
      },
    ],
    [],
  );

  const filtering = kind !== 'all' || technicianId !== undefined;
  const emptyState = filtering ? (
    <GridEmptyState
      title="No hay mensajes con estos filtros"
      description="Elige otro tipo o técnico, o quita los filtros."
    />
  ) : (
    <GridEmptyState
      title="Aún no hay mensajes"
      description="Aparecen aquí cuando un técnico envía un comentario desde la app."
    />
  );

  return (
    <>
      <PageHeader title="Mensajes" />

      <ListToolbar>
        <KindLinks value={kind} onChange={setKind} />
        <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <TechnicianFilter value={technicianId} onChange={setTechnicianId} />
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
