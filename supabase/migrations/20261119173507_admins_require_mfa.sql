/*
 * Migration: admins require mfa
 *
 * Purpose:
 *   - an administrator sees and changes every technician's data, so a stolen password alone must
 *     not be enough. private.is_admin() now also requires the session to be verified with a
 *     second factor (TOTP), which Supabase Auth records as the aal2 assurance level in the JWT.
 *   - every admin check in policies and functions goes through private.is_admin(), so this one
 *     change applies everywhere: an admin session at aal1 is treated like a user without admin
 *     rights. It can still read its own profile, so the panel can ask for the code.
 *
 * Affected objects:
 *   - function private.is_admin()
 *
 * Notes:
 *   - technicians are not affected: their policies check private.current_user_role() and auth.uid().
 *   - apply this migration only after the production admin panel can enroll and verify a TOTP
 *     factor; before that, admins would sign in but see no data.
 *   - the admin-users edge function checks the aal claim of the caller as well.
 */

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_user_role() = 'admin', false)
    and coalesce((select auth.jwt() ->> 'aal') = 'aal2', false);
$$;

comment on function private.is_admin() is 'True when the signed-in user is an active admin whose session was verified with a second factor (aal2).';
