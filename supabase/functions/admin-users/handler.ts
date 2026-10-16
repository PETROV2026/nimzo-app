export type Role = 'technician' | 'supervisor' | 'admin';

export type ProfileSummary = { role: Role; is_active: boolean };

export type UsersBackend = {
  getCallerId(token: string): Promise<string | null>;
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

const roles: Role[] = ['technician', 'supervisor', 'admin'];

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

export function createHandler(backend: UsersBackend) {
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
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
    if (request.method !== 'POST') return json(405, { error: 'Método no permitido.' });

    try {
      const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
      const callerId = token ? await backend.getCallerId(token) : null;
      if (!callerId) throw new UserError(401, 'Tu sesión expiró. Vuelve a iniciar sesión.');

      const caller = await backend.getProfile(callerId);
      if (!caller || caller.role !== 'admin' || !caller.is_active) {
        throw new UserError(403, 'Solo un administrador activo puede administrar usuarios.');
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
          return json(201, { id: created.id });
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
          return json(200, { id });
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
          return json(200, { id, active: body.active });
        }

        case 'reset_password': {
          const id = userId(body.user_id);
          const newPassword = password(body.password);
          await requireTarget(id);
          await backend.updatePassword(id, newPassword);
          return json(200, { id });
        }

        default:
          throw new UserError(400, 'Acción desconocida.');
      }
    } catch (error) {
      if (error instanceof UserError) return json(error.status, { error: error.message });
      console.error(error);
      return json(500, { error: 'No se pudo completar la acción. Intenta de nuevo.' });
    }
  };
}
