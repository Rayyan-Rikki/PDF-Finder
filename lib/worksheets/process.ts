import { extractQuizFromPDF } from "@/lib/ai/gemini";
import { formatValidationIssues, normalizeQuestionsForStorage, validateQuestions } from "@/lib/questions";
import { createAdminClient } from "@/lib/supabase/admin";

export async function processWorksheetPDF(params: {
  worksheetId: string;
  pdfBase64: string;
}) {
  const { worksheetId, pdfBase64 } = params;
  const supabase = createAdminClient();
  const processedAt = new Date().toISOString();

  try {
    const extractionResult = await extractQuizFromPDF(pdfBase64);
    const normalizedQuestions = normalizeQuestionsForStorage(extractionResult.questions);
    const validationIssues = validateQuestions(normalizedQuestions);

    if (validationIssues.length > 0) {
      throw new Error(`AI generated invalid worksheet questions. ${formatValidationIssues(validationIssues)}`);
    }

    const normalizedExtractionResult = {
      ...extractionResult,
      questions: normalizedQuestions,
    };

    const { error: rawError } = await supabase.from("raw_processing").upsert(
      {
        worksheet_id: worksheetId,
        ai_output_json: normalizedExtractionResult,
      },
      {
        onConflict: "worksheet_id",
      }
    );

    if (rawError) {
      throw new Error(`Failed to save AI output: ${rawError.message}`);
    }

    const { error: worksheetError } = await supabase
      .from("worksheets")
      .update({ status: "draft_generated", processing_error: null, last_processed_at: processedAt })
      .eq("id", worksheetId);

    if (worksheetError) {
      throw new Error(`Failed to update worksheet status: ${worksheetError.message}`);
    }

    return normalizedExtractionResult;
  } catch (error) {
    const details = error instanceof Error ? error.message : "AI quiz generation failed.";
    await supabase
      .from("worksheets")
      .update({ status: "failed", processing_error: details, last_processed_at: processedAt })
      .eq("id", worksheetId);
    throw error;
  }
}
