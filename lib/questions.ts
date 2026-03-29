import { Question } from "@/lib/types";

export interface QuestionValidationIssue {
  index: number;
  message: string;
}

export interface AnswerEvaluation {
  isCorrect: boolean;
  gradingMode: NonNullable<Question["grading_mode"]>;
  acceptedRange?: {
    min: number;
    max: number;
  };
  matchedKeywords?: string[];
  missingKeywords?: string[];
  minimumKeywordMatches?: number;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}

function normalizeOption(value: string) {
  return value.trim();
}

function hasMatchingOption(options: string[], answerText: string) {
  const normalizedAnswer = normalizeOption(answerText).toLowerCase();
  return options.some((option) => normalizeOption(option).toLowerCase() === normalizedAnswer);
}

function isNumeric(value: string) {
  return /^-?[0-9]+(\.[0-9]+)?$/.test(value.trim());
}

function normalizeKeyword(value: string) {
  return value.trim().toLowerCase();
}

function getDefaultLayoutHint(questionType: NonNullable<Question["question_type"]>): NonNullable<Question["layout_hint"]> {
  switch (questionType) {
    case "multiple_choice":
      return "mcq_vertical";
    case "true_false":
      return "true_false_row";
    default:
      return "short_line";
  }
}

function normalizeFreeformAnswer(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[.,/#!$%^&*;:{}=_`~()?"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function evaluateAnswer(question: Question, attemptedAnswer: string): AnswerEvaluation {
  const gradingMode = question.grading_mode || "exact";
  const normalizedAttempt = normalizeFreeformAnswer(attemptedAnswer);
  const normalizedAcceptedAnswers = [question.answer_text, ...(question.accepted_answer_variants || [])]
    .map((answer) => normalizeFreeformAnswer(answer))
    .filter(Boolean);

  if (normalizedAcceptedAnswers.includes(normalizedAttempt)) {
    return {
      isCorrect: true,
      gradingMode,
    };
  }

  if (gradingMode === "numeric_tolerance") {
    const numericTolerance = question.numeric_tolerance;
    if (
      typeof numericTolerance === "number" &&
      Number.isFinite(numericTolerance) &&
      isNumeric(question.answer_text) &&
      isNumeric(attemptedAnswer)
    ) {
      const expected = Number(question.answer_text);
      const actual = Number(attemptedAnswer);
      return {
        isCorrect: Math.abs(actual - expected) <= numericTolerance,
        gradingMode,
        acceptedRange: {
          min: expected - numericTolerance,
          max: expected + numericTolerance,
        },
      };
    }
  }

  if (gradingMode === "keyword_match") {
    const requiredKeywords = (question.required_keywords || []).map(normalizeKeyword).filter(Boolean);
    const minimumKeywordMatches = question.minimum_keyword_matches || requiredKeywords.length;
    const normalizedAnswer = attemptedAnswer.trim().toLowerCase();

    if (requiredKeywords.length > 0 && normalizedAnswer) {
      const matchedKeywords = requiredKeywords.filter((keyword) => normalizedAnswer.includes(keyword));
      const missingKeywords = requiredKeywords.filter((keyword) => !normalizedAnswer.includes(keyword));
      return {
        isCorrect: matchedKeywords.length >= minimumKeywordMatches,
        gradingMode,
        matchedKeywords,
        missingKeywords,
        minimumKeywordMatches,
      };
    }
  }

  return {
    isCorrect: false,
    gradingMode,
  };
}

export function isCorrectAnswer(question: Question, attemptedAnswer: string) {
  return evaluateAnswer(question, attemptedAnswer).isCorrect;
}

export function normalizeQuestionForStorage(question: Question): Question {
  const questionType = question.question_type || "short";
  const gradingMode = question.grading_mode || "exact";
  const normalizedOptions = uniqueStrings((question.answer_options || []).map(normalizeOption).filter(Boolean));
  const normalizedVariants = uniqueStrings(
    (question.accepted_answer_variants || []).map((variant) => variant.trim()).filter(Boolean)
  );
  const normalizedKeywords = uniqueStrings((question.required_keywords || []).map(normalizeKeyword).filter(Boolean));
  const normalizedQuestion: Question = {
    ...question,
    question_text: question.question_text.trim(),
    answer_text: question.answer_text.trim(),
    question_type: questionType,
    grading_mode: gradingMode,
    source_order:
      typeof question.source_order === "number" && Number.isFinite(question.source_order) && question.source_order > 0
        ? Math.floor(question.source_order)
        : undefined,
    layout_hint: question.layout_hint || getDefaultLayoutHint(questionType),
    answer_options: normalizedOptions.length > 0 ? normalizedOptions : undefined,
    accepted_answer_variants: normalizedVariants.length > 0 ? normalizedVariants : undefined,
    required_keywords: normalizedKeywords.length > 0 ? normalizedKeywords : undefined,
  };

  if (questionType === "true_false") {
    normalizedQuestion.answer_options = ["True", "False"];
  }

  if (gradingMode !== "numeric_tolerance") {
    normalizedQuestion.numeric_tolerance = undefined;
  } else if (
    typeof normalizedQuestion.numeric_tolerance === "number" &&
    Number.isFinite(normalizedQuestion.numeric_tolerance)
  ) {
    normalizedQuestion.numeric_tolerance = Math.max(0, normalizedQuestion.numeric_tolerance);
  }

  if (gradingMode !== "keyword_match") {
    normalizedQuestion.required_keywords = undefined;
    normalizedQuestion.minimum_keyword_matches = undefined;
  } else if (
    typeof normalizedQuestion.minimum_keyword_matches === "number" &&
    Number.isFinite(normalizedQuestion.minimum_keyword_matches)
  ) {
    normalizedQuestion.minimum_keyword_matches = Math.max(1, Math.floor(normalizedQuestion.minimum_keyword_matches));
  }

  return normalizedQuestion;
}

export function normalizeQuestionsForStorage(questions: Question[]) {
  return questions.map(normalizeQuestionForStorage);
}

export function formatValidationIssues(issues: QuestionValidationIssue[], maxIssues = 3) {
  return issues
    .slice(0, maxIssues)
    .map((issue) => `Question ${issue.index + 1}: ${issue.message}`)
    .join(" ");
}

export function validateQuestions(questions: Question[]): QuestionValidationIssue[] {
  const issues: QuestionValidationIssue[] = [];

  questions.forEach((question, index) => {
    const questionText = question.question_text.trim();
    const answerText = question.answer_text.trim();
    const questionType = question.question_type || "short";
    const gradingMode = question.grading_mode || "exact";
    const numericTolerance = question.numeric_tolerance;
    const requiredKeywords = (question.required_keywords || []).map(normalizeKeyword).filter(Boolean);
    const minimumKeywordMatches = question.minimum_keyword_matches;
    const answerOptions = (question.answer_options || []).map(normalizeOption).filter(Boolean);
    const sourceOrder = question.source_order;

    if (!questionText) {
      issues.push({ index, message: "Question text is required." });
    }

    if (!answerText) {
      issues.push({ index, message: "Correct answer is required." });
    }

    if (sourceOrder !== undefined && (!Number.isInteger(sourceOrder) || sourceOrder <= 0)) {
      issues.push({ index, message: "Source order must be a positive integer when provided." });
    }

    if (questionType === "multiple_choice") {
      if (answerOptions.length < 3) {
        issues.push({ index, message: "Multiple-choice questions need at least 3 options." });
      }

      if (!hasMatchingOption(answerOptions, answerText)) {
        issues.push({ index, message: "Multiple-choice answer must match one of the options." });
      }
    }

    if (questionType === "true_false") {
      const normalizedOptions = answerOptions.map((option) => option.toLowerCase());
      const hasTrue = normalizedOptions.includes("true");
      const hasFalse = normalizedOptions.includes("false");

      if (!hasTrue || !hasFalse) {
        issues.push({ index, message: 'True/false questions must include both "True" and "False" options.' });
      }

      if (!["true", "false"].includes(answerText.toLowerCase())) {
        issues.push({ index, message: 'True/false answer must be exactly "True" or "False".' });
      }
    }

    if (gradingMode === "numeric_tolerance") {
      if (questionType !== "short") {
        issues.push({ index, message: "Numeric tolerance grading can only be used for short-answer questions." });
      }

      if (typeof numericTolerance !== "number" || !Number.isFinite(numericTolerance) || numericTolerance < 0) {
        issues.push({ index, message: "Numeric tolerance must be a non-negative number." });
      }

      if (!isNumeric(answerText)) {
        issues.push({ index, message: "Numeric tolerance grading requires a numeric correct answer." });
      }
    }

    if (gradingMode === "keyword_match") {
      if (questionType !== "short") {
        issues.push({ index, message: "Keyword-match grading can only be used for short-answer questions." });
      }

      if (requiredKeywords.length === 0) {
        issues.push({ index, message: "Keyword-match grading requires at least one required keyword." });
      }

      if (
        minimumKeywordMatches !== undefined &&
        (!Number.isInteger(minimumKeywordMatches) || minimumKeywordMatches <= 0)
      ) {
        issues.push({ index, message: "Minimum keyword matches must be a positive integer." });
      }

      if (
        typeof minimumKeywordMatches === "number" &&
        requiredKeywords.length > 0 &&
        minimumKeywordMatches > requiredKeywords.length
      ) {
        issues.push({ index, message: "Minimum keyword matches cannot exceed the number of required keywords." });
      }
    }
  });

  return issues;
}
