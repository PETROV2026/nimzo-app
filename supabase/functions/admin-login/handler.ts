export type SignInResult =
  | { ok: true; userId: string; accessToken: string; refreshToken: string }
  | { ok: false; code: 'invalid_credentials' | 'user_banned' | 'unknown' };

export type LoginBackend = {
  verifyCaptcha(token: string, ip: string | null): Promise<boolean>;
  signIn(email: string, password: string): Promise<SignInResult>;
  isActiveAdmin(userId: string): Promise<boolean>;
  revokeSession(accessToken: string): Promise<void>;
};

const NO_ACCESS_MESSAGE = 'Tu cuenta no tiene acceso al panel de administración.';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function clientIp(request: Request) {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    null
  );
}

export function createHandler(backend: LoginBackend) {
  return async function handle(request: Request): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
    if (request.method !== 'POST') return json(405, { error: 'Método no permitido.' });

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return json(400, { error: 'La solicitud no es válida.' });
    }

    const { email, password, captcha_token: captchaToken } = body;
    if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
      return json(400, { error: 'Ingresa tu correo y tu contraseña.' });
    }
    if (typeof captchaToken !== 'string' || !captchaToken) {
      return json(400, { error: 'Completa la verificación de seguridad.' });
    }

    try {
      if (!(await backend.verifyCaptcha(captchaToken, clientIp(request)))) {
        return json(400, { error: 'La verificación de seguridad falló. Intenta de nuevo.' });
      }

      const result = await backend.signIn(email.trim().toLowerCase(), password);
      if (!result.ok) {
        if (result.code === 'invalid_credentials') {
          return json(400, { error: 'El correo o la contraseña no son correctos.' });
        }
        if (result.code === 'user_banned') return json(403, { error: NO_ACCESS_MESSAGE });
        return json(500, { error: 'No se pudo iniciar sesión. Intenta de nuevo.' });
      }

      if (!(await backend.isActiveAdmin(result.userId))) {
        await backend.revokeSession(result.accessToken);
        return json(403, { error: NO_ACCESS_MESSAGE });
      }

      return json(200, { access_token: result.accessToken, refresh_token: result.refreshToken });
    } catch (error) {
      console.error(error);
      return json(500, { error: 'No se pudo iniciar sesión. Intenta de nuevo.' });
    }
  };
}
