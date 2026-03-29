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
  processing_error text,
  processing_attempts integer not null default 0,
  last_processed_at timestamptz,
  last_retry_at timestamptz,
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
  answer_options text[] not null default '{}',
  accepted_answer_variants text[] not null default '{}',
  question_type text not null default 'short' check (question_type in ('short', 'multiple_choice', 'true_false')),
  grading_mode text not null default 'exact' check (grading_mode in ('exact', 'numeric_tolerance', 'keyword_match')),
  numeric_tolerance numeric,
  required_keywords text[] not null default '{}',
  minimum_keyword_matches integer,
  explanation text,
  source_page integer,
  source_order integer,
  layout_hint text not null default 'unknown',
  generation_basis text not null default 'generated_similar' check (generation_basis in ('extracted', 'generated_similar', 'manual')),
  style_notes text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);
