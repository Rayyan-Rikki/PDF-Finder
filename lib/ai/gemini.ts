export interface ExtractedQuestion {
  question_text: string;
  answer_text: string;
  answer_options?: string[];
  accepted_answer_variants?: string[];
  question_type: "short" | "multiple_choice" | "true_false";
  grading_mode?: "exact" | "numeric_tolerance" | "keyword_match";
  numeric_tolerance?: number;
  required_keywords?: string[];
  minimum_keyword_matches?: number;
  explanation?: string;
  source_page?: number;
  source_order?: number;
  layout_hint?: "mcq_vertical" | "mcq_inline" | "short_line" | "paragraph_answer" | "true_false_row" | "unknown";
  generation_basis?: "extracted" | "generated_similar" | "manual";
  style_notes?: string;
}

export interface ExtractionResult {
  worksheet_summary?: string;
  detected_class_level?: string;
  detected_subject?: string;
  style_notes?: string;
  generation_mode?: "generate_similar" | "preserve_structure";
  questions: ExtractedQuestion[];
}

const DEFAULT_GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];
const GEMINI_MODEL_ALIASES: Record<string, string> = {
  "gemini-1.5-flash": "gemini-2.5-flash",
  "gemini-1.5-pro": "gemini-2.5-flash",
  "gemini-2.0-flash-exp": "gemini-2.0-flash",
};

interface GeminiCandidatePart {
  text?: string;
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiCandidatePart[];
    };
  }>;
  promptFeedback?: {
    blockReason?: string;
    blockReasonMessage?: string;
  };
  error?: {
    message?: string;
  };
}

function isNumericValue(value: string): boolean {
  return /^-?[0-9]+(\.[0-9]+)?$/.test(value.trim());
}

function normalizeOptions(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function normalizeStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function normalizePositiveInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : undefined;
}

function inferQuestionType(
  rawType: string,
  answerText: string,
  answerOptions: string[]
): ExtractedQuestion["question_type"] {
  if (rawType === "short" || rawType === "multiple_choice" || rawType === "true_false") {
    return rawType;
  }

  const normalizedAnswer = answerText.toLowerCase();
  const normalizedOptions = answerOptions.map((option) => option.toLowerCase());
  const hasTrueFalseOptions = normalizedOptions.includes("true") && normalizedOptions.includes("false");

  if (normalizedAnswer === "true" || normalizedAnswer === "false" || hasTrueFalseOptions) {
    return "true_false";
  }

  if (answerOptions.length >= 3) {
    return "multiple_choice";
  }

  return "short";
}

function inferGradingMode(
  rawGradingMode: string,
  questionType: ExtractedQuestion["question_type"],
  answerText: string,
  requiredKeywords: string[]
): NonNullable<ExtractedQuestion["grading_mode"]> {
  if (questionType !== "short") {
    return "exact";
  }

  if (rawGradingMode === "exact" || rawGradingMode === "numeric_tolerance" || rawGradingMode === "keyword_match") {
    return rawGradingMode;
  }

  if (requiredKeywords.length > 0) {
    return "keyword_match";
  }

  if (isNumericValue(answerText)) {
    return "numeric_tolerance";
  }

  return "exact";
}

function inferLayoutHint(
  rawLayoutHint: unknown,
  questionType: ExtractedQuestion["question_type"]
): NonNullable<ExtractedQuestion["layout_hint"]> {
  if (
    rawLayoutHint === "mcq_vertical" ||
    rawLayoutHint === "mcq_inline" ||
    rawLayoutHint === "short_line" ||
    rawLayoutHint === "paragraph_answer" ||
    rawLayoutHint === "true_false_row" ||
    rawLayoutHint === "unknown"
  ) {
    return rawLayoutHint;
  }

  if (questionType === "multiple_choice") {
    return "mcq_vertical";
  }

  if (questionType === "true_false") {
    return "true_false_row";
  }

  return "short_line";
}

