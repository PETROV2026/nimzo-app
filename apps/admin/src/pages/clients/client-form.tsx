import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
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
  clientCreateSchema,
  clientFormSchema,
  type Client,
  type ClientFormInput,
} from '@nimzo/shared';
import type { HttpError } from '@refinedev/core';
import { useForm } from '@refinedev/react-hook-form';
import type { ReactNode } from 'react';
import { Controller, type Control, type FieldPath, type Resolver } from 'react-hook-form';
import { Link as RouterLink } from 'react-router';

import { Postbox } from '@/components/postbox';
import { TechnicianField } from '@/components/technician-field';
import { ADMIN_BAR_HEIGHT } from '@/theme';

type ClientVariables = ClientFormInput & { technician_id?: string };

type ClientRecord = Client & { technician: { full_name: string; email: string | null } | null };

const emptyClient: ClientVariables = {
  name: '',
  tax_id: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  notes: '',
  is_active: true,
};

type FieldProps = Omit<TextFieldProps, 'name'> & {
  control: Control<ClientVariables>;
  name: Exclude<FieldPath<ClientFormInput>, 'is_active'>;
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

type ClientFormProps = { action: 'create' | 'edit'; id?: string; children?: ReactNode };

export function ClientForm({ action, id, children }: ClientFormProps) {
  const isEdit = action === 'edit';
  const {
    control,
    handleSubmit,
    refineCore: { onFinish, formLoading, query },
  } = useForm<ClientRecord, HttpError, ClientVariables>({
    refineCoreProps: {
      resource: 'clients',
      action,
      id,
      redirect: isEdit ? 'list' : 'edit',
      meta: { select: '*, technician:profiles(full_name, email)' },
      successNotification: (response) => ({
        type: 'success',
        message: isEdit ? 'Cliente guardado' : 'Cliente agregado',
        description: response?.data.name,
      }),
    },
    resolver: (isEdit
      ? zodResolver(clientFormSchema)
      : zodResolver(clientCreateSchema)) as Resolver<ClientVariables>,
    defaultValues: emptyClient,
  });

  const loadingRecord = isEdit && query?.isLoading;

  if (query?.isError) {
    return (
      <Alert severity="error">
        No se pudo cargar el cliente. Recarga la página para intentar de nuevo.
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
            <Postbox title="Datos del cliente">
              {loadingRecord ? (
                fieldsSkeleton
              ) : (
                <Grid container spacing={2}>
                  <Grid size={12}>
                    {isEdit ? (
                      <Typography>
                        <Box component="span" sx={{ color: 'text.secondary' }}>
                          Técnico:{' '}
                        </Box>
                        {query?.data?.data.technician?.full_name ?? '—'}
                      </Typography>
                    ) : (
                      <Controller
                        control={control}
                        name="technician_id"
                        render={({ field, fieldState }) => (
                          <TechnicianField
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            inputRef={field.ref}
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                    )}
                  </Grid>
                  <Grid size={12}>
                    <FormTextField
                      control={control}
                      name="name"
                      label="Nombre o razón social"
                      required
                      helperText="Así aparecerá en los reportes."
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormTextField
                      control={control}
                      name="tax_id"
                      label="RFC (opcional)"
                      helperText="12 caracteres para empresas, 13 para personas. Ej. ABC010101AB1"
                      slotProps={{ htmlInput: { style: { textTransform: 'uppercase' } } }}
                    />
                  </Grid>
                </Grid>
              )}
            </Postbox>

            <Postbox title="Contacto">
              {loadingRecord ? (
                fieldsSkeleton
              ) : (
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <Typography variant="body2" color="text.secondary">
                      Persona con la que se coordinan las visitas. Todos los campos son opcionales.
                    </Typography>
                  </Grid>
                  <Grid size={12}>
                    <FormTextField
                      control={control}
                      name="contact_name"
                      label="Nombre del contacto"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormTextField
                      control={control}
                      name="contact_email"
                      label="Correo"
                      type="email"
                      autoComplete="off"
                    />
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

            <Postbox title="Notas" collapsible>
              {loadingRecord ? (
                fieldsSkeleton
              ) : (
                <FormTextField
                  control={control}
                  name="notes"
                  label="Notas (opcional)"
                  helperText="Información útil para el equipo, por ejemplo horarios de acceso."
                  multiline
                  minRows={3}
                />
              )}
            </Postbox>

            {children}
          </Stack>
        </Grid>

        <Grid
          size={{ xs: 12, lg: 4, xl: 3 }}
          sx={{ position: { lg: 'sticky' }, top: { lg: ADMIN_BAR_HEIGHT + 20 } }}
        >
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
                        label={field.value ? 'Cliente activo' : 'Cliente inactivo'}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Desactívalo en lugar de borrarlo: así se conserva su historial de reportes.
                      </Typography>
                    </>
                  )}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  El cliente se agregará como activo. Al guardarlo podrás registrar sus sucursales.
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
              <Link
                component={RouterLink}
                to="/clients"
                className="touch-target"
                sx={{ fontSize: 13 }}
              >
                Cancelar
              </Link>
              <Button
                type="submit"
                variant="contained"
                loading={formLoading}
                disabled={loadingRecord}
              >
                {isEdit ? 'Guardar cambios' : 'Agregar cliente'}
              </Button>
            </Box>
          </Postbox>
        </Grid>
      </Grid>
    </Box>
  );
}
