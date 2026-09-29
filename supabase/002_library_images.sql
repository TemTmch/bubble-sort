-- Bubble Sort — update 002: shared library (public / private / sent to colleagues) and pictures.
-- Run once in Supabase: SQL Editor → New query → paste this whole file → Run. Safe to re-run.
-- (schema.sql already contains this part for brand-new projects.)

-- ───────── shared library ─────────
alter table public.word_sets add column if not exists visibility text not null default 'private';
do $$ begin
  alter table public.word_sets add constraint word_sets_visibility_chk check (visibility in ('private', 'public'));
exception when duplicate_object then null; end $$;
alter table public.word_sets add column if not exists copied_from uuid references public.word_sets(id) on delete set null;

-- A private set sent to particular colleagues.
create table if not exists public.set_shares (
  set_id     uuid not null references public.word_sets(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  shared_by  uuid references public.teachers(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (set_id, teacher_id)
);
alter table public.set_shares enable row level security;

drop policy if exists shares_owner on public.set_shares;
create policy shares_owner on public.set_shares for all to authenticated
  using (exists (select 1 from public.word_sets s where s.id = set_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.word_sets s where s.id = set_id and s.owner_id = auth.uid()) and teacher_id <> auth.uid());
drop policy if exists shares_recipient_select on public.set_shares;
create policy shares_recipient_select on public.set_shares for select to authenticated
  using (teacher_id = auth.uid());
drop policy if exists shares_recipient_delete on public.set_shares;
create policy shares_recipient_delete on public.set_shares for delete to authenticated
  using (teacher_id = auth.uid());
revoke all on public.set_shares from anon;

-- Other teachers' sets this teacher may see: public ones and ones sent to them.
-- (Word sets themselves stay owner-only; colleagues get read access only through this function.)
create or replace function public.library_sets() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object(
      'id', w.id, 'title', w.title, 'grade', w.grade, 'lang', w.lang, 'cats', w.cats, 'updated_at', w.updated_at,
      'author', t.email, 'author_name', t.display_name, 'public', w.visibility = 'public',
      'shared', exists (select 1 from public.set_shares sh where sh.set_id = w.id and sh.teacher_id = auth.uid()))
    order by w.updated_at desc), '[]'::json)
  from public.word_sets w join public.teachers t on t.id = w.owner_id
  where public.is_teacher() and w.owner_id <> auth.uid()
    and (w.visibility = 'public' or exists (select 1 from public.set_shares sh where sh.set_id = w.id and sh.teacher_id = auth.uid()));
$$;

-- Colleagues a teacher can send a set to.
create or replace function public.teacher_directory() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('id', id, 'email', email, 'name', display_name) order by email), '[]'::json)
  from public.teachers where public.is_teacher() and id <> auth.uid();
$$;

revoke all on function public.library_sets(), public.teacher_directory() from public, anon;
grant execute on function public.library_sets(), public.teacher_directory() to authenticated;

-- ───────── pictures ─────────
-- Public bucket: pictures are shown to pupils without sign-in. Teachers upload only into their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('set-images', 'set-images', true, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

drop policy if exists "set-images: teachers upload own" on storage.objects;
create policy "set-images: teachers upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'set-images' and (storage.foldername(name))[1] = auth.uid()::text and public.is_teacher());
drop policy if exists "set-images: teachers update own" on storage.objects;
create policy "set-images: teachers update own" on storage.objects for update to authenticated
  using (bucket_id = 'set-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "set-images: teachers delete own" on storage.objects;
create policy "set-images: teachers delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'set-images' and (storage.foldername(name))[1] = auth.uid()::text);
