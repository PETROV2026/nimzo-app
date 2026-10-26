import { createClient } from 'jsr:@supabase/supabase-js@2';

import { createHandler, type LoginBackend } from './handler.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, clientOptions);
const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY')!;

const backend: LoginBackend = {
  async verifyCaptcha(token, ip) {
    const form = new FormData();
    form.append('secret', turnstileSecret);
    form.append('response', token);
    if (ip) form.append('remoteip', ip);
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });
    if (!response.ok) return false;
    const outcome = (await response.json()) as { success: boolean };
    return outcome.success === true;
  },

  async signIn(email, password) {
    const client = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, clientOptions);
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.code === 'invalid_credentials' || error.code === 'user_banned') {
        return { ok: false, code: error.code };
      }
      console.error(error);
      return { ok: false, code: 'unknown' };
    }
    return {
      ok: true,
      userId: data.user.id,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  },

  async isActiveAdmin(userId) {
    const { data, error } = await admin
      .from('profiles')
      .select('role, is_active')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data?.role === 'admin' && data.is_active === true;
  },

  async revokeSession(accessToken) {
    const { error } = await admin.auth.admin.signOut(accessToken);
    if (error) console.error(error);
  },
};

Deno.serve(createHandler(backend));
