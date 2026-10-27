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
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  formTitle,
  serviceFormSchema,
  type ServiceForm,
  type ServiceFormInput,
} from '@nimzo/shared';
import type { HttpError } from '@refinedev/core';
import { useForm } from '@refinedev/react-hook-form';
import { Controller, useWatch } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router';

import { Postbox } from '@/components/postbox';
import { removeFormIcon } from '@/lib/form-icons';
import { ADMIN_BAR_HEIGHT } from '@/theme';

import { CardPreview } from './card-preview';
import { IconBox } from './icon-box';

const emptyForm: ServiceFormInput = {
  code: '',
  name: '',
  subtitle: '',
  icon_path: null,
  is_active: true,
};

type ServiceFormFormProps = { action: 'create' | 'edit'; id?: string };

export function ServiceFormForm({ action, id }: ServiceFormFormProps) {
  const isEdit = action === 'edit';
  const navigate = useNavigate();
  const {
    control,
    handleSubmit,
    setError,
    refineCore: { onFinish, formLoading, query },
  } = useForm<ServiceForm, HttpError, ServiceFormInput>({
    refineCoreProps: {
      resource: 'service_forms',
      action,
      id,
      redirect: false,
      successNotification: (response) => ({
        type: 'success',
        message: isEdit ? 'Formato guardado' : 'Formato agregado',
        description: response?.data ? formTitle(response.data) : undefined,
      }),
      errorNotification: (error) =>
        error?.message?.includes('duplicate') || error?.message?.includes('unique')
          ? false
          : {
              type: 'error',
              message: 'No se pudo guardar el formato',
              description: error?.message,
            },
      onMutationSuccess: ({ data }) => {
        if (!isEdit) navigate(`/forms/${data.id}/edit`);
      },
    },
    resolver: zodResolver(serviceFormSchema),
    defaultValues: emptyForm,
  });

  const [name, subtitle, iconPath] = useWatch({
    control,
    name: ['name', 'subtitle', 'icon_path'],
  });
  const savedIconPath = query?.data?.data.icon_path ?? null;
  const loadingRecord = isEdit && query?.isLoading;

  async function submit(values: ServiceFormInput) {
    try {
      await onFinish(values);
      if (savedIconPath && savedIconPath !== values.icon_path) void removeFormIcon(savedIconPath);
    } catch (error) {
      const message = (error as HttpError)?.message ?? '';
      if (message.includes('duplicate') || message.includes('unique')) {
        setError('code', { message: 'Ya existe un formato con esta clave.' });
      }
    }
  }

  if (query?.isError) {
    return (
      <Alert severity="error">
        No se pudo cargar el formato. Recarga la página para intentar de nuevo.
      </Alert>
    );
  }

  return (
    <Box component="form" noValidate onSubmit={handleSubmit(submit)}>
      <Grid container spacing={2.5} sx={{ alignItems: 'flex-start' }}>
        <Grid size={{ xs: 12, lg: 8, xl: 9 }}>
          <Stack spacing={2.5}>
            <Postbox title="Datos del formato">
              {loadingRecord ? (
                <>
                  <Skeleton height={48} />
                  <Skeleton height={48} />
                </>
              ) : (
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <Controller
                      control={control}
                      name="name"
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          label="Nombre"
                          required
                          autoFocus={!isEdit}
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message ?? 'Ej. Servicio rociadores'}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={12}>
                    <Controller
                      control={control}
                      name="subtitle"
                      render={({ field }) => (
                        <TextField
                          {...field}
                          value={field.value ?? ''}
                          label="Subtítulo (opcional)"
                          helperText="La frecuencia o el tipo de prueba. Ej. Mensual, Prueba hidrostática"
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 7 }}>
                    <Controller
                      control={control}
                      name="code"
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          label="Clave interna"
                          required
                          disabled={isEdit}
                          error={!!fieldState.error}
                          helperText={
                            fieldState.error?.message ??
                            (isEdit
                              ? 'La clave no cambia: los reportes la usan para identificar el formato. No se muestra en la app.'
                              : 'Igual al nombre del archivo de su definición, por ejemplo smoke_detectors_annual. No se muestra en la app y no se podrá cambiar después.')
                          }
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              )}
            </Postbox>

            <CardPreview name={name} subtitle={subtitle} iconPath={iconPath} />
          </Stack>
        </Grid>

        <Grid
          size={{ xs: 12, lg: 4, xl: 3 }}
          sx={{ position: { lg: 'sticky' }, top: { lg: ADMIN_BAR_HEIGHT + 20 } }}
        >
          <Stack spacing={2.5}>
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
                          label={field.value ? 'Formato activo' : 'Formato inactivo'}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Los inactivos no aparecen en la app, pero se conservan sus reportes.
                        </Typography>
                      </>
                    )}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    El formato se agregará activo y aparecerá en la app en la siguiente
                    sincronización.
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
                  to="/forms"
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
                  {isEdit ? 'Guardar cambios' : 'Agregar formato'}
                </Button>
              </Box>
            </Postbox>

            <Controller
              control={control}
              name="icon_path"
              render={({ field }) => (
                <IconBox value={field.value} onChange={field.onChange} disabled={loadingRecord} />
              )}
            />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
