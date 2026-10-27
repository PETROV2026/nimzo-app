import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  formTitle,
  serviceFrequencyKeywords,
  serviceFrequencyLabels,
  systemTypeLabels,
  toSearchText,
  type ServiceForm,
  type ServiceFrequency,
  type ServicePackageForm,
  type System,
} from '@nimzo/shared';
import { useCreateMany, useList } from '@refinedev/core';
import { useId, useState } from 'react';

import { FormIcon } from '@/pages/forms/form-icon';

type AddFormDialogProps = {
  packageId: string;
  branchId: string;
  frequency: ServiceFrequency;
  existing: Pick<ServicePackageForm, 'service_form_id' | 'system_id'>[];
  onClose: () => void;
};

export function AddFormDialog({
  packageId,
  branchId,
  frequency,
  existing,
  onClose,
}: AddFormDialogProps) {
  const titleId = useId();
  const [form, setForm] = useState<ServiceForm | null>(null);
  const [systems, setSystems] = useState<System[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const { mutate: createMany, mutation } = useCreateMany<ServicePackageForm>();

  const forms = useList<ServiceForm>({
    resource: 'service_forms',
    filters: [{ field: 'is_active', operator: 'eq', value: true }],
    sorters: [
      { field: 'name', order: 'asc' },
      { field: 'subtitle', order: 'asc' },
    ],
    pagination: { mode: 'off' },
  });
  const branchSystems = useList<System>({
    resource: 'systems',
    filters: [
      { field: 'branch_id', operator: 'eq', value: branchId },
      { field: 'is_active', operator: 'eq', value: true },
    ],
    sorters: [{ field: 'name', order: 'asc' }],
    pagination: { mode: 'off' },
  });

  const keyword = serviceFrequencyKeywords[frequency];
  const suggested = (item: ServiceForm) => toSearchText(item.subtitle ?? '').includes(keyword);
  const options = [...forms.result.data].sort(
    (a, b) =>
      Number(suggested(b)) - Number(suggested(a)) || formTitle(a).localeCompare(formTitle(b)),
  );

  const isTaken = (systemId: string | null) =>
    !!form &&
    existing.some((item) => item.service_form_id === form.id && item.system_id === systemId);
  const targets: (string | null)[] = systems.length ? systems.map((system) => system.id) : [null];
  const newTargets = targets.filter((systemId) => !isTaken(systemId));
  const skipped = targets.length - newTargets.length;

  function submit() {
    if (!form) {
      setFormError('Elige un formato');
      return;
    }
    if (newTargets.length === 0) return;
    createMany(
      {
        resource: 'service_package_forms',
        values: newTargets.map((systemId) => ({
          package_id: packageId,
          service_form_id: form.id,
          system_id: systemId,
        })),
        successNotification: {
          type: 'success',
          message:
            newTargets.length === 1
              ? 'Formato agregado al paquete'
              : `${newTargets.length} formatos agregados al paquete`,
          description: formTitle(form),
        },
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Dialog open onClose={onClose} aria-labelledby={titleId} fullWidth maxWidth="sm">
      <DialogTitle id={titleId}>Agregar formato al paquete</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Autocomplete
            options={options}
            value={form}
            onChange={(_, value) => {
              setForm(value);
              setFormError(null);
            }}
            loading={forms.query.isLoading}
            groupBy={(item) =>
              suggested(item)
                ? `Sugeridos para ${serviceFrequencyLabels[frequency].toLowerCase()}`
                : 'Otros formatos'
            }
            getOptionLabel={formTitle}
            filterOptions={(items, state) => {
              const term = toSearchText(state.inputValue);
              return term
                ? items.filter((item) => toSearchText(formTitle(item)).includes(term))
                : items;
            }}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            noOptionsText="No hay formatos activos con ese nombre"
            loadingText="Cargando formatos…"
            renderOption={({ key, ...props }, item) => (
              <Box component="li" key={key} {...props} sx={{ display: 'flex', gap: 1.5 }}>
                <FormIcon path={item.icon_path} size={28} />
                <Box>
                  <Typography>{item.name}</Typography>
                  {item.subtitle && (
                    <Typography variant="body2" color="text.secondary">
                      {item.subtitle}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Formato"
                required
                autoFocus
                error={!!formError}
                helperText={
                  formError ?? 'Busca por nombre o frecuencia, por ejemplo rociadores o mensual.'
                }
              />
            )}
          />

          <Autocomplete
            multiple
            disableCloseOnSelect
            options={branchSystems.result.data}
            value={systems}
            onChange={(_, value) => setSystems(value)}
            loading={branchSystems.query.isLoading}
            getOptionLabel={(system) => `${system.name} · ${systemTypeLabels[system.system_type]}`}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            noOptionsText="Esta sucursal no tiene sistemas activos"
            loadingText="Cargando sistemas…"
            renderInput={(params) => (
              <TextField
                {...params}
                label="Sistemas (opcional)"
                helperText="Si eliges varios, el técnico llenará un formato por cada sistema. Déjalo vacío para un formato general, como el de observaciones."
              />
            )}
          />

          {form && skipped > 0 && (
            <Alert severity={newTargets.length === 0 ? 'warning' : 'info'}>
              {newTargets.length === 0
                ? 'Este formato ya está en el paquete con esa selección.'
                : `${skipped === 1 ? 'Un sistema ya tenía' : `${skipped} sistemas ya tenían`} este formato; solo se agregarán los demás.`}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={submit}
          loading={mutation.isPending}
          disabled={!!form && newTargets.length === 0}
        >
          {newTargets.length > 1 ? `Agregar ${newTargets.length} formatos` : 'Agregar formato'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
