import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import panelPhoto from '@nimzo/brand/images/login-panel.webp';
import iconColor from '@nimzo/brand/logos/icon-color.webp';
import logoColor from '@nimzo/brand/logos/logo-horizontal-color.webp';
import logoWhite from '@nimzo/brand/logos/logo-horizontal-white.webp';
import { useInvalidateAuthStore } from '@refinedev/core';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';

import { Turnstile } from '@/components/turnstile';
import { authProvider } from '@/providers/auth-provider';
import { tokens } from '@/theme';

const OVERLAP = 96;

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

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
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('Ingresa tu correo y tu contraseña.');
      return;
    }
    if (!captchaToken) {
      setError('Completa la verificación de seguridad.');
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await authProvider.login({ email: email.trim(), password, captchaToken });
    setSubmitting(false);

    if (!result.success) {
      setCaptchaReset((value) => value + 1);
      setError(result.error?.message ?? 'No se pudo iniciar sesión.');
      return;
    }
    await invalidateAuthStore();
    navigate(result.redirectTo ?? '/', { replace: true });
  }

  return (
    <Box
      component="main"
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
                        className="touch-target"
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
            {TURNSTILE_SITE_KEY ? (
              <Turnstile
                siteKey={TURNSTILE_SITE_KEY}
                resetKey={captchaReset}
                onToken={setCaptchaToken}
              />
            ) : (
              <Alert severity="error">
                Falta configurar la verificación de seguridad (VITE_TURNSTILE_SITE_KEY).
              </Alert>
            )}
            <Box sx={{ pt: 1.5 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                loading={submitting}
                disabled={!captchaToken}
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
          backgroundImage: `linear-gradient(150deg, ${alpha(tokens.tealDark, 0.9)} 0%, ${alpha(tokens.tealDark, 0.9)} 60%, ${alpha(tokens.tealStrong, 0.9)} 100%), url(${panelPhoto})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: tokens.white,
          pl: `${OVERLAP + 64}px`,
          pr: { md: 6, lg: 10 },
        }}
      >
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
              fontWeight: 700,
              fontSize: { md: 32, lg: 44 },
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
            }}
          >
            Inspección, prueba y mantenimiento de sistemas contra incendio.
          </Typography>
          <Typography sx={{ mt: 2.5, fontSize: 17 }}>
            Administra clientes, sucursales, usuarios y reportes desde un solo lugar.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
