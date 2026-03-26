"use client";

import { useEffect, useState, use as useReact, useCallback } from "react";
import { CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Sparkles, RefreshCcw, Home, FileText, Check, X, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Worksheet, Question } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = useReact(params);
  const id = unwrappedParams.id;
  
  const [worksheet, setWorksheet] = useState<Worksheet | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<"none" | "correct" | "incorrect">("none");
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const supabase = createClient();

   const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: ws, error: wsError } = await supabase
        .from("worksheets")
        .select("*")
        .eq("id", id)
        .single();
      
      if (wsError) throw wsError;
      setWorksheet(ws as Worksheet);

      const { data: qs, error: qsError } = await supabase
        .from("questions")
        .select("*")
        .eq("worksheet_id", id)
        .eq("is_published", true)
        .order("created_at", { ascending: true });
      
      if (qsError) throw qsError;
      setQuestions((qs as Question[]) || []);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load worksheet quiz.");
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const checkAnswer = () => {
    if (!userAnswer.trim()) return;

    const currentQuestion = questions[currentIndex];
    const cleanUser = userAnswer.toLowerCase().replace(/\s+/g, '').trim();
    const cleanCorrect = currentQuestion.answer_text.toLowerCase().replace(/\s+/g, '').trim();

    if (cleanUser === cleanCorrect) {
      setFeedback("correct");
      setScore(score + 1);
    } else {
      setFeedback("incorrect");
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer("");
      setFeedback("none");
    } else {
      setShowResult(true);
    }
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setUserAnswer("");
    setFeedback("none");
    setScore(0);
    setShowResult(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400 w-6 h-6" />
        </div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Generating your practice session...</p>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-red-50 text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl font-black text-red-900 uppercase tracking-tighter">Quiz Unavailable</CardTitle>
          </CardHeader>
          <CardContent className="p-10 text-center space-y-6">
            <p className="text-slate-500 font-medium">
              {error || "This worksheet doesn't have any published questions yet. Contact the administrator."}
            </p>
            <Button size="lg" className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-lg font-bold" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
        <Card className="max-w-2xl w-full border-none shadow-2xl rounded-[3rem] overflow-hidden">
          <div className="bg-blue-600 py-20 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <Trophy className="w-24 h-24 mx-auto mb-6 drop-shadow-lg" />
            <h2 className="text-5xl font-black tracking-tighter uppercase">Workshop Complete!</h2>
            <p className="text-blue-100 font-bold tracking-widest uppercase text-sm mt-2 opacity-80">Excellent effort on {worksheet?.title}</p>
          </div>
          
          <CardContent className="p-12 space-y-12">
            <div className="flex justify-center gap-12">
               <div className="text-center space-y-1">
                 <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Score</p>
                 <p className="text-4xl font-black text-slate-900">{score} / {questions.length}</p>
               </div>
               <div className="w-px bg-slate-100"></div>
               <div className="text-center space-y-1">
                 <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Accuracy</p>
                 <p className="text-4xl font-black text-blue-600">{percentage}%</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button size="lg" variant="outline" className="h-16 rounded-2xl border-slate-200 text-xl font-bold bg-white" onClick={restartQuiz}>
                <RefreshCcw className="mr-2 h-6 w-6" />
                Retry
              </Button>
              <Button size="lg" className="h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-xl font-bold" asChild>
                <Link href="/">
                  <Home className="mr-2 h-6 w-6" />
                  Home
                </Link>
              </Button>
            </div>
            
            <div className="pt-6 border-t text-center">
               <p className="text-slate-400 text-sm font-medium">Challenge yourself again to master the topic of <span className="text-slate-900 font-black">{worksheet?.subject}</span>.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <nav className="bg-white border-b border-slate-100 h-20 flex items-center px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
           <div className="flex items-center gap-6">
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-slate-50 text-slate-400" asChild>
                <Link href="/">
                  <ArrowLeft className="w-6 h-6" />
                </Link>
              </Button>
              <div className="hidden md:block">
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{worksheet?.subject} • {worksheet?.class}</p>
                <p className="text-slate-900 font-black text-lg truncate max-w-[300px] uppercase tracking-tighter">{worksheet?.title}</p>
              </div>
           </div>
           
           <div className="flex-1 max-w-md mx-8">
              <div className="flex justify-between mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                 <span>Progress</span>
                 <span>{currentIndex + 1} of {questions.length}</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 p-0.5">
                 <div className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(37,99,235,0.4)]" style={{ width: `${progress}%` }}></div>
              </div>
           </div>

           <div className="flex items-center gap-2">
              <Badge className="bg-emerald-50 text-emerald-600 border-none font-black hidden sm:flex">
                <CheckCircle2 className="w-3 h-3 mr-1.5" />
                {score} Correct
              </Badge>
           </div>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-6 py-12">
        <div className="max-w-4xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className="border-none shadow-2xl rounded-[3.5rem] overflow-hidden bg-white">
            <CardHeader className="p-12 pb-6">
               <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest mb-4">
                  Question {currentIndex + 1}
               </div>
               <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight uppercase tracking-tight">
                  {currentQ.question_text}
               </h2>
            </CardHeader>
            <CardContent className="px-12 pb-12 space-y-10">
               <div className="space-y-4">
                  <Label htmlFor="answer" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Your response</Label>
                  <div className="relative group">
                    <Input 
                      id="answer"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      disabled={feedback !== "none"}
                      onKeyDown={(e) => e.key === "Enter" && feedback === "none" && checkAnswer()}
                      placeholder="Type your answer here..."
                      className={cn(
                        "h-20 px-8 text-2xl font-bold rounded-3xl border-2 transition-all duration-300",
                        feedback === "none" ? "border-slate-100 bg-slate-50 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 shadow-sm" :
                        feedback === "correct" ? "border-emerald-200 bg-emerald-50/50 text-emerald-800" :
                        "border-red-200 bg-red-50/50 text-red-800"
                      )}
                      autoComplete="off"
                    />
                    {feedback === "correct" && <Check className="absolute right-8 top-1/2 -translate-y-1/2 w-8 h-8 text-emerald-500 animate-in zoom-in duration-300" />}
                    {feedback === "incorrect" && <X className="absolute right-8 top-1/2 -translate-y-1/2 w-8 h-8 text-red-500 animate-in zoom-in duration-300" />}
                  </div>
               </div>

               {feedback !== "none" && (
                 <div className={cn(
                   "p-8 rounded-[2.5rem] border-2 animate-in slide-in-from-top-4 duration-500 flex flex-col md:flex-row items-center md:items-start gap-6",
                   feedback === "correct" ? "bg-emerald-600 text-white border-emerald-400 shadow-xl shadow-emerald-200" : "bg-red-600 text-white border-red-400 shadow-xl shadow-red-200"
                 )}>
                   <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 animate-bounce">
                     {feedback === "correct" ? <CheckCircle2 className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
                   </div>
                   <div className="space-y-2 text-center md:text-left">
                     <p className="text-2xl font-black uppercase tracking-tighter">
                       {feedback === "correct" ? "Perfect! That&apos;s correct" : "Not quite right"}
                     </p>
                     <div className="bg-black/10 p-4 rounded-2xl">
                        <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">Correct Answer</p>
                        <p className="text-lg font-bold">{currentQ.answer_text}</p>
                     </div>
                     {currentQ.explanation && (
                        <p className="text-sm font-medium opacity-90 leading-relaxed mt-4 italic">
                           &quot; {currentQ.explanation} &quot;
                        </p>
                     )}
                   </div>
                 </div>
               )}
            </CardContent>
            <CardFooter className="px-12 py-8 bg-slate-50 border-t border-slate-100">
               {feedback === "none" ? (
                 <Button className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-xl font-bold uppercase tracking-widest transition-all active:scale-95 group shadow-xl shadow-slate-200" onClick={checkAnswer}>
                   Validate Answer
                   <CheckCircle2 className="ml-3 h-6 w-6 group-hover:scale-110 transition-transform" />
                 </Button>
               ) : (
                 <Button className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-xl font-bold uppercase tracking-widest transition-all active:scale-95 group shadow-xl shadow-blue-200" onClick={nextQuestion}>
                   {currentIndex < questions.length - 1 ? "Next Challenge" : "Finish Practice"}
                   <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                 </Button>
               )}
            </CardFooter>
          </Card>
          
          <div className="flex justify-center">
             <div className="bg-white/50 backdrop-blur-sm px-6 py-3 rounded-full border border-slate-200 flex items-center gap-4 text-slate-400">
                <FileText className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Question source: Page {currentQ.source_page || 'Unknown'}</span>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
