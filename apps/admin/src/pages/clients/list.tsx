import AddIcon from '@mui/icons-material/Add';
import EditOutlined from '@mui/icons-material/EditOutlined';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import type { Client } from '@nimzo/shared';
import type { CrudFilter } from '@refinedev/core';
import { useDataGrid } from '@refinedev/mui';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { PageHeader } from '@/components/page-header';
import { theme } from '@/theme';

function StatusChip({ active }: { active: boolean }) {
  return active ? (
    <Chip size="small" label="Activo" color="primary" />
  ) : (
    <Chip size="small" label="Inactivo" variant="outlined" />
  );
}

function EmptyState({ filtering }: { filtering: boolean }) {
  return (
    <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', p: 4, textAlign: 'center' }}>
      <Box>
        <Typography variant="h6" component="p" gutterBottom>
          {filtering ? 'No hay clientes que coincidan con la búsqueda' : 'Aún no hay clientes'}
        </Typography>
        <Typography color="text.secondary">
          {filtering
            ? 'Prueba con otro nombre.'
            : 'Agrega el primero para registrar sus sucursales.'}
        </Typography>
      </Box>
    </Box>
  );
}

export function ClientList() {
  const navigate = useNavigate();
  // On tablets, keep the essentials visible instead of scrolling the table sideways.
  const isWide = useMediaQuery(theme.breakpoints.up('lg'));
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const { dataGridProps, setFilters } = useDataGrid<Client>({
    resource: 'clients',
    sorters: { initial: [{ field: 'name', order: 'asc' }] },
    filters: { initial: [{ field: 'is_active', operator: 'eq', value: true }] },
    pagination: { pageSize: 20 },
  });

  // Search runs in Supabase (ilike); debounce so we don't query on every keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => {
      const filters: CrudFilter[] = [];
      if (search.trim())
        filters.push({ field: 'name', operator: 'contains', value: search.trim() });
      if (!showInactive) filters.push({ field: 'is_active', operator: 'eq', value: true });
      setFilters(filters, 'replace');
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, showInactive, setFilters]);

  const columns = useMemo<GridColDef<Client>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Cliente',
        flex: 1.4,
        minWidth: 220,
        renderCell: ({ row }) => (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.name}
          </Typography>
        ),
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
            <Box sx={{ lineHeight: 1.35, py: 1 }}>
              <Typography variant="body2">{row.contact_name ?? '—'}</Typography>
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
        minWidth: 140,
        renderCell: ({ row }) => <StatusChip active={row.is_active} />,
      },
      {
        field: 'actions',
        headerName: '',
        width: 64,
        sortable: false,
        disableColumnMenu: true,
        align: 'right',
        renderCell: ({ row }) => (
          <Tooltip title="Editar">
            <IconButton
              component={Link}
              to={`/clients/${row.id}/edit`}
              aria-label={`Editar ${row.name}`}
              onClick={(event) => event.stopPropagation()}
            >
              <EditOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [],
  );

  const filtering = search.trim().length > 0;

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Empresas a las que se les da servicio de inspección, prueba y mantenimiento."
        actions={
          <Button component={Link} to="/clients/create" variant="contained" startIcon={<AddIcon />}>
            Agregar cliente
          </Button>
        }
      />

      <Card>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            p: 2,
          }}
        >
          <TextField
            placeholder="Buscar por nombre"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            size="small"
            sx={{ maxWidth: 360 }}
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
          <FormControlLabel
            control={
              <Switch checked={showInactive} onChange={(_, checked) => setShowInactive(checked)} />
            }
            label="Mostrar inactivos"
          />
        </Box>

        <DataGrid
          {...dataGridProps}
          columns={columns}
          columnVisibilityModel={{ tax_id: isWide, contact_phone: isWide }}
          autoHeight
          rowHeight={64}
          disableRowSelectionOnClick
          onRowClick={({ row }) => navigate(`/clients/${row.id}/edit`)}
          pageSizeOptions={[20, 50, 100]}
          slots={{
            noRowsOverlay: () => <EmptyState filtering={filtering} />,
            noResultsOverlay: () => <EmptyState filtering />,
          }}
          sx={{
            '& .MuiDataGrid-row': { cursor: 'pointer' },
            '& .MuiDataGrid-row--inactive': { color: 'text.secondary' },
            '& .MuiDataGrid-overlayWrapper': { minHeight: 240 },
          }}
          getRowClassName={({ row }) => (row.is_active ? '' : 'MuiDataGrid-row--inactive')}
        />
      </Card>
    </>
  );
}
