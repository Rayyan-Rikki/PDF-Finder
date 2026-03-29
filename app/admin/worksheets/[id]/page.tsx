import Link from "next/link";
import { ArrowLeft, AlertCircle, BookOpen, Clock, ExternalLink, FileText, Sparkles, Wand2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RetryProcessingButton from "@/components/admin/RetryProcessingButton";
import DeleteWorksheetButton from "@/components/admin/DeleteWorksheetButton";
import UnpublishWorksheetButton from "@/components/admin/UnpublishWorksheetButton";
import { getDraftDriftSummary } from "@/lib/worksheets/drift";

type RawProcessingRecord = {
  ai_output_json?: {
    worksheet_summary?: string;
    detected_class_level?: string;
    detected_subject?: string;
    style_notes?: string;
    generation_mode?: string;
    questions?: Array<{
      question_text?: string;
      answer_text?: string;
      question_type?: string;
      grading_mode?: string;
      answer_options?: string[];
      accepted_answer_variants?: string[];
      required_keywords?: string[];
      minimum_keyword_matches?: number;
      explanation?: string;
      generation_basis?: string;
    }>;
  } | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "published":
      return <Badge variant="success">Published</Badge>;
    case "draft_generated":
      return <Badge variant="info">Draft Ready</Badge>;
    case "processing":
      return <Badge variant="warning">Processing</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    case "reviewed":
      return <Badge variant="default">Reviewed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getQuestionTypeLabel(questionType?: string) {
  switch (questionType) {
    case "multiple_choice":
      return "Multiple Choice";
    case "true_false":
      return "True / False";
    default:
      return "Short";
  }
}

function getGenerationBasisBadge(generationBasis?: string) {
  switch (generationBasis) {
    case "extracted":
      return <Badge variant="outline">Extracted</Badge>;
    case "manual":
      return <Badge variant="secondary">Manual</Badge>;
    default:
      return <Badge variant="info">Generated Similar</Badge>;
  }
}

export default async function AdminWorksheetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: worksheet }, { data: rawProcessing }, { count: publishedQuestionCount }] = await Promise.all([
    supabase.from("worksheets").select("*").eq("id", id).single(),
    supabase.from("raw_processing").select("ai_output_json, created_at, updated_at").eq("worksheet_id", id).maybeSingle(),
    supabase.from("questions").select("*", { count: "exact", head: true }).eq("worksheet_id", id).eq("is_published", true),
  ]);

  if (!worksheet) {
    return (
      <div className="space-y-6">
        <Button variant="outline" asChild>
          <Link href="/admin/worksheets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Worksheets
          </Link>
        </Button>
        <Card className="border-red-100 bg-red-50/40">
          <CardContent className="pt-8 text-center space-y-4">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <p className="font-semibold text-red-700">Worksheet not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const processing = rawProcessing as RawProcessingRecord | null;
  const aiOutput = processing?.ai_output_json || null;
  const generatedQuestions = aiOutput?.questions || [];
  const generatedQuestionCount = generatedQuestions.length;
  const extractedCount = generatedQuestions.filter((question) => question.generation_basis === "extracted").length;
  const similarCount = generatedQuestions.filter((question) => question.generation_basis !== "extracted").length;
  const previewQuestions = generatedQuestions.slice(0, 3);
  const draftDrift = getDraftDriftSummary({
    generatedQuestionCount,
    publishedQuestionCount: publishedQuestionCount || 0,
    rawUpdatedAt: processing?.updated_at,
    publishedAt: worksheet.published_at,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Button variant="outline" asChild className="w-fit">
            <Link href="/admin/worksheets">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Worksheets
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{worksheet.title}</h1>
            {getStatusBadge(worksheet.status)}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Badge variant="outline">{worksheet.subject}</Badge>
            <Badge variant="outline">{worksheet.class}</Badge>
            {worksheet.topic ? <span>Topic: {worksheet.topic}</span> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <a href={`/api/worksheets/${id}/pdf`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open PDF
            </a>
          </Button>
          <DeleteWorksheetButton worksheetId={id} title={worksheet.title} redirectTo="/admin/worksheets" />
          {worksheet.status === "draft_generated" ? (
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href={`/admin/review/${id}`}>Open Review</Link>
            </Button>
          ) : null}
          {worksheet.status === "published" ? (
            <>
              <Button variant="outline" asChild>
                <Link href={`/worksheets/${id}`}>
                  View Live
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <UnpublishWorksheetButton worksheetId={id} title={worksheet.title} redirectTo={`/admin/worksheets/${id}`} />
            </>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Worksheet Diagnostics
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Attempts</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{worksheet.processing_attempts ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">AI Draft Questions</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{generatedQuestionCount}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Published Questions</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{publishedQuestionCount || 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Generation Mix</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {similarCount} similar / {extractedCount} extracted
                </p>
              </div>
            </CardContent>
          </Card>

          {worksheet.processing_error ? (
            <Card className="border-red-200 bg-red-50/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  Processing Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-red-700">{worksheet.processing_error}</p>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wand2 className="h-5 w-5 text-blue-600" />
                AI Worksheet Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              {aiOutput?.worksheet_summary ? (
                <div>
                  <p className="font-semibold text-slate-900">Summary</p>
                  <p className="mt-1 leading-6">{aiOutput.worksheet_summary}</p>
                </div>
              ) : (
                <p className="text-slate-500">No AI worksheet summary is available yet.</p>
              )}
              <div className="flex flex-wrap gap-2">
                {aiOutput?.detected_subject ? <Badge variant="outline">{aiOutput.detected_subject}</Badge> : null}
                {aiOutput?.detected_class_level ? <Badge variant="outline">{aiOutput.detected_class_level}</Badge> : null}
                {aiOutput?.generation_mode ? <Badge variant="info">Mode: {aiOutput.generation_mode}</Badge> : null}
              </div>
              {aiOutput?.style_notes ? (
                <div>
                  <p className="font-semibold text-slate-900">Style Notes</p>
                  <p className="mt-1 leading-6">{aiOutput.style_notes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-blue-600" />
                Draft Question Preview
              </CardTitle>
              {worksheet.status === "draft_generated" ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/review/${id}`}>Open Full Review</Link>
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              {previewQuestions.length === 0 ? (
                <p className="text-sm text-slate-500">No draft questions are available yet.</p>
              ) : (
                previewQuestions.map((question, index) => (
                  <div key={`${question.question_text || "question"}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">Question {index + 1}</Badge>
                      <Badge variant="outline">{getQuestionTypeLabel(question.question_type)}</Badge>
                      <Badge variant="secondary">Grading: {question.grading_mode || "exact"}</Badge>
                      {getGenerationBasisBadge(question.generation_basis)}
                    </div>
                    <p className="mt-3 font-semibold leading-6 text-slate-900">{question.question_text || "Untitled question"}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      <span className="font-semibold text-slate-900">Answer:</span>{" "}
                      {question.answer_text || "No answer provided"}
                    </p>
                    {question.answer_options && question.answer_options.length > 0 ? (
                      <p className="mt-2 text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">Options:</span>{" "}
                        {question.answer_options.join(", ")}
                      </p>
                    ) : null}
                    {question.accepted_answer_variants && question.accepted_answer_variants.length > 0 ? (
                      <p className="mt-2 text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">Accepted Variants:</span>{" "}
                        {question.accepted_answer_variants.join(", ")}
                      </p>
                    ) : null}
                    {question.required_keywords && question.required_keywords.length > 0 ? (
                      <p className="mt-2 text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">Keywords:</span>{" "}
                        {question.required_keywords.join(", ")}
                        {typeof question.minimum_keyword_matches === "number"
                          ? ` (min ${question.minimum_keyword_matches})`
                          : ""}
                      </p>
                    ) : null}
                    {question.explanation ? (
                      <p className="mt-2 text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">Explanation:</span>{" "}
                        {question.explanation}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
              {generatedQuestionCount > previewQuestions.length ? (
                <p className="text-sm text-slate-500">
                  Showing {previewQuestions.length} of {generatedQuestionCount} draft questions.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-blue-600" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <div>
                <p className="font-semibold text-slate-900">Created</p>
                <p>{formatTimestamp(worksheet.created_at)}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Last Processed</p>
                <p>{formatTimestamp(worksheet.last_processed_at)}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Last Retry</p>
                <p>{formatTimestamp(worksheet.last_retry_at)}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Raw AI Output Updated</p>
                <p>{formatTimestamp(processing?.updated_at)}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Published</p>
                <p>{formatTimestamp(worksheet.published_at)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Processing State
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">Storage Path</p>
                <p className="mt-1 break-all text-xs">{worksheet.storage_path}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">Raw AI Output</p>
                <p className="mt-1">{processing ? "Available" : "Not generated yet"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">Draft Drift</p>
                  <Badge variant={draftDrift.variant}>{draftDrift.label}</Badge>
                </div>
                <p className="mt-1">{draftDrift.detail}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">Suggested Next Action</p>
                <p className="mt-1">
                  {worksheet.status === "draft_generated"
                    ? "Open review and publish after checking question quality."
                    : worksheet.status === "failed"
                      ? "Retry processing or inspect the failure reason above."
                      : worksheet.status === "published"
                        ? "View the live worksheet and confirm student-facing behavior."
                        : "Wait for processing to finish or inspect the PDF source."}
                </p>
              </div>
            </CardContent>
          </Card>

          {worksheet.status === "failed" ? (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="pt-6">
                <RetryProcessingButton worksheetId={id} />
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-blue-600" />
                Source PDF
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-[3/4] rounded-2xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center p-6">
                <FileText className="mb-3 h-14 w-14 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">Use the original PDF while reviewing AI output.</p>
              </div>
              <Button variant="outline" asChild className="w-full">
                <a href={`/api/worksheets/${id}/pdf`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Original PDF
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
