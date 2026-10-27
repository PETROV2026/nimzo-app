import Add from '@mui/icons-material/Add';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid2';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Switch from '@mui/material/Switch';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import {
  formTitle,
  serviceFrequencyLabels,
  type ServiceForm,
  type ServicePackage,
  type ServicePackageForm,
} from '@nimzo/shared';
import { useDelete, useList, useOne, useUpdate } from '@refinedev/core';
import { useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { CatalogTable } from '@/components/catalog-table';
import { PageHeader } from '@/components/page-header';
import { Postbox } from '@/components/postbox';
import { FormIcon } from '@/pages/forms/form-icon';
import { useBranchCrumbs } from '@/pages/branches/use-branch-crumbs';
import { ADMIN_BAR_HEIGHT } from '@/theme';

import { AddFormDialog } from './add-form-dialog';

type ItemRow = ServicePackageForm & {
  service_forms: Pick<ServiceForm, 'name' | 'subtitle' | 'icon_path' | 'is_active'> | null;
  systems: { name: string; is_active: boolean } | null;
};

function ItemRowView({ item }: { item: ItemRow }) {
  const { mutate: remove, mutation } = useDelete();
  const form = item.service_forms;
  const label = form ? formTitle(form) : 'formato';

  return (
    <TableRow>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <FormIcon path={form?.icon_path} size={32} />
          <Box>
            <Typography sx={{ fontWeight: 600 }}>{label}</Typography>
            <Typography variant="body2" color="text.secondary">
              {[form?.subtitle, form && !form.is_active ? 'Formato inactivo' : null]
                .filter(Boolean)
                .join(' · ') || ' '}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        {item.systems?.name ?? <Typography color="text.secondary">General</Typography>}
      </TableCell>
      <TableCell align="right">
        <Link
          component="button"
          type="button"
          className="touch-target"
          disabled={mutation.isPending}
          aria-label={`Quitar ${label}${item.systems ? ` de ${item.systems.name}` : ''} del paquete`}
          onClick={() =>
            remove({
              resource: 'service_package_forms',
              id: item.id,
              mutationMode: 'undoable',
              undoableTimeout: 5000,
              successNotification: {
                type: 'success',
                message: 'Formato quitado del paquete',
                description: label,
              },
            })
          }
          sx={{ fontSize: 13, color: 'error.main' }}
        >
          Quitar
        </Link>
      </TableCell>
    </TableRow>
  );
}

export function PackageEdit() {
  const { id = '' } = useParams();
  const [adding, setAdding] = useState(false);
  const { result: pkg, query } = useOne<ServicePackage>({ resource: 'service_packages', id });
  const { crumbs } = useBranchCrumbs({ branchId: pkg ? String(pkg.branch_id) : undefined });
  const { mutate: update, mutation } = useUpdate<ServicePackage>();
  const items = useList<ItemRow>({
    resource: 'service_package_forms',
    filters: [{ field: 'package_id', operator: 'eq', value: id }],
    pagination: { mode: 'off' },
    meta: {
      select: '*, service_forms(name, subtitle, icon_path, is_active), systems(name, is_active)',
    },
  });
  const rows = [...items.result.data].sort(
    (a, b) =>
      formTitle(a.service_forms ?? { name: '', subtitle: null }).localeCompare(
        formTitle(b.service_forms ?? { name: '', subtitle: null }),
      ) || (a.systems?.name ?? '').localeCompare(b.systems?.name ?? ''),
  );

  if (query.isError) {
    return (
      <Alert severity="error">
        No se pudo cargar el paquete. Recarga la página para intentar de nuevo.
      </Alert>
    );
  }

  const frequency = pkg ? serviceFrequencyLabels[pkg.frequency] : undefined;
  const title = frequency ? `Paquete ${frequency.toLowerCase()}` : 'Paquete';

  return (
    <>
      <Breadcrumbs
        items={[
          ...crumbs.slice(0, 2),
          { label: crumbs[2]?.label, to: pkg ? `/branches/${pkg.branch_id}/edit` : undefined },
          { label: frequency ? title : undefined },
        ]}
      />
      <PageHeader
        title={title}
        description="Los formatos que el técnico llena en cada visita con esta frecuencia."
      />

      <Grid container spacing={2.5} sx={{ alignItems: 'flex-start' }}>
        <Grid size={{ xs: 12, lg: 8, xl: 9 }}>
          <Postbox
            title="Formatos del paquete"
            flush
            action={
              <Button
                variant="outlined"
                size="small"
                startIcon={<Add fontSize="small" />}
                onClick={() => setAdding(true)}
                disabled={!pkg}
              >
                Agregar formato
              </Button>
            }
          >
            {items.query.isLoading ? (
              <Box sx={{ p: 2 }}>
                <Skeleton height={48} />
                <Skeleton height={48} />
              </Box>
            ) : items.query.isError ? (
              <Box sx={{ p: 2 }}>
                <Alert severity="error">No se pudieron cargar los formatos del paquete.</Alert>
              </Box>
            ) : rows.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 600 }} gutterBottom>
                  El paquete aún no tiene formatos
                </Typography>
                <Typography color="text.secondary">
                  Agrega los formatos que se llenan en esta visita y, si aplica, el sistema de la
                  sucursal al que corresponde cada uno.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <CatalogTable aria-label="Formatos del paquete">
                  <TableHead>
                    <TableRow>
                      <TableCell>Formato</TableCell>
                      <TableCell>Sistema</TableCell>
                      <TableCell align="right">
                        <span className="visually-hidden">Acciones</span>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((item) => (
                      <ItemRowView key={item.id} item={item} />
                    ))}
                  </TableBody>
                </CatalogTable>
              </TableContainer>
            )}
          </Postbox>
        </Grid>

        <Grid
          size={{ xs: 12, lg: 4, xl: 3 }}
          sx={{ position: { lg: 'sticky' }, top: { lg: ADMIN_BAR_HEIGHT + 20 } }}
        >
          <Postbox title="Paquete">
            {!pkg ? (
              <Skeleton height={80} />
            ) : (
              <>
                <Typography>
                  <strong>{rows.length}</strong> {rows.length === 1 ? 'formato' : 'formatos'} por
                  visita {frequency?.toLowerCase()}.
                </Typography>
                <FormControlLabel
                  sx={{ mt: 1.5 }}
                  control={
                    <Switch
                      checked={pkg.is_active}
                      disabled={mutation.isPending}
                      onChange={(_, checked) =>
                        update({
                          resource: 'service_packages',
                          id: pkg.id,
                          values: { is_active: checked },
                          successNotification: {
                            type: 'success',
                            message: checked ? 'Paquete activado' : 'Paquete desactivado',
                            description: title,
                          },
                        })
                      }
                    />
                  }
                  label={pkg.is_active ? 'Paquete activo' : 'Paquete inactivo'}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Los técnicos solo ven los paquetes activos. Los cambios se guardan al instante.
                </Typography>
                <Link
                  component={RouterLink}
                  to={`/branches/${pkg.branch_id}/edit`}
                  className="touch-target"
                  sx={{ display: 'inline-block', mt: 2, fontSize: 13 }}
                >
                  Volver a la sucursal
                </Link>
              </>
            )}
          </Postbox>
        </Grid>
      </Grid>

      {adding && pkg && (
        <AddFormDialog
          packageId={pkg.id}
          branchId={pkg.branch_id}
          frequency={pkg.frequency}
          existing={rows}
          onClose={() => setAdding(false)}
        />
      )}
    </>
  );
}
