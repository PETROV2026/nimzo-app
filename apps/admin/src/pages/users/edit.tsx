import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  passwordResetSchema,
  userRoleLabels,
  userUpdateSchema,
  type PasswordResetInput,
  type Profile,
  type UserUpdateInput,
} from '@nimzo/shared';
import { useGetIdentity, useOne } from '@refinedev/core';
import { useEffect, useId, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link as RouterLink, useParams } from 'react-router';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { PageHeader } from '@/components/page-header';
import { Postbox } from '@/components/postbox';
import { StatusChip } from '@/components/status-chip';
import { generatePassword } from '@/lib/password';
import type { Identity } from '@/providers/auth-provider';
import { ADMIN_BAR_HEIGHT } from '@/theme';

import { CredentialsDialog } from './credentials-dialog';
import { PasswordInput } from './password-input';
import { RoleField } from './role-field';
import { formatLastSignIn } from './format';
import { useAdminUsers } from './use-admin-users';

function ResetPasswordDialog({ user, onClose }: { user: Profile; onClose: () => void }) {
  const titleId = useId();
  const { run, pending } = useAdminUsers();
  const [done, setDone] = useState<string | null>(null);
  const { control, handleSubmit } = useForm<PasswordResetInput>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { password: generatePassword() },
  });

  if (done) {
    return (
      <CredentialsDialog
        open
        title="Contraseña restablecida"
        intro={`Entrega la nueva contraseña a ${user.full_name || 'la persona'}. La anterior ya no funciona.`}
        email={user.email ?? ''}
        password={done}
        actions={
          <Button variant="contained" onClick={onClose}>
            Listo
          </Button>
        }
      />
    );
  }

  return (
    <Dialog
      open
      onClose={pending ? undefined : onClose}
      aria-labelledby={titleId}
      maxWidth="sm"
      fullWidth
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.stopPropagation();
          void handleSubmit(async ({ password }) => {
            try {
              await run({ action: 'reset_password', user_id: user.id, password });
              setDone(password);
            } catch {
              return;
            }
          })(event);
        }}
      >
        <DialogTitle id={titleId}>Restablecer contraseña</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Se reemplaza la contraseña de {user.full_name || user.email}. Ya viene una generada;
            puedes cambiarla.
          </Typography>
          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <PasswordInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
                label="Nueva contraseña"
                required
                autoFocus
                error={!!fieldState.error}
                helperText={fieldState.error?.message ?? 'Mínimo 8 caracteres.'}
              />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={pending}>
            Cambiar contraseña
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export function UserEdit() {
  const { id = '' } = useParams();
  const { data: identity } = useGetIdentity<Identity>();
  const { result: user, query } = useOne<Profile>({ resource: 'profiles', id });
  const { run, pending } = useAdminUsers();
  const [confirmActive, setConfirmActive] = useState(false);
  const [resetting, setResetting] = useState(false);
  const isSelf = identity?.id === id;

  const { control, handleSubmit, reset, formState } = useForm<UserUpdateInput>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: { full_name: '', role: 'technician' },
  });

  useEffect(() => {
    if (user) reset({ full_name: user.full_name, role: user.role });
  }, [user, reset]);

  async function save(values: UserUpdateInput) {
    if (!user) return;
    try {
      await run(
        {
          action: 'update',
          user_id: user.id,
          full_name: values.full_name.trim(),
          role: values.role,
        },
        { message: 'Usuario guardado', description: values.full_name.trim() },
      );
    } catch {
      return;
    }
  }

  async function toggleActive() {
    if (!user) return;
    try {
      await run(
        { action: 'set_active', user_id: user.id, active: !user.is_active },
        {
          message: user.is_active ? 'Cuenta desactivada' : 'Cuenta reactivada',
          description: user.full_name || user.email || undefined,
        },
      );
      setConfirmActive(false);
    } catch {
      return;
    }
  }

  const loading = query.isLoading;
  const crumbs = [
    { label: 'Usuarios', to: '/users' },
    { label: loading ? undefined : user?.full_name || user?.email || 'Usuario' },
  ];

  if (query.isError) {
    return (
      <Alert severity="error">
        No se pudo cargar el usuario. Recarga la página para intentar de nuevo.
      </Alert>
    );
  }

  return (
    <>
      <Breadcrumbs items={crumbs} />
      <PageHeader
        title="Editar usuario"
        action={
          <Button component={RouterLink} to="/users/create" variant="outlined" size="small">
            Agregar usuario
          </Button>
        }
      />

      <Box component="form" noValidate onSubmit={handleSubmit(save)}>
        <Grid container spacing={2.5} sx={{ alignItems: 'flex-start' }}>
          <Grid size={{ xs: 12, lg: 8, xl: 9 }}>
            <Stack spacing={2.5}>
              <Postbox title="Datos de la cuenta">
                {loading || !user ? (
                  <>
                    <Skeleton height={48} />
                    <Skeleton height={48} />
                  </>
                ) : (
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
                            error={!!fieldState.error}
                            helperText={
                              fieldState.error?.message ?? 'Así aparecerá en los reportes y firmas.'
                            }
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={12}>
                      <TextField
                        label="Correo"
                        value={user.email ?? ''}
                        disabled
                        helperText="Con este correo inicia sesión. Para cambiarlo, pide ayuda al líder de software."
                      />
                    </Grid>
                  </Grid>
                )}
              </Postbox>

              <Postbox title="Rol">
                {loading || !user ? (
                  <Skeleton height={120} />
                ) : (
                  <Controller
                    control={control}
                    name="role"
                    render={({ field, fieldState }) => (
                      <RoleField
                        value={field.value}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                        disabled={isSelf}
                        helperText={isSelf ? 'No puedes cambiar tu propio rol.' : undefined}
                      />
                    )}
                  />
                )}
              </Postbox>

              <Postbox title="Acceso">
                {loading || !user ? (
                  <Skeleton height={80} />
                ) : (
                  <Stack spacing={2} divider={<Divider />}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ flex: 1, minWidth: 220 }}>
                        <Typography sx={{ fontWeight: 500 }}>Contraseña</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Si la olvidó, genera una nueva y entrégasela.
                        </Typography>
                      </Box>
                      <Button variant="outlined" onClick={() => setResetting(true)}>
                        Restablecer contraseña
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ flex: 1, minWidth: 220 }}>
                        <Typography sx={{ fontWeight: 500 }}>
                          {user.is_active ? 'Desactivar cuenta' : 'Reactivar cuenta'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {isSelf
                            ? 'No puedes desactivar tu propia cuenta.'
                            : user.is_active
                              ? 'Ya no podrá iniciar sesión en la app ni en el panel. Sus reportes se conservan.'
                              : 'Volverá a poder iniciar sesión con su contraseña actual.'}
                        </Typography>
                      </Box>
                      {!isSelf && (
                        <Button
                          variant="outlined"
                          color={user.is_active ? 'error' : 'primary'}
                          onClick={() => (user.is_active ? setConfirmActive(true) : toggleActive())}
                          loading={pending && !confirmActive && !resetting}
                        >
                          {user.is_active ? 'Desactivar cuenta' : 'Reactivar cuenta'}
                        </Button>
                      )}
                    </Box>
                  </Stack>
                )}
              </Postbox>
            </Stack>
          </Grid>

          <Grid
            size={{ xs: 12, lg: 4, xl: 3 }}
            sx={{ position: { lg: 'sticky' }, top: { lg: ADMIN_BAR_HEIGHT + 20 } }}
          >
            <Postbox title="Guardar" flush>
              <Box sx={{ p: 2, display: 'grid', gap: 1 }}>
                {user && (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StatusChip active={user.is_active} />
                      <Typography variant="body2">{userRoleLabels[user.role]}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Último acceso: {formatLastSignIn(user.last_sign_in_at)}
                    </Typography>
                  </>
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
                  to="/users"
                  className="touch-target"
                  sx={{ fontSize: 13 }}
                >
                  Volver a usuarios
                </Link>
                <Button
                  type="submit"
                  variant="contained"
                  loading={pending && formState.isSubmitting}
                  disabled={loading || !formState.isDirty}
                >
                  Guardar cambios
                </Button>
              </Box>
            </Postbox>
          </Grid>
        </Grid>
      </Box>

      {user && (
        <ConfirmDialog
          open={confirmActive}
          title={`¿Desactivar a ${user.full_name || user.email}?`}
          confirmLabel="Desactivar cuenta"
          destructive
          loading={pending}
          onConfirm={toggleActive}
          onClose={() => setConfirmActive(false)}
        >
          No podrá iniciar sesión en la app ni en el panel, y se cerrará su acceso actual. Sus
          reportes se conservan y puedes reactivarla cuando quieras.
        </ConfirmDialog>
      )}

      {user && resetting && <ResetPasswordDialog user={user} onClose={() => setResetting(false)} />}
    </>
  );
}
