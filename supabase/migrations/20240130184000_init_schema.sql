-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table if not exists profiles (
  user_id uuid references auth.users not null primary key,
  role text not null check (role in ('admin', 'parent', 'kid')),
  display_name text,
  age int,
  parent_user_id uuid references profiles(user_id),
  consent_for_under13 boolean default false,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

-- Function to safely create policy
create or replace function create_policy_if_not_exists(
    policy_name text,
    table_name text,
    cmd text,
    using_expr text default null,
    with_check_expr text default null
) returns void as $$
begin
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'public' 
        and tablename = table_name 
        and policyname = policy_name
    ) then
        execute format('create policy %I on %I for %s %s %s', 
            policy_name, table_name, cmd, 
            coalesce('using (' || using_expr || ')', ''),
            coalesce('with check (' || with_check_expr || ')', '')
        );
    end if;
end;
$$ language plpgsql;

-- Apply Profile Policies
select create_policy_if_not_exists('Users can read own profile', 'profiles', 'select', 'auth.uid() = user_id');
select create_policy_if_not_exists('Users can update own profile', 'profiles', 'update', 'auth.uid() = user_id');
select create_policy_if_not_exists('Users can insert own profile', 'profiles', 'insert', null, 'auth.uid() = user_id');
select create_policy_if_not_exists('Parents can read their kids profiles', 'profiles', 'select', 'exists (select 1 from profiles parent where parent.user_id = auth.uid() and parent.role = ''parent'' and profiles.parent_user_id = parent.user_id)');
select create_policy_if_not_exists('Admins can read all profiles', 'profiles', 'select', 'exists (select 1 from profiles admin where admin.user_id = auth.uid() and admin.role = ''admin'')');

-- SESSIONS
create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  theme text,
  description text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null check (status in ('draft', 'published', 'closed')),
  created_by uuid references profiles(user_id)
);

alter table sessions enable row level security;

select create_policy_if_not_exists('Public can read published sessions', 'sessions', 'select', 'status = ''published''');
select create_policy_if_not_exists('Admins can all sessions', 'sessions', 'select', 'exists (select 1 from profiles admin where admin.user_id = auth.uid() and admin.role = ''admin'')');
select create_policy_if_not_exists('Admins can insert sessions', 'sessions', 'insert', null, 'exists (select 1 from profiles admin where admin.user_id = auth.uid() and admin.role = ''admin'')');
select create_policy_if_not_exists('Admins can update sessions', 'sessions', 'update', 'exists (select 1 from profiles admin where admin.user_id = auth.uid() and admin.role = ''admin'')');

-- REGISTRATIONS
create table if not exists registrations (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) not null,
  user_id uuid references profiles(user_id) not null,
  type text not null check (type in ('attendee', 'presenter')),
  created_at timestamptz default now(),
  unique(session_id, user_id)
);

alter table registrations enable row level security;

select create_policy_if_not_exists('Users can read own registrations', 'registrations', 'select', 'auth.uid() = user_id');
select create_policy_if_not_exists('Users can insert own registrations', 'registrations', 'insert', null, 'auth.uid() = user_id');
select create_policy_if_not_exists('Admins can read all registrations', 'registrations', 'select', 'exists (select 1 from profiles admin where admin.user_id = auth.uid() and admin.role = ''admin'')');

-- PRESENTATIONS
create table if not exists presentations (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id) not null,
  owner_user_id uuid references profiles(user_id) not null,
  title text not null,
  abstract text,
  status text not null check (status in ('draft', 'submitted', 'approved', 'rejected')),
  thumbnail_path text,
  file_path text,
  video_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table presentations enable row level security;

select create_policy_if_not_exists('Public can read approved presentations', 'presentations', 'select', 'status = ''approved''');
select create_policy_if_not_exists('Owner can read own presentations', 'presentations', 'select', 'auth.uid() = owner_user_id');
select create_policy_if_not_exists('Owner can insert draft presentations', 'presentations', 'insert', null, 'auth.uid() = owner_user_id and status = ''draft''');
select create_policy_if_not_exists('Owner can update own draft presentations', 'presentations', 'update', 'auth.uid() = owner_user_id and status = ''draft''');
select create_policy_if_not_exists('Admins can read all presentations', 'presentations', 'select', 'exists (select 1 from profiles admin where admin.user_id = auth.uid() and admin.role = ''admin'')');
select create_policy_if_not_exists('Admins can update status', 'presentations', 'update', 'exists (select 1 from profiles admin where admin.user_id = auth.uid() and admin.role = ''admin'')');

-- VOTES
create table if not exists votes (
  id uuid primary key default uuid_generate_v4(),
  presentation_id uuid references presentations(id) not null,
  user_id uuid references profiles(user_id) not null,
  created_at timestamptz default now(),
  unique(presentation_id, user_id)
);

alter table votes enable row level security;

select create_policy_if_not_exists('Authenticated users can vote for approved presentations', 'votes', 'insert', null, 'auth.uid() = user_id and exists (select 1 from presentations p where p.id = presentation_id and p.status = ''approved'')');
select create_policy_if_not_exists('Users can read own votes', 'votes', 'select', 'auth.uid() = user_id');

-- COMMENTS
create table if not exists comments (
  id uuid primary key default uuid_generate_v4(),
  presentation_id uuid references presentations(id) not null,
  user_id uuid references profiles(user_id) not null,
  body text not null,
  created_at timestamptz default now(),
  is_deleted boolean default false
);

alter table comments enable row level security;

select create_policy_if_not_exists('Authenticated users can insert comments', 'comments', 'insert', null, 'auth.uid() = user_id');
select create_policy_if_not_exists('Public can read non-deleted comments', 'comments', 'select', 'is_deleted = false');
select create_policy_if_not_exists('Authors can soft delete own comments', 'comments', 'update', 'auth.uid() = user_id');
select create_policy_if_not_exists('Admins can soft delete any comment', 'comments', 'update', 'exists (select 1 from profiles admin where admin.user_id = auth.uid() and admin.role = ''admin'')');

-- STORAGE
insert into storage.buckets (id, name, public) 
values ('thumbnails', 'thumbnails', true), ('presentations', 'presentations', true)
on conflict do nothing;

-- Storage policies (schemaname = 'storage')
do $$
begin
    if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public Access to Thumbnails') then
        create policy "Public Access to Thumbnails" on storage.objects for select using (bucket_id = 'thumbnails');
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public Access to Presentations') then
        create policy "Public Access to Presentations" on storage.objects for select using (bucket_id = 'presentations');
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Authenticated Users can upload thumbnails') then
        create policy "Authenticated Users can upload thumbnails" on storage.objects for insert with check (bucket_id = 'thumbnails' and auth.role() = 'authenticated');
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Authenticated Users can upload presentations') then
        create policy "Authenticated Users can upload presentations" on storage.objects for insert with check (bucket_id = 'presentations' and auth.role() = 'authenticated');
    end if;
end $$;
