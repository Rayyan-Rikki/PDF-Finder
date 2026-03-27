-- Canonical schema for PDF Finder
-- Apply via the migration in supabase/migrations/20260326190000_auth_and_worksheet_security.sql

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
