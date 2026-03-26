export interface Worksheet {
  id: string;
  title: string;
  subject: string;
  class: string;
  topic?: string;
  pdf_url: string;
  status: 'uploaded' | 'processing' | 'draft_generated' | 'published' | 'failed' | 'reviewed';
  created_at: string;
}

export interface Question {
  id?: string;
  worksheet_id?: string;
  question_text: string;
  answer_text: string;
  question_type?: string;
  explanation?: string;
  source_page?: number;
  is_published?: boolean;
}
