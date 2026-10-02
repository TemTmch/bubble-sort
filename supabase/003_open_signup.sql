-- Bubble Sort — update 003: open sign-up for teachers (Google or e-mail + password), no invitations.
-- Run once in Supabase: SQL Editor → New query → paste this whole file → Run. Safe to re-run.
-- (schema.sql already contains this part for brand-new projects.)

-- Every new account becomes a teacher with its own separate space. The very first one is the administrator.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email is null then return new; end if;
  insert into public.teachers (id, email, is_admin)
  values (new.id, lower(new.email), not exists (select 1 from public.teachers))
  on conflict do nothing;
  return new;
end $$;

-- Accounts that signed in earlier without an invitation become teachers now.
insert into public.teachers (id, email)
select u.id, lower(u.email) from auth.users u
where u.email is not null and not exists (select 1 from public.teachers t where t.id = u.id)
on conflict do nothing;

-- Invitations are no longer used.
drop trigger if exists on_invite_created on public.teacher_invites;

-- With open sign-up, teachers no longer see a list of everyone on the site.
-- The directory now holds only colleagues you have exchanged sets with (to show their e-mails).
create or replace function public.teacher_directory() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('id', t.id, 'email', t.email, 'name', t.display_name) order by t.email), '[]'::json)
  from public.teachers t
  where public.is_teacher() and t.id <> auth.uid()
    and (exists (select 1 from public.set_shares sh join public.word_sets w on w.id = sh.set_id where w.owner_id = auth.uid() and sh.teacher_id = t.id)
      or exists (select 1 from public.set_shares sh join public.word_sets w on w.id = sh.set_id where sh.teacher_id = auth.uid() and w.owner_id = t.id));
$$;

-- Send one of your sets to a colleague by their e-mail.
create or replace function public.share_set(p_set uuid, p_email text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_to uuid;
begin
  if not exists (select 1 from public.word_sets where id = p_set and owner_id = auth.uid()) then raise exception 'not_owner'; end if;
  select id into v_to from public.teachers where email = lower(trim(p_email));
  if v_to is null then raise exception 'teacher_not_found'; end if;
  if v_to = auth.uid() then raise exception 'self'; end if;
  insert into public.set_shares (set_id, teacher_id, shared_by) values (p_set, v_to, auth.uid()) on conflict do nothing;
  return v_to;
end $$;

-- Public sets show the author's name, or only the part of the e-mail before "@".
create or replace function public.library_sets() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object(
      'id', w.id, 'title', w.title, 'grade', w.grade, 'lang', w.lang, 'cats', w.cats, 'updated_at', w.updated_at,
      'author', split_part(t.email, '@', 1), 'author_name', nullif(t.display_name, ''), 'public', w.visibility = 'public',
      'shared', exists (select 1 from public.set_shares sh where sh.set_id = w.id and sh.teacher_id = auth.uid()))
    order by w.updated_at desc), '[]'::json)
  from public.word_sets w join public.teachers t on t.id = w.owner_id
  where public.is_teacher() and w.owner_id <> auth.uid()
    and (w.visibility = 'public' or exists (select 1 from public.set_shares sh where sh.set_id = w.id and sh.teacher_id = auth.uid()));
$$;

revoke all on function public.share_set(uuid, text), public.teacher_directory(), public.library_sets() from public, anon;
grant execute on function public.share_set(uuid, text), public.teacher_directory(), public.library_sets() to authenticated;
