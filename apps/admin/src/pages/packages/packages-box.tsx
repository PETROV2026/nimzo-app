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
import { serviceFrequencyLabels, serviceFrequencySchema, type ServicePackage } from '@nimzo/shared';
import { useList, useUpdate } from '@refinedev/core';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router';

import { CatalogTable } from '@/components/catalog-table';
import { Postbox } from '@/components/postbox';
import { RowActions } from '@/components/row-actions';
import { StatusChip } from '@/components/status-chip';

import { CreatePackageDialog } from './create-package-dialog';

type PackageRow = ServicePackage & { service_package_forms?: { count: number }[] };

const order = serviceFrequencySchema.options;

function PackageRowItem({ item }: { item: PackageRow }) {
  const { mutate: update, mutation } = useUpdate<ServicePackage>();
  const label = `Paquete ${serviceFrequencyLabels[item.frequency].toLowerCase()}`;
  const to = `/packages/${item.id}`;
  const count = item.service_package_forms?.[0]?.count ?? 0;

  function toggleActive() {
    update({
      resource: 'service_packages',
      id: item.id,
      values: { is_active: !item.is_active },
      mutationMode: 'undoable',
      undoableTimeout: 5000,
      successNotification: {
        type: 'success',
        message: item.is_active ? 'Paquete desactivado' : 'Paquete activado',
        description: label,
      },
    });
  }

  return (
    <TableRow className={item.is_active ? undefined : 'row-inactive'}>
      <TableCell>
        <Link component={RouterLink} to={to} sx={{ fontWeight: 600 }}>
          {serviceFrequencyLabels[item.frequency]}
        </Link>
        <RowActions
          label={label}
          editTo={to}
          active={item.is_active}
          onToggleActive={toggleActive}
          pending={mutation.isPending}
        />
      </TableCell>
      <TableCell>
        {count === 0 ? (
          <Typography component="span" color="error.main">
            Sin formatos
          </Typography>
        ) : count === 1 ? (
          '1 formato'
        ) : (
          `${count} formatos`
        )}
      </TableCell>
      <TableCell>
        <StatusChip active={item.is_active} />
      </TableCell>
    </TableRow>
  );
}

export function PackagesBox({ branchId }: { branchId: string }) {
  const [creating, setCreating] = useState(false);
  const { result, query } = useList<PackageRow>({
    resource: 'service_packages',
    filters: [{ field: 'branch_id', operator: 'eq', value: branchId }],
    pagination: { mode: 'off' },
    meta: { select: '*, service_package_forms(count)' },
  });
  const packages = [...result.data].sort(
    (a, b) => order.indexOf(a.frequency) - order.indexOf(b.frequency),
  );

  return (
    <Postbox
      title="Paquetes de servicio"
      flush
      action={
        <Button variant="outlined" size="small" onClick={() => setCreating(true)}>
          Agregar paquete
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
            No se pudieron cargar los paquetes. Recarga la página para intentar de nuevo.
          </Alert>
        </Box>
      ) : packages.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography sx={{ fontWeight: 600 }} gutterBottom>
            Aún no hay paquetes
          </Typography>
          <Typography color="text.secondary">
            Un paquete define qué formatos llena el técnico en cada visita: semanal, mensual,
            trimestral, semestral o anual.
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <CatalogTable aria-label="Paquetes de servicio de la sucursal">
            <TableHead>
              <TableRow>
                <TableCell>Frecuencia</TableCell>
                <TableCell>Formatos</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {packages.map((item) => (
                <PackageRowItem key={item.id} item={item} />
              ))}
            </TableBody>
          </CatalogTable>
        </TableContainer>
      )}

      {creating && (
        <CreatePackageDialog
          branchId={branchId}
          taken={packages.map((item) => item.frequency)}
          onClose={() => setCreating(false)}
        />
      )}
    </Postbox>
  );
}
