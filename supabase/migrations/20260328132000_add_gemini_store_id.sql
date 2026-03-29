-- Migration: Add gemini_store_id to worksheets
alter table public.worksheets add column if not exists gemini_store_id text;

-- Add a comment for clarity
comment on column public.worksheets.gemini_store_id is 'Managed Gemini File Search Store ID for RAG and persistent indexing.';
