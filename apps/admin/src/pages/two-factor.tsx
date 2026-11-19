import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import logoColor from '@nimzo/brand/logos/logo-horizontal-color.webp';
import { useInvalidateAuthStore, useLogout } from '@refinedev/core';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';

import { supabase } from '@/lib/supabase';
import { tokens } from '@/theme';

type Step =
  | { kind: 'loading' }
  | { kind: 'enroll'; factorId: string; qrCode: string; secret: string }
  | { kind: 'verify'; factorId: string }
  | { kind: 'failed'; message: string };

const FRIENDLY_NAME = 'Nimzo';

async function prepareStep(): Promise<Step> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session)
    return { kind: 'failed', message: 'Tu sesión expiró. Vuelve a iniciar sesión.' };

  const { data: factors, error } = await supabase.auth.mfa.listFactors();
  if (error) return { kind: 'failed', message: 'No se pudo revisar tu verificación en dos pasos.' };

  const verified = factors.totp.find((factor) => factor.status === 'verified');
  if (verified) return { kind: 'verify', factorId: verified.id };

  for (const factor of factors.all) {
    if (factor.factor_type === 'totp' && factor.status === 'unverified') {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }

  const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: FRIENDLY_NAME,
  });
  if (enrollError) {
    return { kind: 'failed', message: 'No se pudo preparar la verificación en dos pasos.' };
  }
  return {
    kind: 'enroll',
    factorId: enrolled.id,
    qrCode: enrolled.totp.qr_code,
    secret: enrolled.totp.secret,
  };
}

export function TwoFactorPage() {
  const navigate = useNavigate();
  const invalidateAuthStore = useInvalidateAuthStore();
  const { mutate: logout } = useLogout();
  const [step, setStep] = useState<Step>({ kind: 'loading' });
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void prepareStep().then(setStep);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step.kind !== 'enroll' && step.kind !== 'verify') return;
    const digits = code.replace(/\s/g, '');
    if (!/^\d{6}$/.test(digits)) {
      setError('Escribe los 6 dígitos que muestra tu app de autenticación.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: step.factorId,
      code: digits,
    });
    if (verifyError) {
      setSubmitting(false);
      setCode('');
      setError('El código no es correcto o ya cambió. Escribe el que muestra tu app ahora.');
      return;
    }
    await invalidateAuthStore();
    navigate('/', { replace: true });
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: tokens.canvas,
        p: 3,
      }}
    >
      <Paper
        component="main"
        elevation={0}
        sx={{ width: '100%', maxWidth: 480, p: { xs: 3, sm: 5 }, borderRadius: 3 }}
      >
        <Box component="img" src={logoColor} alt="Nimzo" sx={{ height: 36, mb: 4 }} />
        <Typography component="h1" variant="h5" sx={{ fontWeight: 700 }}>
          Verificación en dos pasos
        </Typography>

        {step.kind === 'loading' && (
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mt: 3 }} role="status">
            <CircularProgress size={24} />
            <Typography color="text.secondary">Preparando la verificación…</Typography>
          </Stack>
        )}

        {step.kind === 'failed' && (
          <Stack spacing={3} sx={{ mt: 3 }}>
            <Alert severity="error">{step.message}</Alert>
            <Button variant="contained" size="large" onClick={() => logout()}>
              Volver a iniciar sesión
            </Button>
          </Stack>
        )}

        {(step.kind === 'enroll' || step.kind === 'verify') && (
          <Stack component="form" noValidate spacing={3} sx={{ mt: 2 }} onSubmit={handleSubmit}>
            {step.kind === 'enroll' ? (
              <>
                <Typography color="text.secondary">
                  Para proteger el panel, cada administrador confirma su identidad con un código de
                  su teléfono. Escanea este código QR con una app de autenticación, como Google
                  Authenticator o Microsoft Authenticator, y escribe el código de 6 dígitos que
                  aparece.
                </Typography>
                <Box
                  component="img"
                  src={step.qrCode}
                  alt="Código QR para tu app de autenticación"
                  sx={{
                    width: 200,
                    height: 200,
                    alignSelf: 'center',
                    p: 1,
                    bgcolor: tokens.white,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  ¿No puedes escanearlo? Escribe esta clave en la app:{' '}
                  <Box
                    component="span"
                    sx={{ fontFamily: 'monospace', wordBreak: 'break-all', color: 'text.primary' }}
                  >
                    {step.secret}
                  </Box>
                </Typography>
              </>
            ) : (
              <Typography color="text.secondary">
                Abre tu app de autenticación y escribe el código de 6 dígitos de Nimzo.
              </Typography>
            )}

            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Código de 6 dígitos"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              disabled={submitting}
              autoFocus
              required
              autoComplete="one-time-code"
              slotProps={{
                htmlInput: { inputMode: 'numeric', maxLength: 7 },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              loading={submitting}
              sx={{ minHeight: 52, fontSize: 16 }}
            >
              Verificar
            </Button>
            <Button variant="text" onClick={() => logout()} disabled={submitting}>
              Cerrar sesión
            </Button>
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
