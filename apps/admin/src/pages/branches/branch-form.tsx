import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid2';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  branchCreateSchema,
  branchFormSchema,
  mexicanStateLabels,
  mexicanStates,
  type Branch,
  type BranchFormInput,
  type Client,
} from '@nimzo/shared';
import type { HttpError } from '@refinedev/core';
import { useForm } from '@refinedev/react-hook-form';
import type { ReactNode } from 'react';
import { Controller, type Control, type FieldPath, type Resolver } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router';

import { Postbox } from '@/components/postbox';
import { RecordAutocomplete } from '@/components/record-autocomplete';

const emptyBranch: BranchVariables = {
  name: '',
  address: '',
  city: '',
  state: null,
  contact_name: '',
  contact_phone: '',
  is_active: true,
};

type BranchVariables = BranchFormInput & { client_id?: number };

type TextFieldName = Exclude<FieldPath<BranchFormInput>, 'is_active' | 'state'>;

type FieldProps = Omit<TextFieldProps, 'name'> & {
  control: Control<BranchVariables>;
  name: TextFieldName;
};

function FormTextField({ control, name, ...props }: FieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          {...field}
          value={field.value ?? ''}
          error={!!fieldState.error}
          helperText={fieldState.error?.message ?? props.helperText}
        />
      )}
    />
  );
}

type BranchFormProps = {
  action: 'create' | 'edit';
  id?: string;
  clientId?: number;
  children?: ReactNode;
};

export function BranchForm({ action, clientId, id, children }: BranchFormProps) {
  const isEdit = action === 'edit';
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    refineCore: { onFinish, formLoading, query },
  } = useForm<Branch, HttpError, BranchVariables>({
    refineCoreProps: {
      resource: 'branches',
      action,
      id,
      redirect: false,
      successNotification: (response) => ({
        type: 'success',
        message: isEdit ? 'Sucursal guardada' : 'Sucursal agregada',
        description: response?.data.name,
      }),
      onMutationSuccess: ({ data }) => {
        if (!isEdit) navigate(`/branches/${data.id}/edit`);
      },
    },
    resolver: (isEdit
      ? zodResolver(branchFormSchema)
      : zodResolver(branchCreateSchema)) as Resolver<BranchVariables>,
    defaultValues: { ...emptyBranch, client_id: clientId },
  });

  const recordClientId = query?.data?.data.client_id ?? clientId;
  const cancelTo = recordClientId ? `/clients/${recordClientId}/edit` : '/branches';

  const loadingRecord = isEdit && query?.isLoading;

  if (query?.isError) {
    return (
      <Alert severity="error">
        No se pudo cargar la sucursal. Recarga la página para intentar de nuevo.
      </Alert>
    );
  }

  const fieldsSkeleton = (
    <>
      <Skeleton height={48} />
      <Skeleton height={48} />
    </>
  );

  return (
    <Box component="form" noValidate onSubmit={handleSubmit((values) => onFinish(values))}>
      <Grid container spacing={2.5} sx={{ alignItems: 'flex-start' }}>
        <Grid size={{ xs: 12, lg: 8, xl: 9 }}>
          <Stack spacing={2.5}>
            <Postbox title="Datos de la sucursal">
              {loadingRecord ? (
                fieldsSkeleton
              ) : (
                <Grid container spacing={2}>
                  {!isEdit && (
                    <Grid size={12}>
                      <Controller
                        control={control}
                        name="client_id"
                        render={({ field, fieldState }) => (
                          <RecordAutocomplete<Client>
                            resource="clients"
                            label="Cliente"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            inputRef={field.ref}
                            getOptionLabel={(client) => client.name}
                            error={fieldState.error?.message}
                            helperText="Empresa a la que pertenece la sucursal."
                            autoFocus={clientId === undefined}
                            noOptionsText="No hay clientes activos con ese nombre"
                          />
                        )}
                      />
                    </Grid>
                  )}
                  <Grid size={12}>
                    <FormTextField
                      control={control}
                      name="name"
                      label="Nombre de la sucursal"
                      required
                      autoFocus={!isEdit && clientId !== undefined}
                      helperText="Así aparecerá en los reportes. Ej. Planta Apodaca"
                    />
                  </Grid>
                  <Grid size={12}>
                    <FormTextField
                      control={control}
                      name="address"
                      label="Dirección (opcional)"
                      helperText="Calle, número y colonia."
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormTextField control={control} name="city" label="Ciudad (opcional)" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                      control={control}
                      name="state"
                      render={({ field, fieldState }) => (
                        <Autocomplete
                          options={mexicanStates}
                          value={field.value ?? null}
                          onChange={(_, value) => field.onChange(value)}
                          onBlur={field.onBlur}
                          getOptionLabel={(code) => mexicanStateLabels[code]}
                          noOptionsText="No hay estados con ese nombre"
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              inputRef={field.ref}
                              label="Estado (opcional)"
                              error={!!fieldState.error}
                              helperText={fieldState.error?.message}
                            />
                          )}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              )}
            </Postbox>

            <Postbox title="Contacto en la sucursal">
              {loadingRecord ? (
                fieldsSkeleton
              ) : (
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <Typography variant="body2" color="text.secondary">
                      Quién recibe al técnico en el lugar. Los dos campos son opcionales.
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormTextField control={control} name="contact_name" label="Nombre" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormTextField
                      control={control}
                      name="contact_phone"
                      label="Teléfono"
                      type="tel"
                    />
                  </Grid>
                </Grid>
              )}
            </Postbox>

            {children}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4, xl: 3 }} sx={{ position: { lg: 'sticky' }, top: { lg: 60 } }}>
          <Postbox title={isEdit ? 'Guardar' : 'Agregar'} flush>
            <Box sx={{ p: 2 }}>
              {isEdit ? (
                <Controller
                  control={control}
                  name="is_active"
                  render={({ field }) => (
                    <>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.value}
                            onChange={(_, checked) => field.onChange(checked)}
                            disabled={loadingRecord}
                          />
                        }
                        label={field.value ? 'Sucursal activa' : 'Sucursal inactiva'}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Desactívala en lugar de borrarla: así se conserva su historial de reportes.
                      </Typography>
                    </>
                  )}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  La sucursal se agregará como activa. Al guardarla podrás registrar sus sistemas.
                </Typography>
              )}
            </Box>
            <Divider />
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                px: 2,
                py: 1.5,
                bgcolor: 'background.default',
              }}
            >
              <Link component={RouterLink} to={cancelTo} sx={{ fontSize: 13 }}>
                Cancelar
              </Link>
              <Button
                type="submit"
                variant="contained"
                loading={formLoading}
                disabled={loadingRecord}
              >
                {isEdit ? 'Guardar cambios' : 'Agregar sucursal'}
              </Button>
            </Box>
          </Postbox>
        </Grid>
      </Grid>
    </Box>
  );
}
