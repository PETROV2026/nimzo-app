/*
 * Migration: feedback messages
 *
 * Purpose:
 *   - technicians send feedback from the mobile app: a bug they ran into or an idea, with optional
 *     photos or screenshots. administrators read them in the panel (Mensajes).
 *   - a message never changes and is never deleted through the api.
 *
 * Affected objects:
 *   - new type: public.feedback_kind
 *   - new table: public.feedback_messages
 *   - new function: private.check_feedback_message()
 *   - new storage bucket: feedback-files (private) and its policies on storage.objects
 *
 * Notes:
 *   - the id is generated on the device, so a retried upload fails on the primary key instead of
 *     creating a second message.
 *   - technicians cannot read messages, not even their own: only administrators read them.
 *   - photos live under {technician_id}/{message_id}/ and are uploaded before the row.
 */

create type public.feedback_kind as enum ('bug', 'idea');

comment on type public.feedback_kind is 'Kind of feedback message. Must match packages/shared/src/feedback.ts.';

create table public.feedback_messages (
  id uuid primary key,
  technician_id uuid not null references public.profiles (id) on delete restrict,
  kind public.feedback_kind not null,
  message text not null check (length(trim(message)) between 1 and 4000),
  screen text not null check (length(screen) between 1 and 100),
  app_version text not null check (length(app_version) between 1 and 50),
  os_version text not null check (length(os_version) between 1 and 50),
  photo_paths text[] not null default '{}' check (cardinality(photo_paths) <= 5),
  written_at timestamptz not null,
  created_at timestamptz not null default now()
);

comment on table public.feedback_messages is 'Bugs and ideas sent by technicians from the mobile app. Read only by administrators.';
comment on column public.feedback_messages.screen is 'Route name of the tab the technician was on, e.g. services.';
comment on column public.feedback_messages.photo_paths is 'Paths in the feedback-files bucket, under {technician_id}/{id}/.';
comment on column public.feedback_messages.written_at is 'When the technician wrote the message on the device.';

create index feedback_messages_technician_id_idx on public.feedback_messages (technician_id);
create index feedback_messages_created_at_idx on public.feedback_messages (created_at);

alter table public.feedback_messages enable row level security;

create or replace function private.check_feedback_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  folder text := new.technician_id::text || '/' || new.id::text || '/';
  photo text;
begin
  new.created_at := now();
  if not exists (
    select 1 from public.profiles p
    where p.id = new.technician_id and p.role = 'technician' and p.is_active
  ) then
    raise exception 'feedback must be sent by an active technician' using errcode = '23514';
  end if;
  foreach photo in array new.photo_paths loop
    if left(photo, length(folder)) <> folder then
      raise exception 'photos must be stored in the folder of the message' using errcode = '23514';
    end if;
  end loop;
  return new;
end;
$$;

comment on function private.check_feedback_message() is 'Checks that a feedback message comes from an active technician and that its photos are in its own folder.';

revoke execute on function private.check_feedback_message() from public, anon, authenticated;

create trigger feedback_messages_check
before insert on public.feedback_messages
for each row
execute function private.check_feedback_message();

create policy "Technicians can send their own feedback"
on public.feedback_messages for insert to authenticated
with check (technician_id = (select auth.uid()) and (select private.current_user_role()) = 'technician');

create policy "Administrators can view all feedback"
on public.feedback_messages for select to authenticated
using ((select private.is_admin()));

revoke all on public.feedback_messages from anon;

-- ---------------------------------------------------------------------------
-- feedback files: photos and screenshots under {technician_id}/{message_id}/.
-- technicians upload but never read them back; files are never overwritten or deleted.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('feedback-files', 'feedback-files', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Technicians can upload their own feedback files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'feedback-files'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select private.current_user_role()) = 'technician'
);

create policy "Administrators can view all feedback files"
on storage.objects for select to authenticated
using (bucket_id = 'feedback-files' and (select private.is_admin()));
