"use client";

import { useEffect, useState, use as useReact } from "react";
import { CheckCircle2, Save, Trash2, Plus, ArrowLeft, Loader2, AlertCircle, FileText, LayoutList, Check, Sparkles, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = useReact(params);
  const id = unwrappedParams.id;
  const router = useRouter();
  const [worksheet, setWorksheet] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch worksheet metadata
      const { data: ws, error: wsError } = await supabase
        .from("worksheets")
        .select("*")
        .eq("id", id)
        .single();
      
      if (wsError) throw wsError;
      setWorksheet(ws);

      // Fetch AI extraction result
      const { data: raw, error: rawError } = await supabase
        .from("raw_processing")
        .select("ai_output_json")
        .eq("worksheet_id", id)
        .single();
      
      if (rawError) throw rawError;
      
      if (raw && raw.ai_output_json && Array.isArray(raw.ai_output_json.questions)) {
        setQuestions(raw.ai_output_json.questions);
      } else {
        throw new Error("No extraction data found for this worksheet.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load worksheet data.");
    } finally {
      setLoading(false);
    }
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { question_text: "", answer_text: "", question_type: "short", explanation: "", source_page: 1 }
    ]);
  };

  const handlePublish = async () => {
    setPublishing(true);
    setError("");
    try {
      const res = await fetch(`/api/worksheets/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Publishing failed");

      router.push("/admin/worksheets");
    } catch (err: any) {
      console.error(err);
      setError(err.message);
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
              <span className="font-bold">AI Extraction Complete!</span> These questions were extracted by Gemini. Please review, edit, or remove them before publishing to students.
            </p>
          </div>

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
                  <CardTitle className="text-lg">Question {idx + 1}</CardTitle>
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
                    <Label>Source Page</Label>
                    <Input 
                      type="number"
                      value={q.source_page || 1} 
                      onChange={(e) => updateQuestion(idx, 'source_page', parseInt(e.target.value))}
                      className="border-slate-200 focus:ring-blue-500"
                    />
                  </div>
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
                  <a href={worksheet?.pdf_url} target="_blank" rel="noopener noreferrer">
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