function extractJsonPayload(rawText: string): string {
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error("Gemini returned an empty response.");
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function normalizeQuestion(input: unknown): ExtractedQuestion | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const question = input as Record<string, unknown>;
  const questionText =
    typeof question.question_text === "string" ? question.question_text.replace(/\r\n/g, "\n").trim() : "";
  const answerText =
    typeof question.answer_text === "string" ? question.answer_text.replace(/\r\n/g, "\n").trim() : "";

  if (!questionText || !answerText) {
    return null;
  }

  const rawType = typeof question.question_type === "string" ? question.question_type : "";
  const acceptedAnswerVariants = normalizeStringList(question.accepted_answer_variants);
  const rawAnswerOptions = normalizeOptions(question.answer_options);
  const requiredKeywords = normalizeStringList(question.required_keywords);
  const questionType = inferQuestionType(rawType, answerText, rawAnswerOptions);
  const answerOptions =
    questionType === "true_false"
      ? ["True", "False"]
      : questionType === "multiple_choice"
        ? rawAnswerOptions
        : rawAnswerOptions;
  const rawGradingMode = typeof question.grading_mode === "string" ? question.grading_mode : "";
  const gradingMode = inferGradingMode(rawGradingMode, questionType, answerText, requiredKeywords);
  const numericTolerance =
    gradingMode === "numeric_tolerance"
      ? typeof question.numeric_tolerance === "number" && Number.isFinite(question.numeric_tolerance)
        ? Math.max(0, question.numeric_tolerance)
        : 0
      : undefined;
  const minimumKeywordMatches =
    gradingMode === "keyword_match"
      ? typeof question.minimum_keyword_matches === "number" &&
        Number.isFinite(question.minimum_keyword_matches) &&
        question.minimum_keyword_matches > 0
        ? Math.min(Math.floor(question.minimum_keyword_matches), requiredKeywords.length || 1)
        : requiredKeywords.length > 0
          ? 1
          : undefined
      : undefined;
  const rawGenerationBasis =
    typeof question.generation_basis === "string" ? question.generation_basis : "extracted";
  const generationBasis =
    rawGenerationBasis === "extracted" || rawGenerationBasis === "generated_similar" || rawGenerationBasis === "manual"
      ? rawGenerationBasis
      : "extracted";
  const sourcePage = normalizePositiveInteger(question.source_page);
  const sourceOrder = normalizePositiveInteger(question.source_order);
  const layoutHint = inferLayoutHint(question.layout_hint, questionType);

  return {
    question_text: questionText,
    answer_text: answerText,
    answer_options: answerOptions.length > 0 ? answerOptions : undefined,
    accepted_answer_variants: acceptedAnswerVariants.length > 0 ? acceptedAnswerVariants : undefined,
    question_type: questionType,
    grading_mode: gradingMode,
    numeric_tolerance: numericTolerance,
    required_keywords: gradingMode === "keyword_match" && requiredKeywords.length > 0 ? requiredKeywords : undefined,
    minimum_keyword_matches: minimumKeywordMatches,
    explanation: typeof question.explanation === "string" ? question.explanation.trim() || undefined : undefined,
    source_page: sourcePage,
    source_order: sourceOrder,
    layout_hint: layoutHint,
    generation_basis: generationBasis,
    style_notes: typeof question.style_notes === "string" ? question.style_notes.trim() || undefined : undefined,
  };
}

function isLikelySubpartQuestion(text: string) {
  return /^\s*\((?:[ivxlcdm]+|[a-z]|\d+)\)\s+/i.test(text);
}

function hasSubpartMarkers(text: string) {
  return /\((?:[ivxlcdm]+|[a-z]|\d+)\)\s+/i.test(text);
}

function mergeMultilineText(...values: Array<string | undefined>) {
  const lines = values
    .flatMap((value) => (value ? value.split("\n") : []))
    .map((line) => line.trim())
    .filter(Boolean);

  return Array.from(new Set(lines)).join("\n");
}

function canMergeIntoPreviousQuestion(previous: ExtractedQuestion, current: ExtractedQuestion) {
  if (current.generation_basis && current.generation_basis !== "extracted") {
    return false;
  }

  if (previous.generation_basis && previous.generation_basis !== "extracted") {
    return false;
  }

  if (!isLikelySubpartQuestion(current.question_text)) {
    return false;
  }

  if (previous.source_page && current.source_page && previous.source_page !== current.source_page) {
    return false;
  }

  if (
    previous.source_order &&
    current.source_order &&
    current.source_order - previous.source_order > 1
  ) {
    return false;
  }

  return true;
}

