-- PDF Finder Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Status Enum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'worksheet_status') THEN
        CREATE TYPE worksheet_status AS ENUM (
          'uploaded',
          'processing',
          'draft_generated',
          'reviewed',
          'published',
          'failed'
        );
    END IF;
END $$;

-- Worksheets Table
CREATE TABLE IF NOT EXISTS worksheets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  class text NOT NULL,
  subject text NOT NULL,
  title text NOT NULL,
  topic text,
  pdf_url text NOT NULL,
  status worksheet_status DEFAULT 'uploaded',
  created_at timestamptz DEFAULT now()
);

-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  worksheet_id uuid NOT NULL REFERENCES worksheets(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  answer_text text NOT NULL,
  question_type text DEFAULT 'short',
  explanation text,
  source_page integer,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Raw Processing Table
CREATE TABLE IF NOT EXISTS raw_processing (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  worksheet_id uuid NOT NULL REFERENCES worksheets(id) ON DELETE CASCADE,
  raw_text text,
  ai_output_json jsonb,
  created_at timestamptz DEFAULT now()
);

-- RLS Policies (Basic for MVP)
ALTER TABLE worksheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_processing ENABLE ROW LEVEL SECURITY;

-- Allow public read for published worksheets and questions
DROP POLICY IF EXISTS "Public read for published worksheets" ON worksheets;
CREATE POLICY "Public read for published worksheets" ON worksheets
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Public read for published questions" ON questions;
CREATE POLICY "Public read for published questions" ON questions
  FOR SELECT USING (is_published = true);

-- Admin policies (assuming admin role or simple bypass for MVP)
DROP POLICY IF EXISTS "Admin full access to worksheets" ON worksheets;
CREATE POLICY "Admin full access to worksheets" ON worksheets
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access to questions" ON questions;
CREATE POLICY "Admin full access to questions" ON questions
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access to raw_processing" ON raw_processing;
CREATE POLICY "Admin full access to raw_processing" ON raw_processing
  FOR ALL USING (true);
