export interface Worksheet {
  id: string;
  title: string;
  subject: string;
  class: string;
  topic?: string;
  storage_path: string;
  status: 'uploaded' | 'processing' | 'draft_generated' | 'published' | 'failed' | 'reviewed';
  processing_error?: string | null;
  processing_attempts?: number | null;
  last_processed_at?: string | null;
  last_retry_at?: string | null;
  created_at: string;
  published_at?: string | null;
}

export type QuestionType = "short" | "multiple_choice" | "true_false";
export type QuestionGenerationBasis = "extracted" | "generated_similar" | "manual";
export type QuestionGradingMode = "exact" | "numeric_tolerance" | "keyword_match";
export type QuestionLayoutHint =
  | "mcq_vertical"
  | "mcq_inline"
  | "short_line"
  | "paragraph_answer"
  | "true_false_row"
  | "unknown";

export interface Question {
  id?: string;
  worksheet_id?: string;
  question_text: string;
  answer_text: string;
  answer_options?: string[];
  accepted_answer_variants?: string[];
  question_type?: QuestionType;
  grading_mode?: QuestionGradingMode;
  numeric_tolerance?: number;
  required_keywords?: string[];
  minimum_keyword_matches?: number;
  explanation?: string;
  source_page?: number;
  source_order?: number;
  layout_hint?: QuestionLayoutHint;
  is_published?: boolean;
  generation_basis?: QuestionGenerationBasis;
  style_notes?: string;
}

export interface ExtractionMetadata {
  worksheet_summary?: string;
  detected_class_level?: string;
  detected_subject?: string;
  style_notes?: string;
  generation_mode?: "generate_similar" | "preserve_structure";
}
