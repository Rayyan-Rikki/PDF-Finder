alter table public.worksheets
add column if not exists processing_attempts integer not null default 0;

alter table public.worksheets
add column if not exists last_processed_at timestamptz;

alter table public.worksheets
add column if not exists last_retry_at timestamptz;
