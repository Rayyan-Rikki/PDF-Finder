export type DraftDriftVariant = "outline" | "warning" | "destructive" | "success";

export interface DraftDriftSummary {
  label: string;
  variant: DraftDriftVariant;
  detail: string;
}

export function getDraftDriftSummary(params: {
  generatedQuestionCount: number;
  publishedQuestionCount?: number | null;
  rawUpdatedAt?: string | null;
  publishedAt?: string | null;
}): DraftDriftSummary {
  const {
    generatedQuestionCount,
    publishedQuestionCount = 0,
    rawUpdatedAt,
    publishedAt,
  } = params;

  if (generatedQuestionCount === 0) {
    return {
      label: "No Draft",
      variant: "outline",
      detail: "No AI draft questions exist yet for this worksheet.",
    };
  }

  if (!publishedAt || publishedQuestionCount === 0) {
    return {
      label: "Draft Never Published",
      variant: "warning",
      detail: "A draft exists, but no published quiz has been created from it yet.",
    };
  }

  const rawUpdatedTime = rawUpdatedAt ? new Date(rawUpdatedAt).getTime() : 0;
  const publishedTime = new Date(publishedAt).getTime();
  const hasNewerDraft = rawUpdatedTime > publishedTime;
  const countMismatch = generatedQuestionCount !== publishedQuestionCount;

  if (hasNewerDraft && countMismatch) {
    return {
      label: "Draft Out Of Sync",
      variant: "destructive",
      detail: "The AI draft is newer than the published quiz and the question counts no longer match.",
    };
  }

  if (hasNewerDraft) {
    return {
      label: "Newer Draft Available",
      variant: "warning",
      detail: "The AI draft was updated after the last publish and should be reviewed before republishing.",
    };
  }

  if (countMismatch) {
    return {
      label: "Count Mismatch",
      variant: "warning",
      detail: "The draft and published question counts differ, so the published quiz may be stale.",
    };
  }

  return {
    label: "Draft Matches Published",
    variant: "success",
    detail: "The latest draft and published quiz look aligned based on timestamps and question counts.",
  };
}

export function getRawDraftQuestionCount(aiOutputJson: unknown) {
  if (!aiOutputJson || typeof aiOutputJson !== "object") {
    return 0;
  }

  const questions = (aiOutputJson as { questions?: unknown[] }).questions;
  return Array.isArray(questions) ? questions.length : 0;
}
