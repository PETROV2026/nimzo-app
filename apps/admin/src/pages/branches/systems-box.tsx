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
import { systemTypeLabels, type System } from '@nimzo/shared';
import { useList, useUpdate } from '@refinedev/core';
import { useState } from 'react';

import { CatalogTable } from '@/components/catalog-table';
import { Postbox } from '@/components/postbox';
import { RowActions } from '@/components/row-actions';
import { StatusChip } from '@/components/status-chip';

import { SystemDialog } from '@/pages/systems/system-dialog';

type DialogState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; systemId: number };

function SystemRowItem({ system, onEdit }: { system: System; onEdit: () => void }) {
  const { mutate: update, mutation } = useUpdate<System>();

  function toggleActive() {
    update({
      resource: 'systems',
      id: system.id,
      values: { is_active: !system.is_active },
      successNotification: {
        type: 'success',
        message: system.is_active ? 'Sistema desactivado' : 'Sistema activado',
        description: system.name,
      },
    });
  }

  return (
    <TableRow className={system.is_active ? undefined : 'row-inactive'}>
      <TableCell>
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
      </TableCell>
      <TableCell>{systemTypeLabels[system.system_type]}</TableCell>
      <TableCell>{system.location ?? '—'}</TableCell>
      <TableCell>
        <StatusChip active={system.is_active} />
      </TableCell>
    </TableRow>
  );
}

export function SystemsBox({ branchId }: { branchId: number }) {
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });
  const { result, query } = useList<System>({
    resource: 'systems',
    filters: [{ field: 'branch_id', operator: 'eq', value: branchId }],
    sorters: [{ field: 'name', order: 'asc' }],
    pagination: { mode: 'off' },
  });

  const systems = result.data;
  const closeDialog = () => setDialog({ mode: 'closed' });

  return (
    <Postbox
      title="Sistemas"
      flush
      action={
        <Button variant="outlined" size="small" onClick={() => setDialog({ mode: 'create' })}>
          Agregar sistema
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
            No se pudieron cargar los sistemas. Recarga la página para intentar de nuevo.
          </Alert>
        </Box>
      ) : systems.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography sx={{ fontWeight: 600 }} gutterBottom>
            Aún no hay sistemas
          </Typography>
          <Typography color="text.secondary">
            Agrega los sistemas contra incendio de esta sucursal: los técnicos llenan un formato por
            cada uno.
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <CatalogTable aria-label="Sistemas de la sucursal">
            <TableHead>
              <TableRow>
                <TableCell>Sistema</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Ubicación</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {systems.map((system) => (
                <SystemRowItem
                  key={system.id}
                  system={system}
                  onEdit={() => setDialog({ mode: 'edit', systemId: system.id })}
                />
              ))}
            </TableBody>
          </CatalogTable>
        </TableContainer>
      )}

      {dialog.mode !== 'closed' && (
        <SystemDialog
          branchId={branchId}
          systemId={dialog.mode === 'edit' ? dialog.systemId : undefined}
          onClose={closeDialog}
        />
      )}
    </Postbox>
  );
}
