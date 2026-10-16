import { createClient } from 'jsr:@supabase/supabase-js@2';

import { createHandler, UserError, type Role, type UsersBackend } from './handler.ts';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BANNED_FOR = '876000h';

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

const backend: UsersBackend = {
  async getCallerId(token) {
    const { data, error } = await admin.auth.getUser(token);
    return error ? null : (data.user?.id ?? null);
  },

  async getProfile(userId) {
    const { data, error } = await admin
      .from('profiles')
      .select('role, is_active')
      .eq('id', userId)
      .maybeSingle();
    fail(error);
    return data as { role: Role; is_active: boolean } | null;
  },

  async countActiveAdmins() {
    const { count, error } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')
      .eq('is_active', true);
    fail(error);
    return count ?? 0;
  },

  async createUser({ email, password, fullName, role }) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
      app_metadata: { role },
    });
    if (error) {
      if (error.code === 'email_exists' || error.code === 'user_already_exists') {
        throw new UserError(409, 'Ya existe una cuenta con ese correo.');
      }
      if (error.code === 'weak_password') {
        throw new UserError(400, 'La contraseña es demasiado débil. Usa al menos 8 caracteres con letras y números.');
      }
      throw new Error(error.message);
    }
    return { id: data.user.id };
  },

  async updateProfile(userId, { fullName, role }) {
    const { error } = await admin.from('profiles').update({ full_name: fullName, role }).eq('id', userId);
    fail(error);
    const { error: authError } = await admin.auth.admin.updateUserById(userId, { app_metadata: { role } });
    fail(authError);
  },

  async setActive(userId, active) {
    const { error: authError } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: active ? 'none' : BANNED_FOR,
    });
    fail(authError);
    const { error } = await admin.from('profiles').update({ is_active: active }).eq('id', userId);
    fail(error);
  },

  async updatePassword(userId, password) {
    const { error } = await admin.auth.admin.updateUserById(userId, { password });
    if (error?.code === 'weak_password') {
      throw new UserError(400, 'La contraseña es demasiado débil. Usa al menos 8 caracteres con letras y números.');
    }
    fail(error);
  },
};

Deno.serve(createHandler(backend));
