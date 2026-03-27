create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

do $$
begin
  if exists (
    select 1 from pg_tables
    where schemaname = 'public' and tablename = 'worksheets'
  ) then
    execute 'drop policy if exists "Public read for published worksheets" on public.worksheets';
    execute 'drop policy if exists "Admin full access to worksheets" on public.worksheets';
  end if;

  if exists (
    select 1 from pg_tables
    where schemaname = 'public' and tablename = 'questions'
  ) then
    execute 'drop policy if exists "Public read for published questions" on public.questions';
    execute 'drop policy if exists "Admin full access to questions" on public.questions';
  end if;

  if exists (
    select 1 from pg_tables
    where schemaname = 'public' and tablename = 'raw_processing'
  ) then
    execute 'drop policy if exists "Admin full access to raw_processing" on public.raw_processing';
  end if;
end $$;

drop table if exists public.comments cascade;
drop table if exists public.votes cascade;
drop table if exists public.presentations cascade;
drop table if exists public.registrations cascade;
drop table if exists public.sessions cascade;
drop table if exists public.questions cascade;
drop table if exists public.raw_processing cascade;
drop table if exists public.worksheets cascade;
drop table if exists public.profiles cascade;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.handle_profile_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    'user'
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(excluded.display_name, public.profiles.display_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create table if not exists public.worksheets (
  id uuid primary key default uuid_generate_v4(),
  class text not null,
  subject text not null,
  title text not null,
  topic text,
  storage_path text not null,
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'draft_generated', 'reviewed', 'published', 'failed')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.raw_processing (
  id uuid primary key default uuid_generate_v4(),
  worksheet_id uuid not null unique references public.worksheets(id) on delete cascade,
  raw_text text,
  ai_output_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default uuid_generate_v4(),
  worksheet_id uuid not null references public.worksheets(id) on delete cascade,
  question_text text not null,
  answer_text text not null,
  question_type text not null default 'short' check (question_type in ('short', 'multiple_choice', 'true_false')),
  explanation text,
  source_page integer,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_questions_worksheet_id on public.questions(worksheet_id);

alter table public.worksheets add column if not exists storage_path text;
alter table public.worksheets add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.worksheets add column if not exists published_at timestamptz;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'worksheets'
      and column_name = 'pdf_url'
  ) then
    update public.worksheets
    set storage_path = nullif(split_part(pdf_url, '/storage/v1/object/public/worksheets/', 2), '')
    where coalesce(storage_path, '') = '';
  end if;
end $$;

alter table public.worksheets alter column storage_path set not null;

create or replace function public.handle_raw_processing_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_raw_processing_updated_at on public.raw_processing;
create trigger set_raw_processing_updated_at
before update on public.raw_processing
for each row
execute function public.handle_raw_processing_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

create or replace function public.publish_worksheet(p_worksheet_id uuid, p_questions jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if jsonb_typeof(p_questions) <> 'array' or jsonb_array_length(p_questions) = 0 then
    raise exception 'At least one question is required.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_questions) as item
    where coalesce(trim(item ->> 'question_text'), '') = ''
       or coalesce(trim(item ->> 'answer_text'), '') = ''
  ) then
    raise exception 'Each question requires question_text and answer_text.';
  end if;

  delete from public.questions
  where worksheet_id = p_worksheet_id;

  insert into public.questions (
    worksheet_id,
    question_text,
    answer_text,
    question_type,
    explanation,
    source_page,
    is_published
  )
  select
    p_worksheet_id,
    trim(item ->> 'question_text'),
    trim(item ->> 'answer_text'),
    case
      when coalesce(item ->> 'question_type', '') in ('short', 'multiple_choice', 'true_false')
        then item ->> 'question_type'
      else 'short'
    end,
    nullif(trim(item ->> 'explanation'), ''),
    nullif(item ->> 'source_page', '')::integer,
    true
  from jsonb_array_elements(p_questions) as item;

  update public.worksheets
  set status = 'published',
      published_at = now()
  where id = p_worksheet_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.worksheets enable row level security;
alter table public.raw_processing enable row level security;
alter table public.questions enable row level security;

drop policy if exists profiles_self_read on public.profiles;
drop policy if exists profiles_self_update on public.profiles;
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_self_read on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_admin());

create policy profiles_self_update on public.profiles
for update to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy profiles_admin_all on public.profiles
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists worksheets_read_published_or_admin on public.worksheets;
drop policy if exists worksheets_admin_manage on public.worksheets;
create policy worksheets_read_published_or_admin on public.worksheets
for select to authenticated
using (status = 'published' or public.is_admin());

create policy worksheets_admin_manage on public.worksheets
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists raw_processing_admin_only on public.raw_processing;
create policy raw_processing_admin_only on public.raw_processing
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists questions_read_published_or_admin on public.questions;
drop policy if exists questions_admin_manage on public.questions;
create policy questions_read_published_or_admin on public.questions
for select to authenticated
using (is_published = true or public.is_admin());

create policy questions_admin_manage on public.questions
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('worksheets', 'worksheets', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Worksheet bucket admin manage" on storage.objects;
create policy "Worksheet bucket admin manage" on storage.objects
for all to authenticated
using (bucket_id = 'worksheets' and public.is_admin())
with check (bucket_id = 'worksheets' and public.is_admin());

create or replace function public.seed_auth_user(
  p_email text,
  p_password text,
  p_role text,
  p_display_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  select id into v_user_id
  from auth.users
  where email = p_email;

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      p_email,
      extensions.crypt(p_password, extensions.gen_salt('bf')),
      now(),
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object('display_name', p_display_name),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      created_at,
      updated_at
    )
    values (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', p_email),
      'email',
      p_email,
      now(),
      now()
    );
  end if;

  insert into public.profiles (id, email, display_name, role)
  values (v_user_id, p_email, p_display_name, p_role)
  on conflict (id) do update
    set email = excluded.email,
        display_name = excluded.display_name,
        role = excluded.role,
        updated_at = now();

  return v_user_id;
end;
$$;

select public.seed_auth_user('admin@pdffinder.local', 'rayyan123', 'admin', 'Admin User');
select public.seed_auth_user('user@example.com', 'rayyan123', 'user', 'Demo User');

drop function public.seed_auth_user(text, text, text, text);
