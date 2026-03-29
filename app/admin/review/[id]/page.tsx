"use client";

import { useEffect, useState, use, useCallback } from "react";
import { Trash2, Plus, ArrowLeft, Loader2, AlertCircle, FileText, Check, Sparkles, ExternalLink, Wand2 } from "lucide-react";
import { validateQuestions } from "@/lib/questions";
import { createClient } from "@/lib/supabase/client";
import { Worksheet, Question, ExtractionMetadata, QuestionGenerationBasis, QuestionGradingMode } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

type QuestionEditorState = {
  gradingModeTouched: boolean;
  answerOptionsTouched: boolean;
  numericToleranceTouched: boolean;
  minimumKeywordMatchesTouched: boolean;
};

const DEFAULT_TRUE_FALSE_OPTIONS = ["True", "False"];

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

function isNumericAnswer(value: string) {
  return /^-?[0-9]+(\.[0-9]+)?$/.test(value.trim());
}

function createEditorState(): QuestionEditorState {
  return {
    gradingModeTouched: false,
    answerOptionsTouched: false,
    numericToleranceTouched: false,
    minimumKeywordMatchesTouched: false,
  };
}

function applySmartDefaults(question: Question, editorState?: QuestionEditorState): Question {
  const questionType = (question.question_type || "short") as NonNullable<Question["question_type"]>;
  const nextQuestion: Question = {
    ...question,
    question_type: questionType,
    source_order: question.source_order,
    layout_hint: question.layout_hint,
    answer_options: question.answer_options || [],
    accepted_answer_variants: question.accepted_answer_variants || [],
    required_keywords: question.required_keywords || [],
  };

  if (
    questionType === "true_false" &&
    (!editorState?.answerOptionsTouched || (nextQuestion.answer_options || []).length === 0)
  ) {
    nextQuestion.answer_options = DEFAULT_TRUE_FALSE_OPTIONS;
  }

  if (!nextQuestion.layout_hint) {
    nextQuestion.layout_hint = getDefaultLayoutHint(questionType);
  }

  const hasKeywords = (nextQuestion.required_keywords || []).some((keyword) => keyword.trim().length > 0);
  const hasNumericAnswer = isNumericAnswer(nextQuestion.answer_text || "");
  const shouldKeepCurrentGrading = editorState?.gradingModeTouched;

  if (questionType !== "short") {
    if (!shouldKeepCurrentGrading) {
      nextQuestion.grading_mode = "exact";
    }
    if (!editorState?.numericToleranceTouched) {
      nextQuestion.numeric_tolerance = undefined;
    }
    if (!editorState?.minimumKeywordMatchesTouched) {
      nextQuestion.minimum_keyword_matches = undefined;
    }
    return nextQuestion;
  }

  if (!shouldKeepCurrentGrading) {
    if (hasKeywords) {
      nextQuestion.grading_mode = "keyword_match";
    } else if (hasNumericAnswer) {
      nextQuestion.grading_mode = "numeric_tolerance";
    } else {
      nextQuestion.grading_mode = nextQuestion.grading_mode || "exact";
    }
  } else {
    nextQuestion.grading_mode = nextQuestion.grading_mode || "exact";
  }

  if (nextQuestion.grading_mode === "keyword_match") {
    if (!editorState?.minimumKeywordMatchesTouched) {
      nextQuestion.minimum_keyword_matches =
        hasKeywords && (nextQuestion.minimum_keyword_matches === undefined || nextQuestion.minimum_keyword_matches === null)
          ? 1
          : nextQuestion.minimum_keyword_matches;
    }
    if (!editorState?.numericToleranceTouched) {
      nextQuestion.numeric_tolerance = undefined;
    }
  } else if (nextQuestion.grading_mode === "numeric_tolerance") {
    if (!editorState?.numericToleranceTouched) {
      nextQuestion.numeric_tolerance =
        nextQuestion.numeric_tolerance === undefined || nextQuestion.numeric_tolerance === null
          ? 0
          : nextQuestion.numeric_tolerance;
    }
    if (!editorState?.minimumKeywordMatchesTouched) {
      nextQuestion.minimum_keyword_matches = undefined;
    }
  } else {
    if (!editorState?.numericToleranceTouched) {
      nextQuestion.numeric_tolerance = undefined;
    }
    if (!editorState?.minimumKeywordMatchesTouched) {
      nextQuestion.minimum_keyword_matches = undefined;
    }
  }

  return nextQuestion;
}

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();
  const [worksheet, setWorksheet] = useState<Worksheet | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editorStates, setEditorStates] = useState<QuestionEditorState[]>([]);
  const [metadata, setMetadata] = useState<ExtractionMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [supabase] = useState(() => createClient());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch worksheet metadata
      const { data: ws, error: wsError } = await supabase
        .from("worksheets")
        .select("*")
        .eq("id", id)
        .single();
      
      if (wsError) throw wsError;
      setWorksheet(ws as Worksheet);

      // Fetch AI extraction result
      const { data: raw, error: rawError } = await supabase
        .from("raw_processing")
        .select("ai_output_json")
        .eq("worksheet_id", id)
        .single();
      
      if (rawError) throw rawError;
      
      if (raw && raw.ai_output_json && Array.isArray(raw.ai_output_json.questions)) {
        setMetadata({
          worksheet_summary:
            typeof raw.ai_output_json.worksheet_summary === "string" ? raw.ai_output_json.worksheet_summary : undefined,
          detected_class_level:
            typeof raw.ai_output_json.detected_class_level === "string"
              ? raw.ai_output_json.detected_class_level
              : undefined,
          detected_subject:
            typeof raw.ai_output_json.detected_subject === "string" ? raw.ai_output_json.detected_subject : undefined,
          style_notes: typeof raw.ai_output_json.style_notes === "string" ? raw.ai_output_json.style_notes : undefined,
          generation_mode:
            raw.ai_output_json.generation_mode === "generate_similar" || raw.ai_output_json.generation_mode === "preserve_structure"
              ? raw.ai_output_json.generation_mode
              : undefined,
        });
        const loadedQuestions = (raw.ai_output_json.questions as Question[])
          .map((question, index) =>
            applySmartDefaults(
              {
                ...question,
                source_order:
                  typeof question.source_order === "number" && Number.isFinite(question.source_order)
                    ? question.source_order
                    : index + 1,
              },
              createEditorState()
            )
          )
          .sort((a, b) => (a.source_order || 0) - (b.source_order || 0));
        setQuestions(loadedQuestions);
        setEditorStates(loadedQuestions.map(() => createEditorState()));
      } else {
        throw new Error("No extraction data found for this worksheet.");
      }
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load worksheet data.");
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateQuestion = (
    index: number,
    field: keyof Question,
    value: string | number | boolean | string[] | QuestionGenerationBasis | QuestionGradingMode | undefined
  ) => {
    const editorState = editorStates[index] || createEditorState();
    const nextEditorStates = [...editorStates];
    const nextState = { ...editorState };

    if (field === "grading_mode") {
      nextState.gradingModeTouched = true;
    }

    if (field === "answer_options") {
      nextState.answerOptionsTouched = true;
    }

    if (field === "numeric_tolerance") {
      nextState.numericToleranceTouched = true;
    }

    if (field === "minimum_keyword_matches") {
      nextState.minimumKeywordMatchesTouched = true;
    }

    nextEditorStates[index] = nextState;

    const updated = [...questions];
    updated[index] = applySmartDefaults(
      { ...updated[index], [field]: value } as Question,
      nextState
    );

    if (field === "source_order") {
      const sortedPairs = updated
        .map((questionItem, questionIndex) => ({
          question: questionItem,
          editorState: nextEditorStates[questionIndex],
        }))
        .sort((a, b) => (a.question.source_order || 0) - (b.question.source_order || 0));

      setQuestions(sortedPairs.map((pair) => pair.question));
      setEditorStates(sortedPairs.map((pair) => pair.editorState));
      return;
    }

    setEditorStates(nextEditorStates);
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
    setEditorStates(editorStates.filter((_, i) => i !== index));
  };

  const addQuestion = () => {
    const nextQuestion = applySmartDefaults(
      {
        question_text: "",
        answer_text: "",
        answer_options: [],
        accepted_answer_variants: [],
        question_type: "short",
        grading_mode: "exact",
        numeric_tolerance: undefined,
        required_keywords: [],
        minimum_keyword_matches: undefined,
        explanation: "",
        source_page: 1,
        source_order: questions.length + 1,
        layout_hint: "short_line",
        generation_basis: "manual",
        style_notes: "",
      },
      createEditorState()
    );
    setQuestions([...questions, nextQuestion]);
    setEditorStates([...editorStates, createEditorState()]);
  };

  const getGenerationBadge = (basis?: QuestionGenerationBasis) => {
    switch (basis) {
      case "extracted":
        return <Badge variant="outline">Extracted From PDF</Badge>;
      case "manual":
        return <Badge variant="secondary">Manual</Badge>;
      default:
        return <Badge variant="info">Generated Similar</Badge>;
    }
  };

  const variantsToText = (variants?: string[]) => (variants && variants.length > 0 ? variants.join("\n") : "");

  const textToVariants = (value: string) =>
    value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);

  const optionsToText = (options?: string[]) => (options && options.length > 0 ? options.join("\n") : "");
  const keywordsToText = (keywords?: string[]) => (keywords && keywords.length > 0 ? keywords.join("\n") : "");
  const validationIssues = validateQuestions(questions);

  const handlePublish = async () => {
    if (validationIssues.length > 0) {
      const firstIssue = validationIssues[0];
      setError(`Question ${firstIssue.index + 1}: ${firstIssue.message}`);
      return;
    }

    setPublishing(true);
    setError("");
    try {
      const res = await fetch(`/api/worksheets/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: [...questions].sort((a, b) => (a.source_order || 0) - (b.source_order || 0)),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Publishing failed");

      router.push("/admin/worksheets");
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-slate-500 font-medium">Loading extracted Q&A data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-xl mx-auto border-red-100 bg-red-50/30">
        <CardContent className="pt-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-red-700 font-semibold">{error}</p>
          <Button variant="outline" asChild>
            <Link href="/admin/worksheets">Back to Worksheets</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="h-10 w-10">
            <Link href="/admin/worksheets">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Review Questions</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{worksheet?.class}</Badge>
              <span className="text-slate-400">•</span>
              <p className="text-slate-500 text-sm font-medium">{worksheet?.title}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none h-11" onClick={addQuestion}>
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
          <Button className="flex-1 md:flex-none h-11 bg-blue-600 hover:bg-blue-700 shadow-lg px-8" onClick={handlePublish} disabled={publishing}>
            {publishing ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Check className="mr-2 h-5 w-5" />
            )}
            Publish Quiz
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex gap-3 text-blue-800">
            <Sparkles className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">
              <span className="font-bold">AI Extraction Complete.</span> Gemini parsed the worksheet once and stored a draft that preserves the PDF's question type and order. Review it before publishing to students.
            </p>
          </div>

          {validationIssues.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-900">
              <p className="text-sm font-semibold">Publishing is blocked until validation issues are fixed.</p>
              <p className="text-sm mt-1">First issue: Question {validationIssues[0].index + 1}: {validationIssues[0].message}</p>
            </div>
          )}

          {metadata && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-blue-600" />
                  Worksheet Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-600">
                {metadata.worksheet_summary && (
                  <div>
                    <p className="font-semibold text-slate-900">Summary</p>
                    <p>{metadata.worksheet_summary}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {metadata.detected_subject && <Badge variant="outline">{metadata.detected_subject}</Badge>}
                  {metadata.detected_class_level && <Badge variant="outline">{metadata.detected_class_level}</Badge>}
                  {metadata.generation_mode && (
                    <Badge variant="info">
                      Mode: {metadata.generation_mode === "preserve_structure" ? "preserve_structure" : metadata.generation_mode}
                    </Badge>
                  )}
                </div>
                {metadata.style_notes && (
                  <div>
                    <p className="font-semibold text-slate-900">Style Notes</p>
                    <p>{metadata.style_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {questions.map((q, idx) => (
            <Card key={idx} className="border-slate-200 shadow-sm relative group hover:border-blue-200 transition-colors">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8" onClick={() => removeQuestion(idx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <CardHeader className="pb-3 px-6">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                    {idx + 1}
                  </div>
                  <CardTitle className="text-lg">Question {q.source_order || idx + 1}</CardTitle>
                  {getGenerationBadge(q.generation_basis)}
                  {validationIssues.some((issue) => issue.index === idx) && <Badge variant="warning">Needs Fix</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-6">
                <div className="space-y-2">
                  <Label>Question Text</Label>
                  <Textarea 
                    value={q.question_text} 
                    onChange={(e) => updateQuestion(idx, 'question_text', e.target.value)}
                    className="min-h-[80px] border-slate-200 focus:ring-blue-500"
                    placeholder="Enter the question..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Correct Answer</Label>
                    <Input 
                      value={q.answer_text} 
                      onChange={(e) => updateQuestion(idx, 'answer_text', e.target.value)}
                      className="border-slate-200 focus:ring-blue-500"
                      placeholder="Enter the correct answer..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Question Type</Label>
                    <div className="flex flex-wrap gap-2">
                      {(["short", "multiple_choice", "true_false"] as const).map((type) => (
                        <Button
                          key={type}
                          type="button"
                          variant={q.question_type === type ? "default" : "outline"}
                          className="h-9"
                          onClick={() => updateQuestion(idx, "question_type", type)}
                        >
                          {type === "short" ? "Short" : type === "multiple_choice" ? "Multiple Choice" : "True / False"}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Answer Options {q.question_type === "short" ? "(Optional)" : ""}</Label>
                    <Textarea
                      value={optionsToText(q.answer_options)}
                      onChange={(e) => updateQuestion(idx, "answer_options", textToVariants(e.target.value))}
                      className="min-h-[80px] border-slate-200 focus:ring-blue-500"
                      placeholder={
                        q.question_type === "true_false"
                          ? "True\nFalse"
                          : "Add one option per line.\nExample:\nMercury\nVenus\nEarth\nMars"
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Source Page</Label>
                    <Input 
                      type="number"
                      value={q.source_page || 1} 
                      onChange={(e) => updateQuestion(idx, 'source_page', parseInt(e.target.value, 10) || 1)}
                      className="border-slate-200 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Source Order</Label>
                    <Input 
                      type="number"
                      value={q.source_order || idx + 1}
                      onChange={(e) => updateQuestion(idx, 'source_order', parseInt(e.target.value, 10) || idx + 1)}
                      className="border-slate-200 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Layout Hint</Label>
                  <div className="flex flex-wrap gap-2">
                    {(["mcq_vertical", "mcq_inline", "short_line", "paragraph_answer", "true_false_row", "unknown"] as const).map((layoutHint) => (
                      <Button
                        key={layoutHint}
                        type="button"
                        variant={(q.layout_hint || "unknown") === layoutHint ? "default" : "outline"}
                        className="h-9"
                        onClick={() => updateQuestion(idx, "layout_hint", layoutHint)}
                      >
                        {layoutHint}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Generation Basis</Label>
                  <div className="flex flex-wrap gap-2">
                    {(["generated_similar", "extracted", "manual"] as const).map((basis) => (
                      <Button
                        key={basis}
                        type="button"
                        variant={q.generation_basis === basis ? "default" : "outline"}
                        className="h-9"
                        onClick={() => updateQuestion(idx, "generation_basis", basis)}
                      >
                        {basis === "generated_similar"
                          ? "Generated Similar"
                          : basis === "extracted"
                            ? "Extracted"
                            : "Manual"}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Grading Mode</Label>
                    <div className="flex flex-wrap gap-2">
                      {(["exact", "numeric_tolerance", "keyword_match"] as const).map((mode) => (
                        <Button
                          key={mode}
                          type="button"
                          variant={(q.grading_mode || "exact") === mode ? "default" : "outline"}
                          className="h-9"
                          onClick={() => updateQuestion(idx, "grading_mode", mode)}
                        >
                          {mode === "exact" ? "Exact" : mode === "numeric_tolerance" ? "Numeric Tolerance" : "Keyword Match"}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{(q.grading_mode || "exact") === "keyword_match" ? "Minimum Keyword Matches" : "Numeric Tolerance"}</Label>
                    <Input
                      type="number"
                      step={(q.grading_mode || "exact") === "keyword_match" ? "1" : "any"}
                      value={(q.grading_mode || "exact") === "keyword_match" ? (q.minimum_keyword_matches ?? "") : (q.numeric_tolerance ?? "")}
                      onChange={(e) =>
                        (q.grading_mode || "exact") === "keyword_match"
                          ? updateQuestion(
                              idx,
                              "minimum_keyword_matches",
                              e.target.value === "" ? undefined : Number(e.target.value)
                            )
                          : updateQuestion(
                              idx,
                              "numeric_tolerance",
                              e.target.value === "" ? undefined : Number(e.target.value)
                            )
                      }
                      className="border-slate-200 focus:ring-blue-500"
                      placeholder={(q.grading_mode || "exact") === "keyword_match" ? "e.g. 2" : "e.g. 0.1"}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Required Keywords {(q.grading_mode || "exact") === "keyword_match" ? "" : "(Optional)"}</Label>
                  <Textarea
                    value={keywordsToText(q.required_keywords)}
                    onChange={(e) => updateQuestion(idx, "required_keywords", textToVariants(e.target.value))}
                    className="min-h-[80px] border-slate-200 focus:ring-blue-500"
                    placeholder={"Add one keyword or phrase per line.\nExample:\nphotosynthesis\nchlorophyll\nsunlight"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Explanation (Optional)</Label>
                  <Textarea 
                    value={q.explanation || ""} 
                    onChange={(e) => updateQuestion(idx, 'explanation', e.target.value)}
                    className="min-h-[60px] border-slate-200 focus:ring-blue-500"
                    placeholder="Briefly explain the answer..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Accepted Answer Variants (Optional)</Label>
                  <Textarea
                    value={variantsToText(q.accepted_answer_variants)}
                    onChange={(e) => updateQuestion(idx, "accepted_answer_variants", textToVariants(e.target.value))}
                    className="min-h-[80px] border-slate-200 focus:ring-blue-500"
                    placeholder={"Add one alternate correct answer per line.\nExample:\nH2O\nWater"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Style Match Notes (Optional)</Label>
                  <Textarea
                    value={q.style_notes || ""}
                    onChange={(e) => updateQuestion(idx, "style_notes", e.target.value)}
                    className="min-h-[60px] border-slate-200 focus:ring-blue-500"
                    placeholder="Why does this question match the worksheet style?"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Button variant="ghost" className="w-full border-2 border-dashed border-slate-200 text-slate-500 h-20 hover:border-slate-300 hover:bg-slate-50" onClick={addQuestion}>
            <Plus className="mr-2 h-5 w-5" />
            Add another question manually
          </Button>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm sticky top-8">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Worksheet PDF
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 text-center space-y-6">
              <div className="w-full aspect-[3/4] bg-slate-100 rounded-lg flex flex-col items-center justify-center border border-slate-200 p-8">
                <FileText className="w-16 h-16 text-slate-300 mb-4" />
                <p className="text-slate-500 text-sm mb-4">You can refer to the original PDF while reviewing questions.</p>
                <Button variant="outline" className="w-full" asChild>
                  <a href={`/api/worksheets/${id}/pdf`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open PDF to Compare
                  </a>
                </Button>
              </div>
              
              <div className="pt-4 border-t text-left">
                 <h4 className="font-semibold text-slate-900 mb-2">Publishing Tips</h4>
                 <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4">
                   <li>Check for spelling errors in AI output.</li>
                   <li>Ensure answers are concise but complete.</li>
                   <li>Assign correct page numbers for reference.</li>
                   <li>Once published, students can start practicing immediately.</li>
                 </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
