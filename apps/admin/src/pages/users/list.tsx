import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import {
  userRoleLabels,
  userRoleSchema,
  type Profile,
  type UserRole,
  toSearchText,
} from '@nimzo/shared';
import { useGetIdentity, type CrudFilter } from '@refinedev/core';
import { useDataGrid } from '@refinedev/mui';
import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router';

import { useCatalogGridProps } from '@/components/catalog-grid';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { GridEmptyState } from '@/components/grid-empty-state';
import { ListToolbar } from '@/components/list-toolbar';
import { PageHeader } from '@/components/page-header';
import { RowActions } from '@/components/row-actions';
import { SearchField } from '@/components/search-field';
import { StatusChip } from '@/components/status-chip';
import { StatusLinks } from '@/components/status-links';
import { statusCrudFilter, type StatusFilter } from '@/lib/status-filter';
import { useDebouncedFilters } from '@/lib/use-debounced-filters';
import type { Identity } from '@/providers/auth-provider';
import { theme } from '@/theme';

import { formatLastSignIn } from './format';
import { useAdminUsers } from './use-admin-users';

function NameCell({
  user,
  isSelf,
  onDeactivate,
}: {
  user: Profile;
  isSelf: boolean;
  onDeactivate: (user: Profile) => void;
}) {
  const { run, pending } = useAdminUsers();
  const editTo = `/users/${user.id}/edit`;
  const name = user.full_name || user.email || 'Sin nombre';

  async function activate() {
    try {
      await run(
        { action: 'set_active', user_id: user.id, active: true },
        { message: 'Cuenta reactivada', description: name },
      );
    } catch {
      return;
    }
  }

  return (
    <Box sx={{ py: 1, minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Link component={RouterLink} to={editTo} sx={{ fontWeight: 600 }}>
          {name}
        </Link>
        {isSelf && <Chip size="small" variant="outlined" label="Tú" />}
      </Box>
      <RowActions
        label={`usuario ${name}`}
        editTo={editTo}
        active={user.is_active}
        onToggleActive={isSelf ? undefined : user.is_active ? () => onDeactivate(user) : activate}
        pending={pending}
      />
    </Box>
  );
}

export function UserList() {
  const isWide = useMediaQuery(theme.breakpoints.up('lg'));
  const gridProps = useCatalogGridProps();
  const { data: identity } = useGetIdentity<Identity>();
  const { run, pending } = useAdminUsers();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [role, setRole] = useState<UserRole | ''>('');
  const [toDeactivate, setToDeactivate] = useState<Profile | null>(null);

  const { dataGridProps, setFilters } = useDataGrid<Profile>({
    resource: 'profiles',
    sorters: { initial: [{ field: 'full_name', order: 'asc' }] },
    pagination: { pageSize: 20 },
  });

  const filters: CrudFilter[] = [...statusCrudFilter(status)];
  if (role) filters.push({ field: 'role', operator: 'eq', value: role });
  if (search.trim()) {
    filters.push({ field: 'search_text', operator: 'contains', value: toSearchText(search) });
  }
  useDebouncedFilters(setFilters, filters);

  async function deactivate(user: Profile) {
    try {
      await run(
        { action: 'set_active', user_id: user.id, active: false },
        { message: 'Cuenta desactivada', description: user.full_name || user.email || undefined },
      );
      setToDeactivate(null);
    } catch {
      return;
    }
  }

  const columns = useMemo<GridColDef<Profile>[]>(
    () => [
      {
        field: 'full_name',
        headerName: 'Usuario',
        flex: 1.2,
        minWidth: 220,
        renderCell: ({ row }) => (
          <NameCell user={row} isSelf={row.id === identity?.id} onDeactivate={setToDeactivate} />
        ),
      },
      {
        field: 'email',
        headerName: 'Correo',
        flex: 1.2,
        minWidth: 220,
        valueFormatter: (value) => value ?? '—',
      },
      {
        field: 'role',
        headerName: 'Rol',
        minWidth: 140,
        valueFormatter: (value: UserRole) => userRoleLabels[value] ?? value,
      },
      {
        field: 'last_sign_in_at',
        headerName: 'Último acceso',
        minWidth: 180,
        valueFormatter: (value: string | null) => formatLastSignIn(value),
      },
      {
        field: 'is_active',
        headerName: 'Estado',
        minWidth: 120,
        renderCell: ({ row }) => <StatusChip active={row.is_active} />,
      },
    ],
    [identity?.id],
  );

  const filtering = search.trim().length > 0 || status !== 'all' || role !== '';
  const emptyState = filtering ? (
    <GridEmptyState
      title="No se encontraron usuarios"
      description="Prueba con otro nombre o correo, o cambia los filtros."
    />
  ) : (
    <GridEmptyState
      title="Aún no hay usuarios"
      description="Agrega a los técnicos con el botón de arriba."
    />
  );

  return (
    <>
      <PageHeader
        title="Usuarios"
        action={
          <Button component={RouterLink} to="/users/create" variant="outlined" size="small">
            Agregar usuario
          </Button>
        }
      />

      <ListToolbar>
        <StatusLinks
          resource="profiles"
          value={status}
          onChange={setStatus}
          labels={{ all: 'Todos', active: 'Activos', inactive: 'Inactivos' }}
        />
        <Box
          sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, width: { xs: '100%', sm: 'auto' } }}
        >
          <TextField
            select
            label="Rol"
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole | '')}
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            sx={{ width: { xs: '100%', sm: 200 } }}
          >
            <MenuItem value="">Todos los roles</MenuItem>
            {userRoleSchema.options.map((option) => (
              <MenuItem key={option} value={option}>
                {userRoleLabels[option]}
              </MenuItem>
            ))}
          </TextField>
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Buscar usuarios"
            label="Buscar usuarios por nombre o correo"
          />
        </Box>
      </ListToolbar>

      <Paper variant="outlined">
        <DataGrid
          {...dataGridProps}
          {...gridProps}
          columns={columns}
          columnVisibilityModel={{ last_sign_in_at: isWide }}
          slots={{ noRowsOverlay: () => emptyState, noResultsOverlay: () => emptyState }}
        />
      </Paper>

      {toDeactivate && (
        <ConfirmDialog
          open
          title={`¿Desactivar a ${toDeactivate.full_name || toDeactivate.email}?`}
          confirmLabel="Desactivar cuenta"
          destructive
          loading={pending}
          onConfirm={() => deactivate(toDeactivate)}
          onClose={() => setToDeactivate(null)}
        >
          No podrá iniciar sesión en la app ni en el panel, y se cerrará su acceso actual. Sus
          reportes se conservan y puedes reactivarla cuando quieras.
        </ConfirmDialog>
      )}
    </>
  );
}
