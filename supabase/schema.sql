-- Bubble Sort — database schema (Supabase / Postgres)
-- Run once in Supabase: SQL Editor → New query → paste this whole file → Run.
-- Safe to re-run: every object is created with "if not exists" / "or replace".
--
-- Who can do what
--   * Teachers sign in with an e-mail link. Only invited e-mails become teachers;
--     the very first person to sign in becomes the administrator.
--   * A teacher sees and edits only their own word sets, classes, pupils and progress.
--   * Pupils have no accounts: they join a class with its code and a first name,
--     and get a private device token. Everything a pupil does goes through the
--     functions at the bottom, which only ever touch that pupil's own class.

create extension if not exists pgcrypto;

-- ───────────────────────────── tables ─────────────────────────────

create table if not exists public.teachers (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null unique,
  display_name text not null default '',
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists public.teacher_invites (
  email      text primary key check (email = lower(email)),
  invited_by uuid references public.teachers(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.word_sets (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.teachers(id) on delete cascade,
  title      text not null default '',
  grade      text not null default '',
  lang       text not null default 'en-GB',
  cats       jsonb not null default '[]'::jsonb,   -- [{name, words:[{w,h}]}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists word_sets_owner_idx on public.word_sets(owner_id);

-- short, unambiguous class codes like K7QX4M (no 0/O, 1/I/L)
create or replace function public.new_join_code() returns text
language sql volatile as $$
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1), '')
  from generate_series(1, 6);
$$;

create table if not exists public.classes (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.teachers(id) on delete cascade,
  name       text not null check (length(trim(name)) between 1 and 60),
  join_code  text not null unique default public.new_join_code(),
  archived   boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists classes_owner_idx on public.classes(owner_id);

create table if not exists public.class_sets (
  class_id uuid not null references public.classes(id) on delete cascade,
  set_id   uuid not null references public.word_sets(id) on delete cascade,
  position int  not null default 0,
  primary key (class_id, set_id)
);

create table if not exists public.students (
  id           uuid primary key default gen_random_uuid(),
  class_id     uuid not null references public.classes(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) between 1 and 40),
  token        uuid not null unique default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  last_seen    timestamptz not null default now()
);
create index if not exists students_class_idx on public.students(class_id);

create table if not exists public.progress (
  student_id uuid not null references public.students(id) on delete cascade,
  set_id     uuid not null references public.word_sets(id) on delete cascade,
  kind       text not null check (kind in ('groups', 'odd', 'pairs')),
  level      int  not null default 1 check (level between 1 and 999),
  stars      jsonb not null default '{}'::jsonb,   -- {"1":3,"2":2}
  misses     jsonb not null default '{}'::jsonb,   -- {"apple":2}
  plays      int  not null default 0,
  updated_at timestamptz not null default now(),
  primary key (student_id, set_id, kind)
);

-- ─────────────────────────── helper functions ───────────────────────────

create or replace function public.is_teacher() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.teachers where id = auth.uid());
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.teachers where id = auth.uid() and is_admin);
$$;

create or replace function public.owns_class(p_class uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.classes where id = p_class and owner_id = auth.uid());
$$;

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;

drop trigger if exists word_sets_touch on public.word_sets;
create trigger word_sets_touch before update on public.word_sets
  for each row execute function public.touch_updated_at();

-- A new sign-in becomes a teacher if the e-mail was invited.
-- The first ever sign-in (empty teachers table) becomes the administrator.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email is null then return new; end if;
  if not exists (select 1 from public.teachers) then
    insert into public.teachers (id, email, is_admin) values (new.id, lower(new.email), true)
    on conflict (id) do nothing;
  elsif exists (select 1 from public.teacher_invites where email = lower(new.email)) then
    insert into public.teachers (id, email) values (new.id, lower(new.email))
    on conflict (id) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Inviting an e-mail that already signed in (and was refused) promotes it right away.
create or replace function public.handle_new_invite() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.teachers (id, email)
  select u.id, lower(u.email) from auth.users u where lower(u.email) = new.email
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_invite_created on public.teacher_invites;
create trigger on_invite_created after insert on public.teacher_invites
  for each row execute function public.handle_new_invite();

-- ───────────────────────────── row level security ─────────────────────────────

alter table public.teachers        enable row level security;
alter table public.teacher_invites enable row level security;
alter table public.word_sets       enable row level security;
alter table public.classes         enable row level security;
alter table public.class_sets      enable row level security;
alter table public.students        enable row level security;
alter table public.progress        enable row level security;

drop policy if exists teachers_select on public.teachers;
create policy teachers_select on public.teachers for select to authenticated
  using (id = auth.uid() or public.is_admin());
drop policy if exists teachers_update on public.teachers;
create policy teachers_update on public.teachers for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists teachers_admin_delete on public.teachers;
create policy teachers_admin_delete on public.teachers for delete to authenticated
  using (public.is_admin() and id <> auth.uid());

drop policy if exists invites_admin on public.teacher_invites;
create policy invites_admin on public.teacher_invites for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists sets_owner on public.word_sets;
create policy sets_owner on public.word_sets for all to authenticated
  using (owner_id = auth.uid() and public.is_teacher())
  with check (owner_id = auth.uid() and public.is_teacher());

drop policy if exists classes_owner on public.classes;
create policy classes_owner on public.classes for all to authenticated
  using (owner_id = auth.uid() and public.is_teacher())
  with check (owner_id = auth.uid() and public.is_teacher());

drop policy if exists class_sets_owner on public.class_sets;
create policy class_sets_owner on public.class_sets for all to authenticated
  using (public.owns_class(class_id))
  with check (public.owns_class(class_id)
              and exists (select 1 from public.word_sets s where s.id = set_id and s.owner_id = auth.uid()));

drop policy if exists students_owner on public.students;
create policy students_owner on public.students for select to authenticated
  using (public.owns_class(class_id));
drop policy if exists students_owner_update on public.students;
create policy students_owner_update on public.students for update to authenticated
  using (public.owns_class(class_id)) with check (public.owns_class(class_id));
drop policy if exists students_owner_delete on public.students;
create policy students_owner_delete on public.students for delete to authenticated
  using (public.owns_class(class_id));

drop policy if exists progress_owner on public.progress;
create policy progress_owner on public.progress for select to authenticated
  using (exists (select 1 from public.students st where st.id = student_id and public.owns_class(st.class_id)));
drop policy if exists progress_owner_delete on public.progress;
create policy progress_owner_delete on public.progress for delete to authenticated
  using (exists (select 1 from public.students st where st.id = student_id and public.owns_class(st.class_id)));

-- Pupils (anonymous visitors) never read tables directly.
revoke all on public.teachers, public.teacher_invites, public.word_sets, public.classes,
              public.class_sets, public.students, public.progress from anon;

-- ─────────────────────────── pupil functions ───────────────────────────

-- What a class code opens (shown before the pupil types a name).
create or replace function public.class_preview(p_code text) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('name', c.name, 'sets', (select count(*) from public.class_sets cs where cs.class_id = c.id))
  from public.classes c
  where c.join_code = upper(trim(p_code)) and not c.archived;
$$;

-- Join a class: returns the device token the pupil keeps on this device.
create or replace function public.join_class(p_code text, p_name text) returns json
language plpgsql volatile security definer set search_path = public as $$
declare c public.classes; s public.students;
begin
  select * into c from public.classes where join_code = upper(trim(p_code)) and not archived;
  if c.id is null then raise exception 'class_not_found'; end if;
  if length(trim(coalesce(p_name, ''))) not between 1 and 40 then raise exception 'bad_name'; end if;
  insert into public.students (class_id, display_name) values (c.id, trim(p_name)) returning * into s;
  return json_build_object('token', s.token, 'student', s.display_name, 'class', c.name);
end $$;

-- Everything the pupil's game needs: their class, its word sets and their progress.
create or replace function public.student_state(p_token uuid) returns json
language plpgsql volatile security definer set search_path = public as $$
declare st public.students; c public.classes;
begin
  select * into st from public.students where token = p_token;
  if st.id is null then return null; end if;
  select * into c from public.classes where id = st.class_id;
  if c.archived then return null; end if;
  update public.students set last_seen = now() where id = st.id;
  return json_build_object(
    'student', st.display_name,
    'class', c.name,
    'sets', coalesce((
      select json_agg(json_build_object('id', w.id, 'title', w.title, 'grade', w.grade, 'lang', w.lang, 'cats', w.cats) order by cs.position, w.title)
      from public.class_sets cs join public.word_sets w on w.id = cs.set_id
      where cs.class_id = c.id), '[]'::json),
    'progress', coalesce((
      select json_agg(json_build_object('set', p.set_id, 'kind', p.kind, 'level', p.level, 'stars', p.stars, 'misses', p.misses))
      from public.progress p where p.student_id = st.id), '[]'::json)
  );
end $$;

-- Save one set/mode of a pupil's progress (only for sets of their own class).
create or replace function public.save_progress(p_token uuid, p_set uuid, p_kind text, p_level int, p_stars jsonb, p_misses jsonb)
returns void
language plpgsql volatile security definer set search_path = public as $$
declare st public.students;
begin
  select * into st from public.students where token = p_token;
  if st.id is null then raise exception 'unknown_student'; end if;
  if not exists (select 1 from public.class_sets where class_id = st.class_id and set_id = p_set) then
    raise exception 'set_not_in_class';
  end if;
  if p_kind not in ('groups', 'odd', 'pairs') then raise exception 'bad_kind'; end if;
  insert into public.progress as pr (student_id, set_id, kind, level, stars, misses, plays, updated_at)
  values (st.id, p_set, p_kind, greatest(1, least(coalesce(p_level, 1), 999)), coalesce(p_stars, '{}'), coalesce(p_misses, '{}'), 1, now())
  on conflict (student_id, set_id, kind) do update
    set level = greatest(pr.level, excluded.level), stars = excluded.stars, misses = excluded.misses,
        plays = pr.plays + 1, updated_at = now();
end $$;

revoke all on function public.class_preview(text), public.join_class(text, text),
  public.student_state(uuid), public.save_progress(uuid, uuid, text, int, jsonb, jsonb) from public;
grant execute on function public.class_preview(text), public.join_class(text, text),
  public.student_state(uuid), public.save_progress(uuid, uuid, text, int, jsonb, jsonb) to anon, authenticated;

-- ═════════════ update 002: shared library and pictures (same as 002_library_images.sql) ═════════════


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
