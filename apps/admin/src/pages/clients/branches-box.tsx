import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { mexicanStateLabels, type Branch, type MexicanState } from '@nimzo/shared';
import { useList, useUpdate } from '@refinedev/core';
import { Link as RouterLink } from 'react-router';

import { CatalogTable } from '@/components/catalog-table';
import { Postbox } from '@/components/postbox';
import { RowActions } from '@/components/row-actions';
import { StatusChip } from '@/components/status-chip';

type BranchRow = Branch & { systems?: { count: number }[] };

function locationLabel(branch: Branch) {
  const state = branch.state ? mexicanStateLabels[branch.state as MexicanState] : null;
  return [branch.city, state].filter(Boolean).join(', ') || '—';
}

function BranchRowItem({ branch }: { branch: BranchRow }) {
  const { mutate: update, mutation } = useUpdate<Branch>();
  const editTo = `/branches/${branch.id}/edit`;
  const systemCount = branch.systems?.[0]?.count ?? 0;

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
    <TableRow className={branch.is_active ? undefined : 'row-inactive'}>
      <TableCell>
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
      </TableCell>
      <TableCell>{locationLabel(branch)}</TableCell>
      <TableCell>{systemCount === 1 ? '1 sistema' : `${systemCount} sistemas`}</TableCell>
      <TableCell>
        <StatusChip active={branch.is_active} />
      </TableCell>
    </TableRow>
  );
}

export function BranchesBox({ clientId }: { clientId: string }) {
  const { result, query } = useList<BranchRow>({
    resource: 'branches',
    filters: [{ field: 'client_id', operator: 'eq', value: clientId }],
    sorters: [{ field: 'name', order: 'asc' }],
    pagination: { mode: 'off' },
    meta: { select: '*, systems(count)' },
  });

  const branches = result.data;
  const createTo = `/branches/create?client=${clientId}`;

  return (
    <Postbox
      title="Sucursales"
      flush
      action={
        <Button component={RouterLink} to={createTo} variant="outlined" size="small">
          Agregar sucursal
        </Button>
      }
    >
      {query.isLoading ? (
        <Box sx={{ p: 2 }}>
          <Skeleton height={40} />
          <Skeleton height={40} />
        </Box>
      ) : query.isError ? (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">
            No se pudieron cargar las sucursales. Recarga la página para intentar de nuevo.
          </Alert>
        </Box>
      ) : branches.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography sx={{ fontWeight: 600 }} gutterBottom>
            Aún no hay sucursales
          </Typography>
          <Typography color="text.secondary">
            Agrega los lugares donde das servicio a este cliente; después registras sus sistemas.
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <CatalogTable aria-label="Sucursales del cliente">
            <TableHead>
              <TableRow>
                <TableCell>Sucursal</TableCell>
                <TableCell>Ubicación</TableCell>
                <TableCell>Sistemas</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {branches.map((branch) => (
                <BranchRowItem key={branch.id} branch={branch} />
              ))}
            </TableBody>
          </CatalogTable>
        </TableContainer>
      )}
    </Postbox>
  );
}