function mergeBrokenCompoundQuestions(questions: ExtractedQuestion[]) {
  const merged: ExtractedQuestion[] = [];

  for (const question of questions) {
    const previous = merged[merged.length - 1];

    if (!previous || !canMergeIntoPreviousQuestion(previous, question)) {
      merged.push(question);
      continue;
    }

    previous.question_text = mergeMultilineText(previous.question_text, question.question_text);
    previous.answer_text =
      hasSubpartMarkers(previous.answer_text) && !hasSubpartMarkers(question.answer_text)
        ? previous.answer_text
        : mergeMultilineText(previous.answer_text, question.answer_text);

    if (question.explanation) {
      previous.explanation = mergeMultilineText(previous.explanation, question.explanation);
    }

    if (question.style_notes) {
      previous.style_notes = previous.style_notes
        ? `${previous.style_notes} ${question.style_notes}`.trim()
        : question.style_notes;
    }

    const combinedVariants = [
      ...(previous.accepted_answer_variants || []),
      ...(question.accepted_answer_variants || []),
    ];
    previous.accepted_answer_variants = combinedVariants.length > 0 ? Array.from(new Set(combinedVariants)) : undefined;

    if ((!previous.layout_hint || previous.layout_hint === "short_line") && hasSubpartMarkers(previous.question_text)) {
      previous.layout_hint = "paragraph_answer";
    }
  }

  return merged.map((question, index) => ({
    ...question,
    source_order: index + 1,
  }));
}

export function parseExtractionResult(rawText: string): ExtractionResult {
  const jsonPayload = extractJsonPayload(rawText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonPayload);
  } catch (error) {
    throw new Error(
      `Gemini returned invalid JSON: ${error instanceof Error ? error.message : "unknown parse error"}`
    );
  }

  if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { questions?: unknown[] }).questions)) {
    throw new Error('Gemini response must be a JSON object with a "questions" array.');
  }

  const extraction = parsed as {
    worksheet_summary?: unknown;
    detected_class_level?: unknown;
    detected_subject?: unknown;
    style_notes?: unknown;
    generation_mode?: unknown;
    questions: unknown[];
  };

  const questions = mergeBrokenCompoundQuestions(
    extraction.questions
    .map(normalizeQuestion)
    .filter((question): question is ExtractedQuestion => question !== null)
  );

  if (questions.length === 0) {
    throw new Error("Gemini did not return any usable questions.");
  }

  return {
    worksheet_summary:
      typeof extraction.worksheet_summary === "string" ? extraction.worksheet_summary.trim() || undefined : undefined,
    detected_class_level:
      typeof extraction.detected_class_level === "string"
        ? extraction.detected_class_level.trim() || undefined
        : undefined,
    detected_subject:
      typeof extraction.detected_subject === "string" ? extraction.detected_subject.trim() || undefined : undefined,
    style_notes: typeof extraction.style_notes === "string" ? extraction.style_notes.trim() || undefined : undefined,
    generation_mode:
      extraction.generation_mode === "generate_similar" || extraction.generation_mode === "preserve_structure"
        ? extraction.generation_mode
        : "preserve_structure",
    questions,
  };
}

function resolveModelCandidates(configuredModel: string | undefined): string[] {
  const requestedModels = configuredModel ? [configuredModel, ...DEFAULT_GEMINI_MODELS] : DEFAULT_GEMINI_MODELS;
  const seen = new Set<string>();
  const resolved: string[] = [];

  for (const model of requestedModels) {
    const normalized = GEMINI_MODEL_ALIASES[model] || model;
    if (!seen.has(normalized)) {
      seen.add(normalized);
      resolved.push(normalized);
    }
  }

  return resolved;
}

