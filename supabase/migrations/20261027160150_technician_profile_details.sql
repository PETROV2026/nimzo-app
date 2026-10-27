/*
 * Migration: technician profile details
 *
 * Purpose:
 *   - the Perfil tab of the mobile app shows the technician's name, signature, the area where they
 *     live, email and phone. profiles gets the missing phone, state and city.
 *   - the signature drawn by the technician is stored in the private signatures bucket, under
 *     {user_id}/, and profiles.signature_path points to it.
 *   - technicians edit their own phone, area and signature; admins can edit them too.
 *
 * Affected objects:
 *   - new columns: public.profiles.phone, public.profiles.state, public.profiles.city
 *   - new check constraints: profiles_state_check, profiles_phone_check, profiles_city_check,
 *     profiles_signature_path_check
 *   - new storage bucket: signatures (private) and its policies on storage.objects
 *
 * Notes:
 *   - state uses the same mexican state codes as branches.state (packages/shared/src/mexican-states.ts).
 *   - the existing policies already let users update their own profile and admins update any;
 *     role, is_active, email and last_sign_in_at stay guarded by private.protect_profile_privileges().
 *   - a new signature is uploaded with a new file name and the old file is removed, so files are
 *     never overwritten.
 */

alter table public.profiles
  add column phone text,
  add column state text,
  add column city text;

alter table public.profiles
  add constraint profiles_phone_check check (phone is null or length(trim(phone)) > 0),
  add constraint profiles_city_check check (city is null or length(trim(city)) > 0),
  add constraint profiles_state_check check (
    state in (
      'AGU', 'BCN', 'BCS', 'CAM', 'CHH', 'CHP', 'CMX', 'COA',
      'COL', 'DUR', 'GRO', 'GUA', 'HID', 'JAL', 'MEX', 'MIC',
      'MOR', 'NAY', 'NLE', 'OAX', 'PUE', 'QUE', 'ROO', 'SIN',
      'SLP', 'SON', 'TAB', 'TAM', 'TLA', 'VER', 'YUC', 'ZAC'
    )
  ),
  add constraint profiles_signature_path_check check (
    signature_path is null or signature_path like id::text || '/%'
  );

comment on column public.profiles.phone is 'Contact phone of the user, as typed.';
comment on column public.profiles.state is 'ISO 3166-2 code of the mexican state where the user lives, without the MX- prefix. Must match packages/shared/src/mexican-states.ts.';
comment on column public.profiles.city is 'City or area where the user lives.';
comment on column public.profiles.signature_path is 'Path of the user signature inside the private signatures bucket, under {user_id}/.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('signatures', 'signatures', false, 1048576, array['image/png'])
on conflict (id) do nothing;

create policy "Technicians can upload their own signature"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'signatures'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select private.current_user_role()) = 'technician'
);

create policy "Technicians can view their own signature"
on storage.objects for select to authenticated
using (
  bucket_id = 'signatures'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select private.current_user_role()) = 'technician'
);

create policy "Technicians can remove their own signature"
on storage.objects for delete to authenticated
using (
  bucket_id = 'signatures'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select private.current_user_role()) = 'technician'
);

create policy "Administrators can view all signatures"
on storage.objects for select to authenticated
using (bucket_id = 'signatures' and (select private.is_admin()));
