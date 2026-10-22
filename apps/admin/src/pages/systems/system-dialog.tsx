import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import {
  systemCreateSchema,
  systemFormSchema,
  systemTypeLabels,
  systemTypeSchema,
  type Branch,
  type System,
  type SystemFormInput,
} from '@nimzo/shared';
import type { HttpError } from '@refinedev/core';
import { useForm } from '@refinedev/react-hook-form';
import { useId } from 'react';
import { Controller, type Resolver } from 'react-hook-form';

import { RecordAutocomplete } from '@/components/record-autocomplete';

type SystemVariables = SystemFormInput & { branch_id?: number };

const emptySystem: SystemVariables = {
  system_type: '' as SystemFormInput['system_type'],
  name: '',
  location: '',
  notes: '',
  is_active: true,
};

type BranchOption = Branch & { clients: { name: string } | null };

type SystemDialogProps = {
  branchId?: number;
  systemId?: number;
  onClose: () => void;
};

export function SystemDialog({ branchId, systemId, onClose }: SystemDialogProps) {
  const isEdit = systemId !== undefined;
  const titleId = useId();
  const {
    control,
    handleSubmit,
    refineCore: { onFinish, formLoading, query },
  } = useForm<System, HttpError, SystemVariables>({
    refineCoreProps: {
      resource: 'systems',
      action: isEdit ? 'edit' : 'create',
      id: systemId,
      redirect: false,
      successNotification: (response) => ({
        type: 'success',
        message: isEdit ? 'Sistema guardado' : 'Sistema agregado',
        description: response?.data.name,
      }),
      onMutationSuccess: onClose,
    },
    resolver: (isEdit
      ? zodResolver(systemFormSchema)
      : zodResolver(systemCreateSchema)) as Resolver<SystemVariables>,
    defaultValues: { ...emptySystem, branch_id: branchId },
  });

  const loadingRecord = isEdit && query?.isLoading;

  return (
    <Dialog open onClose={onClose} aria-labelledby={titleId} fullWidth maxWidth="sm">
      <form
        noValidate
        onSubmit={(event) => {
          event.stopPropagation();
          void handleSubmit((values) => onFinish(values))(event);
        }}
      >
        <DialogTitle id={titleId}>{isEdit ? 'Editar sistema' : 'Agregar sistema'}</DialogTitle>
        <DialogContent>
          {query?.isError ? (
            <Alert severity="error">No se pudo cargar el sistema. Cierra e intenta de nuevo.</Alert>
          ) : loadingRecord ? (
            <Stack spacing={1} sx={{ pt: 1 }}>
              <Skeleton height={56} />
              <Skeleton height={56} />
              <Skeleton height={56} />
            </Stack>
          ) : (
            <Stack spacing={2} sx={{ pt: 1 }}>
              {!isEdit && branchId === undefined && (
                <Controller
                  control={control}
                  name="branch_id"
                  render={({ field, fieldState }) => (
                    <RecordAutocomplete<BranchOption>
                      resource="branches"
                      label="Sucursal"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      select="id, name, is_active, clients(name)"
                      getOptionLabel={(branch) =>
                        branch.clients ? `${branch.name} · ${branch.clients.name}` : branch.name
                      }
                      error={fieldState.error?.message}
                      autoFocus
                      noOptionsText="No hay sucursales activas con ese nombre"
                    />
                  )}
                />
              )}
              <Controller
                control={control}
                name="system_type"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    select
                    label="Tipo de sistema"
                    required
                    autoFocus={!isEdit && branchId !== undefined}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  >
                    {systemTypeSchema.options.map((type) => (
                      <MenuItem key={type} value={type}>
                        {systemTypeLabels[type]}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Controller
                control={control}
                name="name"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Nombre"
                    required
                    error={!!fieldState.error}
                    helperText={
                      fieldState.error?.message ??
                      'Para distinguirlo en los reportes. Ej. Red de rociadores nave 2'
                    }
                  />
                )}
              />
              <Controller
                control={control}
                name="location"
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label="Ubicación (opcional)"
                    helperText="Dónde está dentro de la sucursal. Ej. Cuarto de máquinas, planta baja"
                  />
                )}
              />
              <Controller
                control={control}
                name="notes"
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label="Notas (opcional)"
                    multiline
                    minRows={2}
                  />
                )}
              />
              {isEdit && (
                <Controller
                  control={control}
                  name="is_active"
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(_, checked) => field.onChange(checked)}
                        />
                      }
                      label={field.value ? 'Sistema activo' : 'Sistema inactivo'}
                    />
                  )}
                />
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" loading={formLoading} disabled={loadingRecord}>
            {isEdit ? 'Guardar cambios' : 'Agregar sistema'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
