import { createCors, type CorsOptions } from '../_shared/cors.ts';

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

function json(status: number, body: unknown, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

function clientIp(request: Request) {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    null
  );
}

export function createHandler(backend: LoginBackend, options: CorsOptions = {}) {
  const cors = createCors(options);

  return async function handle(request: Request): Promise<Response> {
    const headers = cors.headersFor(request);
    const reply = (status: number, body: unknown) => json(status, body, headers);
    if (cors.rejects(request)) return reply(403, { error: 'Origen no permitido.' });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return reply(405, { error: 'Método no permitido.' });

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return reply(400, { error: 'La solicitud no es válida.' });
    }

    const { email, password, captcha_token: captchaToken } = body;
    if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
      return reply(400, { error: 'Ingresa tu correo y tu contraseña.' });
    }
    if (typeof captchaToken !== 'string' || !captchaToken) {
      return reply(400, { error: 'Completa la verificación de seguridad.' });
    }

    try {
      if (!(await backend.verifyCaptcha(captchaToken, clientIp(request)))) {
        return reply(400, { error: 'La verificación de seguridad falló. Intenta de nuevo.' });
      }

      const result = await backend.signIn(email.trim().toLowerCase(), password);
      if (!result.ok) {
        if (result.code === 'invalid_credentials') {
          return reply(400, { error: 'El correo o la contraseña no son correctos.' });
        }
        if (result.code === 'user_banned') return reply(403, { error: NO_ACCESS_MESSAGE });
        return reply(500, { error: 'No se pudo iniciar sesión. Intenta de nuevo.' });
      }

      if (!(await backend.isActiveAdmin(result.userId))) {
        await backend.revokeSession(result.accessToken);
        return reply(403, { error: NO_ACCESS_MESSAGE });
      }

      return reply(200, { access_token: result.accessToken, refresh_token: result.refreshToken });
    } catch (error) {
      console.error(error);
      return reply(500, { error: 'No se pudo iniciar sesión. Intenta de nuevo.' });
    }
  };
}