export async function extractQuizFromPDF(pdfBase64: string): Promise<ExtractionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  const modelCandidates = resolveModelCandidates(process.env.GEMINI_MODEL?.trim());
  const prompt = `
    Analyze this worksheet PDF and extract the worksheet into structured quiz data one time for storage.
    Preserve the worksheet's original question format as closely as possible so every user later sees the same stored structure.
    Your first priority is exact structure preservation, not creative rewriting.
    Keep question wording, order, type, and options aligned to the source worksheet whenever they are readable.
    Only generate a similar replacement when a question is unreadable or incomplete, and mark it clearly.
    Return a JSON object with:
    - worksheet_summary
    - detected_class_level
    - detected_subject
    - style_notes
    - generation_mode
    - questions
    Each question must include:
    - question_text
    - answer_text
    - answer_options: required when question_type is "multiple_choice"; include 2 options for true/false if you choose that format
    - accepted_answer_variants: alternate correct answers students may type
    - question_type: "short", "multiple_choice", or "true_false"
    - layout_hint: "mcq_vertical", "mcq_inline", "short_line", "paragraph_answer", "true_false_row", or "unknown"
    - grading_mode: "exact", "numeric_tolerance", or "keyword_match"
    - numeric_tolerance: required when grading_mode is "numeric_tolerance"
    - required_keywords: required when grading_mode is "keyword_match"
    - minimum_keyword_matches: optional; defaults to all keywords if omitted
    - explanation (optional)
    - source_page (optional)
    - source_order: required positive integer reflecting the question's order in the worksheet
    - generation_basis: "extracted" when directly preserved from the PDF, "generated_similar" only when the original is unreadable or incomplete
    - style_notes (optional short note about why the question matches the worksheet style)
    Requirements:
    - Preserve question order exactly and set source_order sequentially.
    - Preserve question type exactly when readable: if the worksheet shows MCQ, keep MCQ; if it shows short answer, keep short answer; if it shows true/false, keep true/false.
    - If one worksheet question contains subparts such as (i), (ii), (iii), (a), (b), or numbered mini-parts, keep them inside a single question_text entry with line breaks. Do not split one numbered worksheet question into multiple separate questions.
    - For grouped subpart questions, answer_text should also stay grouped in the same order as the subparts instead of producing separate question entries.
    - Keep questions aligned to the source worksheet's content. Do not invent unrelated topics.
    - Keep answers factual and concise.
    - Include accepted_answer_variants whenever more than one student phrasing should be accepted.
    - For "multiple_choice" questions, preserve the source options when visible and ensure answer_text matches one of them.
    - For "true_false" questions, set answer_text to "True" or "False" and prefer answer_options ["True", "False"].
    - For short numeric answers, use grading_mode "numeric_tolerance" when a small acceptable numeric range makes sense.
    - For short factual responses where wording can vary, use grading_mode "keyword_match" with 2 to 5 required_keywords that capture the key concepts.
    - For non-numeric short answers with a single fixed answer and all choice-based questions, use grading_mode "exact".
    - Infer question_type carefully: use "multiple_choice" only when the source visibly shows choices, use "true_false" only for clear true/false statements, otherwise use "short".
    - Use layout_hint to describe how the original question should appear in UI.
    - Prefer true/false answer_options exactly as ["True", "False"].
    - For numeric_tolerance, include a small explicit numeric_tolerance value such as 0, 0.1, 0.5, or 1 depending on the worksheet style.
    - For keyword_match, include minimum_keyword_matches when not all keywords are required.
    - Set generation_mode to "preserve_structure".
    Return strictly valid JSON only.
  `;

  const errors: string[] = [];

  for (const modelName of modelCandidates) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            generationConfig: {
              responseMimeType: "application/json",
            },
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inlineData: {
                      mimeType: "application/pdf",
                      data: pdfBase64,
                    },
                  },
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = (await response.json()) as GeminiGenerateContentResponse;

      if (!response.ok) {
        throw new Error(data.error?.message || `Gemini API request failed with status ${response.status}`);
      }

      if (data.promptFeedback?.blockReason) {
        throw new Error(
          data.promptFeedback.blockReasonMessage || `Gemini blocked the request: ${data.promptFeedback.blockReason}`
        );
      }

      const text = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();

      if (!text) {
        throw new Error("Gemini returned no text content for the PDF extraction request.");
      }

      return parseExtractionResult(text);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Gemini error";
      errors.push(`${modelName}: ${message}`);
      console.error(`Gemini Extraction Error (${modelName}):`, error);
    }
  }

  throw new Error(`Failed to extract questions from PDF using Gemini. ${errors.join(" | ")}`);
}
