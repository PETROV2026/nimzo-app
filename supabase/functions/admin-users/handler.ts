import { createCors, type CorsOptions } from '../_shared/cors.ts';

export type Role = 'technician' | 'admin';

export type ProfileSummary = { role: Role; is_active: boolean };

export type UsersBackend = {
  getCaller(token: string): Promise<{ id: string; aal: string } | null>;
  getProfile(userId: string): Promise<ProfileSummary | null>;
  countActiveAdmins(): Promise<number>;
  createUser(input: { email: string; password: string; fullName: string; role: Role }): Promise<{ id: string }>;
  updateProfile(userId: string, input: { fullName: string; role: Role }): Promise<void>;
  setActive(userId: string, active: boolean): Promise<void>;
  updatePassword(userId: string, password: string): Promise<void>;
};

export class UserError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const roles: Role[] = ['technician', 'admin'];

function json(status: number, body: unknown, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

function text(value: unknown, message: string) {
  if (typeof value !== 'string' || value.trim() === '') throw new UserError(400, message);
  return value.trim();
}

function role(value: unknown) {
  if (!roles.includes(value as Role)) throw new UserError(400, 'Elige un rol válido.');
  return value as Role;
}

function password(value: unknown) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 72) {
    throw new UserError(400, 'La contraseña debe tener entre 8 y 72 caracteres.');
  }
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
    throw new UserError(400, 'La contraseña debe tener mayúsculas, minúsculas y números.');
  }
  return value;
}

function email(value: unknown) {
  const address = text(value, 'Ingresa el correo.').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) throw new UserError(400, 'Ingresa un correo válido.');
  return address;
}

function userId(value: unknown) {
  if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/i.test(value)) {
    throw new UserError(400, 'Falta el usuario.');
  }
  return value;
}

export function createHandler(backend: UsersBackend, options: CorsOptions = {}) {
  const cors = createCors(options);

  async function requireTarget(id: string) {
    const target = await backend.getProfile(id);
    if (!target) throw new UserError(404, 'No se encontró el usuario.');
    return target;
  }

  async function ensureAnotherActiveAdmin(target: ProfileSummary) {
    if (target.role === 'admin' && target.is_active && (await backend.countActiveAdmins()) <= 1) {
      throw new UserError(400, 'Debe quedar al menos un administrador activo.');
    }
  }

  return async function handle(request: Request): Promise<Response> {
    const headers = cors.headersFor(request);
    const reply = (status: number, body: unknown) => json(status, body, headers);
    if (cors.rejects(request)) return reply(403, { error: 'Origen no permitido.' });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return reply(405, { error: 'Método no permitido.' });

    try {
      const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
      const session = token ? await backend.getCaller(token) : null;
      if (!session) throw new UserError(401, 'Tu sesión expiró. Vuelve a iniciar sesión.');
      const callerId = session.id;

      const caller = await backend.getProfile(callerId);
      if (!caller || caller.role !== 'admin' || !caller.is_active) {
        throw new UserError(403, 'Solo un administrador activo puede administrar usuarios.');
      }
      if (session.aal !== 'aal2') {
        throw new UserError(
          403,
          'Verifica tu sesión con el código de tu app de autenticación para administrar usuarios.',
        );
      }

      let body: Record<string, unknown>;
      try {
        body = await request.json();
      } catch {
        throw new UserError(400, 'La solicitud no es válida.');
      }

      switch (body.action) {
        case 'create': {
          const created = await backend.createUser({
            fullName: text(body.full_name, 'Ingresa el nombre completo.'),
            email: email(body.email),
            role: role(body.role),
            password: password(body.password),
          });
          return reply(201, { id: created.id });
        }

        case 'update': {
          const id = userId(body.user_id);
          const fullName = text(body.full_name, 'Ingresa el nombre completo.');
          const newRole = role(body.role);
          const target = await requireTarget(id);
          if (target.role === 'admin' && newRole !== 'admin') {
            if (id === callerId) throw new UserError(400, 'No puedes quitarte el rol de administrador.');
            await ensureAnotherActiveAdmin(target);
          }
          await backend.updateProfile(id, { fullName, role: newRole });
          return reply(200, { id });
        }

        case 'set_active': {
          const id = userId(body.user_id);
          if (typeof body.active !== 'boolean') throw new UserError(400, 'La solicitud no es válida.');
          const target = await requireTarget(id);
          if (!body.active) {
            if (id === callerId) throw new UserError(400, 'No puedes desactivar tu propia cuenta.');
            await ensureAnotherActiveAdmin(target);
          }
          await backend.setActive(id, body.active);
          return reply(200, { id, active: body.active });
        }

        case 'reset_password': {
          const id = userId(body.user_id);
          const newPassword = password(body.password);
          await requireTarget(id);
          await backend.updatePassword(id, newPassword);
          return reply(200, { id });
        }

        default:
          throw new UserError(400, 'Acción desconocida.');
      }
    } catch (error) {
      if (error instanceof UserError) return reply(error.status, { error: error.message });
      console.error(error);
      return reply(500, { error: 'No se pudo completar la acción. Intenta de nuevo.' });
    }
  };
}
