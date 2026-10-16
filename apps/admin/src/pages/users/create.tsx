import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { userCreateSchema, type UserCreateInput, type UserCreateValues } from '@nimzo/shared';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { PageHeader } from '@/components/page-header';
import { Postbox } from '@/components/postbox';
import { ADMIN_BAR_HEIGHT } from '@/theme';

import { CredentialsDialog } from './credentials-dialog';
import { PasswordInput } from './password-input';
import { RoleField } from './role-field';
import { useAdminUsers } from './use-admin-users';

const emptyUser: UserCreateInput = {
  full_name: '',
  email: '',
  role: 'technician',
  password: '',
};

export function UserCreate() {
  const navigate = useNavigate();
  const { run, pending } = useAdminUsers();
  const [created, setCreated] = useState<(UserCreateValues & { id: string }) | null>(null);
  const { control, handleSubmit, reset } = useForm<UserCreateInput, unknown, UserCreateValues>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: emptyUser,
  });

  async function submit(values: UserCreateValues) {
    try {
      const result = await run({ action: 'create', ...values });
      setCreated({ ...values, id: result.id });
    } catch {
      return;
    }
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'Usuarios', to: '/users' }, { label: 'Agregar usuario' }]} />
      <PageHeader title="Agregar usuario" />

      <Box component="form" noValidate onSubmit={handleSubmit(submit)}>
        <Grid container spacing={2.5} sx={{ alignItems: 'flex-start' }}>
          <Grid size={{ xs: 12, lg: 8, xl: 9 }}>
            <Stack spacing={2.5}>
              <Postbox title="Datos de la cuenta">
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <Controller
                      control={control}
                      name="full_name"
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          label="Nombre completo"
                          required
                          autoFocus
                          autoComplete="off"
                          error={!!fieldState.error}
                          helperText={
                            fieldState.error?.message ?? 'Así aparecerá en los reportes y firmas.'
                          }
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={12}>
                    <Controller
                      control={control}
                      name="email"
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          label="Correo"
                          type="email"
                          required
                          autoComplete="off"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message ?? 'Con este correo inicia sesión.'}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Postbox>

              <Postbox title="Rol">
                <Controller
                  control={control}
                  name="role"
                  render={({ field, fieldState }) => (
                    <RoleField
                      value={field.value}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </Postbox>

              <Postbox title="Contraseña temporal">
                <Controller
                  control={control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <PasswordInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      label="Contraseña"
                      required
                      error={!!fieldState.error}
                      helperText={
                        fieldState.error?.message ??
                        'Mínimo 8 caracteres. Usa «Generar» para crear una segura y entrégala a la persona.'
                      }
                    />
                  )}
                />
              </Postbox>
            </Stack>
          </Grid>

          <Grid
            size={{ xs: 12, lg: 4, xl: 3 }}
            sx={{ position: { lg: 'sticky' }, top: { lg: ADMIN_BAR_HEIGHT + 20 } }}
          >
            <Postbox title="Agregar" flush>
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  La cuenta se crea activa. Al guardarla verás los datos de acceso para entregarlos.
                </Typography>
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
                  to="/users"
                  className="touch-target"
                  sx={{ fontSize: 13 }}
                >
                  Cancelar
                </Link>
                <Button type="submit" variant="contained" loading={pending}>
                  Agregar usuario
                </Button>
              </Box>
            </Postbox>
          </Grid>
        </Grid>
      </Box>

      {created && (
        <CredentialsDialog
          open
          title="Cuenta creada"
          intro={`Entrega estos datos a ${created.full_name}. Con ellos entra a ${
            created.role === 'admin' ? 'el panel web' : 'la app móvil'
          }.`}
          email={created.email}
          password={created.password}
          actions={
            <>
              <Button
                onClick={() => {
                  setCreated(null);
                  reset(emptyUser);
                }}
              >
                Agregar otro usuario
              </Button>
              <Button variant="contained" onClick={() => navigate(`/users/${created.id}/edit`)}>
                Ir al usuario
              </Button>
            </>
          }
        />
      )}
    </>
  );
}
