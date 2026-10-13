import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LoadingButton from '@mui/lab/LoadingButton';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import iconWhite from '@nimzo/brand/logos/icon-white.webp';
import logoColor from '@nimzo/brand/logos/logo-horizontal-color.webp';
import logoStackedWhite from '@nimzo/brand/logos/logo-stacked-white.webp';
import { useInvalidateAuthStore } from '@refinedev/core';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';

import { authProvider } from '@/providers/auth-provider';
import { tokens } from '@/theme';

export function LoginPage() {
  const navigate = useNavigate();
  const invalidateAuthStore = useInvalidateAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('Ingresa tu correo y tu contraseña.');
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await authProvider.login({ email: email.trim(), password });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error?.message ?? 'No se pudo iniciar sesión.');
      return;
    }
    await invalidateAuthStore();
    navigate(result.redirectTo ?? '/', { replace: true });
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '5fr 6fr' },
        bgcolor: 'background.default',
      }}
    >
      {/* Brand panel: the only dark surface in the admin panel (see DESIGN_admin.md). */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          position: 'relative',
          overflow: 'hidden',
          bgcolor: tokens.gray,
          color: 'common.white',
          m: 1.5,
          borderRadius: '24px',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 6,
        }}
      >
        <Box
          component="img"
          src={logoStackedWhite}
          alt="Nimzo"
          sx={{ width: 168, height: 'auto' }}
        />
        <Box
          component="img"
          src={iconWhite}
          alt=""
          aria-hidden
          sx={{
            position: 'absolute',
            right: '-18%',
            bottom: '-14%',
            width: '78%',
            opacity: 0.07,
            pointerEvents: 'none',
          }}
        />
        <Box sx={{ position: 'relative', maxWidth: 420 }}>
          <Typography variant="h2" component="p" sx={{ mb: 2 }}>
            Inspección, prueba y mantenimiento de sistemas contra incendio.
          </Typography>
          <Typography sx={{ color: alpha(tokens.white, 0.75) }}>
            Administra clientes, sucursales, usuarios y reportes desde un solo lugar.
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 6 },
        }}
      >
        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit}
          sx={{ width: '100%', maxWidth: 400 }}
        >
          <Box
            component="img"
            src={logoColor}
            alt="Nimzo"
            sx={{ display: { xs: 'block', md: 'none' }, height: 48, mb: 5 }}
          />
          <Typography variant="h2" component="h1" gutterBottom>
            Inicia sesión
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Panel de administración de Nimzo
          </Typography>

          <Stack spacing={2.5}>
            {error && (
              <Alert severity="error" role="alert">
                {error}
              </Alert>
            )}
            <TextField
              label="Correo electrónico"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={submitting}
            />
            <TextField
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={submitting}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        onClick={() => setShowPassword((value) => !value)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <LoadingButton
              type="submit"
              variant="contained"
              size="large"
              loading={submitting}
              fullWidth
            >
              Iniciar sesión
            </LoadingButton>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
            ¿No tienes acceso? Pide a un administrador que cree tu cuenta.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
