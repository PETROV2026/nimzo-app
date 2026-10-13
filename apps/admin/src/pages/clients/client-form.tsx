import { zodResolver } from '@hookform/resolvers/zod';
import LoadingButton from '@mui/lab/LoadingButton';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid2';
import Skeleton from '@mui/material/Skeleton';
import Switch from '@mui/material/Switch';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { clientFormSchema, type Client, type ClientFormInput } from '@nimzo/shared';
import type { HttpError } from '@refinedev/core';
import { useForm } from '@refinedev/react-hook-form';
import type { ReactNode } from 'react';
import { Controller, type Control, type FieldPath } from 'react-hook-form';
import { Link } from 'react-router';

const emptyClient: ClientFormInput = {
  name: '',
  tax_id: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  notes: '',
  is_active: true,
};

type FieldProps = Omit<TextFieldProps, 'name'> & {
  control: Control<ClientFormInput>;
  name: Exclude<FieldPath<ClientFormInput>, 'is_active'>;
};

/** MUI TextField wired to react-hook-form. Database nulls are shown as empty inputs. */
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

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Grid container spacing={{ xs: 2, md: 4 }} sx={{ p: { xs: 3, md: 4 } }}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {description}
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 8 }} container spacing={2.5}>
        {children}
      </Grid>
    </Grid>
  );
}

type ClientFormProps = { action: 'create' | 'edit'; id?: string };

export function ClientForm({ action, id }: ClientFormProps) {
  const {
    control,
    handleSubmit,
    refineCore: { onFinish, formLoading, query },
  } = useForm<Client, HttpError, ClientFormInput>({
    refineCoreProps: { resource: 'clients', action, id, redirect: 'list' },
    resolver: zodResolver(clientFormSchema),
    defaultValues: emptyClient,
  });

  const loadingRecord = action === 'edit' && query?.isLoading;
  const isEdit = action === 'edit';

  if (query?.isError) {
    return (
      <Alert severity="error">
        No se pudo cargar el cliente. Recarga la página para intentar de nuevo.
      </Alert>
    );
  }

  return (
    <Card component="form" noValidate onSubmit={handleSubmit((values) => onFinish(values))}>
      {loadingRecord ? (
        <Box sx={{ p: 4 }}>
          <Skeleton height={56} />
          <Skeleton height={56} />
          <Skeleton height={56} />
        </Box>
      ) : (
        <>
          <Section
            title="Datos del cliente"
            description="Nombre con el que aparecerá en los reportes."
          >
            <Grid size={{ xs: 12 }}>
              <FormTextField
                control={control}
                name="name"
                label="Nombre o razón social"
                required
                autoFocus
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField
                control={control}
                name="tax_id"
                label="RFC"
                helperText="Opcional. 12 caracteres para empresas, 13 para personas."
                slotProps={{ htmlInput: { style: { textTransform: 'uppercase' } } }}
              />
            </Grid>
          </Section>

          <Divider />

          <Section title="Contacto" description="Persona con la que se coordinan las visitas.">
            <Grid size={{ xs: 12 }}>
              <FormTextField control={control} name="contact_name" label="Nombre del contacto" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField control={control} name="contact_email" label="Correo" type="email" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField control={control} name="contact_phone" label="Teléfono" type="tel" />
            </Grid>
          </Section>

          <Divider />

          <Section
            title="Notas"
            description="Información útil para el equipo, por ejemplo horarios de acceso."
          >
            <Grid size={{ xs: 12 }}>
              <FormTextField control={control} name="notes" label="Notas" multiline minRows={3} />
            </Grid>
          </Section>

          {isEdit && (
            <>
              <Divider />
              <Section
                title="Estado"
                description="Desactiva al cliente en lugar de borrarlo: así se conserva su historial de reportes."
              >
                <Grid size={{ xs: 12 }}>
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
                        label={field.value ? 'Cliente activo' : 'Cliente inactivo'}
                      />
                    )}
                  />
                </Grid>
              </Section>
            </>
          )}
        </>
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1.5,
          px: { xs: 3, md: 4 },
          py: 2.5,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Button component={Link} to="/clients" variant="outlined">
          Cancelar
        </Button>
        <LoadingButton
          type="submit"
          variant="contained"
          loading={formLoading}
          disabled={loadingRecord}
        >
          {isEdit ? 'Guardar cambios' : 'Agregar cliente'}
        </LoadingButton>
      </Box>
    </Card>
  );
}
