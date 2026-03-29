alter table public.questions
add column if not exists source_order integer;

alter table public.questions
add column if not exists layout_hint text not null default 'unknown';
