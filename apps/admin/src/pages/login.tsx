import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import iconColor from '@nimzo/brand/logos/icon-color.webp';
import iconWhite from '@nimzo/brand/logos/icon-white.webp';
import logoColor from '@nimzo/brand/logos/logo-horizontal-color.webp';
import logoWhite from '@nimzo/brand/logos/logo-horizontal-white.webp';
import { useInvalidateAuthStore } from '@refinedev/core';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';

import { authProvider } from '@/providers/auth-provider';
import { displayFont, tokens } from '@/theme';

const OVERLAP = 96;

function LabeledField({ id, label, ...props }: TextFieldProps & { id: string; label: string }) {
  return (
    <Box>
      <Typography
        component="label"
        htmlFor={id}
        sx={{ display: 'block', fontWeight: 500, mb: 0.75 }}
      >
        {label}
      </Typography>
      <TextField
        id={id}
        size="medium"
        {...props}
        sx={{
          '& .MuiOutlinedInput-root': { bgcolor: tokens.canvas, borderRadius: 1.5 },
          '& .MuiOutlinedInput-input': { py: 1.75 },
          '& .MuiOutlinedInput-input::placeholder': { color: tokens.muted, opacity: 1 },
          ...props.sx,
        }}
      />
    </Box>
  );
}

function Watermark({ src, sx }: { src: string; sx: object }) {
  return (
    <Box
      component="img"
      src={src}
      alt=""
      aria-hidden
      sx={{ position: 'absolute', pointerEvents: 'none', userSelect: 'none', ...sx }}
    />
  );
}

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
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
        bgcolor: tokens.white,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
      }}
    >
      <Watermark src={iconColor} sx={{ left: -70, bottom: -90, width: 300, opacity: 0.07 }} />

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: { xs: 'center', md: 'flex-end' },
          px: { xs: 2, sm: 4 },
          py: 4,
          mr: { md: `-${OVERLAP}px` },
        }}
      >
        <Paper
          component="form"
          noValidate
          onSubmit={handleSubmit}
          sx={{
            position: 'relative',
            overflow: 'hidden',
            width: '100%',
            maxWidth: 520,
            borderRadius: 4,
            px: { xs: 3, sm: 7 },
            py: { xs: 5, sm: 7 },
            boxShadow: '0 24px 60px rgba(52, 48, 53, 0.14), 0 2px 8px rgba(52, 48, 53, 0.06)',
          }}
        >
          <Watermark src={iconColor} sx={{ right: -48, top: -56, width: 170, opacity: 0.08 }} />

          <Box
            component="img"
            src={logoColor}
            alt="Nimzo"
            sx={{ position: 'relative', height: 52, mb: 6 }}
          />

          <Typography
            variant="h1"
            sx={{ position: 'relative', fontSize: 28, fontWeight: 600, mb: 1 }}
          >
            Qué bueno verte de nuevo
          </Typography>
          <Typography color="text.secondary" sx={{ position: 'relative', mb: 4 }}>
            Inicia sesión en el panel de administración.
          </Typography>

          <Stack spacing={2.5} sx={{ position: 'relative' }}>
            {error && (
              <Alert severity="error" role="alert">
                {error}
              </Alert>
            )}
            <LabeledField
              id="login-email"
              label="Correo electrónico"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="nombre@empresa.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={submitting}
            />
            <LabeledField
              id="login-password"
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Escribe tu contraseña"
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
            <Box sx={{ pt: 1.5 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                loading={submitting}
                fullWidth
                sx={{ minHeight: 52, fontSize: 16, borderRadius: 1.5 }}
              >
                Iniciar sesión
              </Button>
            </Box>
          </Stack>

          <Typography
            color="text.secondary"
            sx={{ position: 'relative', mt: 4, textAlign: 'center' }}
          >
            ¿No tienes acceso? Pide a un administrador que cree tu cuenta.
          </Typography>
        </Paper>
      </Box>

      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          position: 'relative',
          overflow: 'hidden',
          flexDirection: 'column',
          justifyContent: 'center',
          m: 3,
          ml: 0,
          borderRadius: '48px',
          bgcolor: tokens.tealStrong,
          color: tokens.white,
          pl: `${OVERLAP + 64}px`,
          pr: { md: 6, lg: 10 },
        }}
      >
        <Watermark
          src={iconWhite}
          sx={{ right: '-12%', bottom: '-18%', height: '85%', opacity: 0.09 }}
        />
        <Box
          component="img"
          src={logoWhite}
          alt=""
          aria-hidden
          sx={{ position: 'absolute', top: 48, right: 56, height: 48, opacity: 0.35 }}
        />
        <Box sx={{ position: 'relative', maxWidth: 520 }}>
          <Typography
            component="p"
            sx={{
              fontFamily: displayFont,
              fontWeight: 600,
              fontSize: { md: 38, lg: 52 },
              lineHeight: 1.05,
            }}
          >
            Inspección, prueba y mantenimiento de sistemas contra incendio.
          </Typography>
          <Typography sx={{ mt: 2.5, fontSize: 17, color: 'rgba(255,255,255,0.88)' }}>
            Administra clientes, sucursales, usuarios y reportes desde un solo lugar.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
