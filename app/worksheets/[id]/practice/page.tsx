"use client";

import { useEffect, useState, use, useCallback } from "react";
import { CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Sparkles, RefreshCcw, Home, Check, X, Trophy } from "lucide-react";
import { evaluateAnswer, type AnswerEvaluation } from "@/lib/questions";
import { createClient } from "@/lib/supabase/client";
import { Worksheet, Question } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/theme/ThemeToggle";

function getQuestionOptions(question: Question) {
  if (question.question_type === "true_false") {
    return question.answer_options && question.answer_options.length > 0 ? question.answer_options : ["True", "False"];
  }

  return question.answer_options || [];
}

function getPromptTextClasses(questionText: string) {
  const normalizedText = questionText.trim();
  const lineCount = normalizedText.split("\n").filter(Boolean).length;
  const characterCount = normalizedText.length;

  if (lineCount >= 5 || characterCount >= 260) {
    return "text-[0.95rem] md:text-[1.22rem] leading-7 md:leading-8";
  }

  if (lineCount >= 4 || characterCount >= 190) {
    return "text-[1rem] md:text-[1.45rem] leading-7 md:leading-9";
  }

  if (lineCount >= 3 || characterCount >= 130) {
    return "text-[1.02rem] md:text-[1.62rem] leading-7 md:leading-9";
  }

  return "text-[1.05rem] md:text-[1.8rem] leading-relaxed";
}

export default function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
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
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [questionNotes, setQuestionNotes] = useState<Record<string, string>>({});
  
  const [supabase] = useState(() => createClient());

   const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: ws, error: wsError } = await supabase
        .from("worksheets")
        .select("*")
        .eq("id", id)
        .single();
      
      if (wsError) throw wsError;
      if ((ws as Worksheet).status !== "published") {
        throw new Error("This worksheet is not currently published for students.");
      }
      setWorksheet(ws as Worksheet);

      const { data: qs, error: qsError } = await supabase
        .from("questions")
        .select("*")
        .eq("worksheet_id", id)
        .eq("is_published", true)
        .order("source_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });
      
      if (qsError) throw qsError;
      if (!qs || qs.length === 0) {
        throw new Error("This worksheet does not have any published questions.");
      }
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

  const checkAnswer = (answerOverride?: string) => {
    const attemptedAnswer = answerOverride ?? userAnswer;
    if (!attemptedAnswer.trim()) return;
    const currentQuestion = questions[currentIndex];
    const result = evaluateAnswer(currentQuestion, attemptedAnswer);

    if (result.isCorrect) {
      setFeedback("correct");
      setScore(score + 1);
    } else {
      setFeedback("incorrect");
    }
    setEvaluation(result);

    if (answerOverride !== undefined) {
      setUserAnswer(answerOverride);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer("");
      setFeedback("none");
      setEvaluation(null);
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
    setEvaluation(null);
    setQuestionNotes({});
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400 w-6 h-6" />
        </div>
        <p className="text-slate-500 dark:text-slate-300 font-bold uppercase tracking-widest text-xs">Generating your practice session...</p>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-none shadow-2xl dark:shadow-none rounded-[2.5rem] overflow-hidden dark:bg-white/5 dark:border dark:border-white/10">
          <CardHeader className="bg-red-50 dark:bg-red-500/10 text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl font-black text-red-900 dark:text-red-200 uppercase tracking-tighter">Quiz Unavailable</CardTitle>
          </CardHeader>
          <CardContent className="p-10 text-center space-y-6">
            <p className="text-slate-500 dark:text-slate-300 font-medium">
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
        <Card className="max-w-2xl w-full border-none shadow-2xl dark:shadow-none rounded-[3rem] overflow-hidden dark:bg-white/5 dark:border dark:border-white/10">
          <div className="bg-blue-600 py-20 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <Trophy className="w-24 h-24 mx-auto mb-6 drop-shadow-lg" />
            <h2 className="text-5xl font-black tracking-tighter uppercase">Workshop Complete!</h2>
            <p className="text-blue-100 font-bold tracking-widest uppercase text-sm mt-2 opacity-80">Excellent effort on {worksheet?.title}</p>
          </div>
          
          <CardContent className="p-12 space-y-12">
            <div className="flex justify-center gap-12">
               <div className="text-center space-y-1">
                 <p className="text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-widest">Score</p>
                 <p className="text-4xl font-black text-slate-900 dark:text-white">{score} / {questions.length}</p>
               </div>
               <div className="w-px bg-slate-100 dark:bg-white/10"></div>
               <div className="text-center space-y-1">
                 <p className="text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-widest">Accuracy</p>
                 <p className="text-4xl font-black text-blue-600">{percentage}%</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button size="lg" variant="outline" className="h-16 rounded-2xl border-slate-200 text-xl font-bold bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-100" onClick={restartQuiz}>
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
               <p className="text-slate-400 dark:text-slate-300 text-sm font-medium">Challenge yourself again to master the topic of <span className="text-slate-900 dark:text-white font-black">{worksheet?.subject}</span>.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const currentQuestionKey = currentQ.id ?? `question-${currentIndex}`;
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const options = getQuestionOptions(currentQ);
  const usesChoiceUi = currentQ.question_type !== "short" && options.length > 0;
  const currentQuestionNote = questionNotes[currentQuestionKey] ?? "";
  const promptTextClasses = getPromptTextClasses(currentQ.question_text);

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_22%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_20%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] text-slate-950 dark:text-white flex flex-col">
      {/* Header */}
      <nav className="bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-100 dark:border-white/10 h-16 flex items-center px-4 md:px-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
           <div className="flex min-w-0 items-center gap-3 md:gap-4">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 text-slate-400 dark:text-slate-200" asChild>
                <Link href="/">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div className="hidden min-w-0 md:block">
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{worksheet?.subject} • {worksheet?.class}</p>
                <p className="text-slate-900 font-black text-sm md:text-base truncate max-w-[200px] md:max-w-[250px] uppercase tracking-wide">{worksheet?.title}</p>
              </div>
           </div>
           
           <div className="flex-1 max-w-xs md:max-w-sm">
              <div className="flex justify-between mb-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                 <span>Progress</span>
                 <span>{currentIndex + 1} of {questions.length}</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden border border-slate-200/50 dark:border-white/10 p-0.5">
                 <div className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(37,99,235,0.4)]" style={{ width: `${progress}%` }}></div>
              </div>
           </div>

           <div className="flex items-center gap-2">
              <ThemeToggle className="hidden sm:inline-flex" />
              <Badge className="bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-[10px] text-emerald-600 dark:text-emerald-200 border-none font-black hidden sm:flex">
                <CheckCircle2 className="w-3 h-3 mr-1.5" />
                {score} Correct
              </Badge>
           </div>
        </div>
      </nav>

      <main className="flex-1 min-h-0 flex items-center justify-center p-3 md:p-4">
        <div className="max-w-5xl w-full h-full flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className="border-none shadow-[0_30px_80px_rgba(15,23,42,0.14)] dark:shadow-none rounded-[2rem] overflow-hidden bg-white/96 dark:bg-white/5 dark:border dark:border-white/10 backdrop-blur-sm flex flex-col flex-1 min-h-0">
            <CardHeader className="p-5 md:p-6 pb-3 md:pb-4">
               <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-cyan-400/10 dark:to-blue-500/10 text-blue-700 dark:text-cyan-200 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                     Question {currentIndex + 1}
                  </div>
                  <div className="inline-flex items-center px-3 py-1.5 bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300 rounded-full text-[10px] font-black uppercase tracking-widest">
                     Page {currentQ.source_page || "?"}
                  </div>
               </div>
               <div className="rounded-[1.75rem] border border-slate-100 dark:border-white/10 bg-gradient-to-br from-slate-50 via-white to-blue-50/60 dark:from-white/5 dark:via-white/[0.03] dark:to-cyan-400/10 px-5 py-4 shadow-sm">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Worksheet Prompt</p>
                  <h2 className={cn("whitespace-pre-line font-bold text-slate-800 dark:text-white", promptTextClasses)}>
                    {currentQ.question_text}
                  </h2>
               </div>
            </CardHeader>
            <CardContent className="px-5 md:px-6 pb-5 md:pb-6 space-y-6 flex-1 min-h-0 overflow-y-auto bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(248,250,252,0.75))] dark:bg-none">
               <div className="space-y-4">
                  <Label htmlFor="answer" className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 ml-1">Your Response</Label>
                  {!usesChoiceUi ? (
                    <div className="relative group">
                      <Input 
                        id="answer"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        disabled={feedback !== "none"}
                        onKeyDown={(e) => e.key === "Enter" && feedback === "none" && checkAnswer()}
                        placeholder="Type your answer here..."
                        className={cn(
                          "h-14 md:h-16 px-5 md:px-6 text-lg md:text-xl font-bold rounded-2xl border-2 transition-all duration-300",
                          feedback === "none" ? "border-slate-100 bg-slate-50 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 shadow-sm" :
                          feedback === "correct" ? "border-emerald-200 bg-emerald-50/50 text-emerald-800" :
                          "border-red-200 bg-red-50/50 text-red-800"
                        )}
                        autoComplete="off"
                      />
                      {feedback === "correct" && <Check className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500 animate-in zoom-in duration-300" />}
                      {feedback === "incorrect" && <X className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-red-500 animate-in zoom-in duration-300" />}
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px] md:items-start">
                      <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                        {options.map((option, optionIndex) => {
                          const isSelected = userAnswer === option;
                          const isCorrectOption = option.trim().toLowerCase() === currentQ.answer_text.trim().toLowerCase();
                          const showCorrect = feedback !== "none" && isCorrectOption;
                          const showIncorrect = feedback === "incorrect" && isSelected && !isCorrectOption;
                          const optionLabel = String.fromCharCode(65 + optionIndex);

                          return (
                            <Button
                              key={option}
                              type="button"
                              variant="outline"
                              disabled={feedback !== "none"}
                              onClick={() => setUserAnswer(option)}
                              className={cn(
                                "h-auto min-h-[54px] md:min-h-[60px] justify-start whitespace-normal rounded-[1.35rem] border px-3 py-3 md:px-4 md:py-3 text-left text-sm md:text-base leading-snug font-medium shadow-sm transition-all active:scale-[0.98]",
                                isSelected && feedback === "none"
                                  ? "border-blue-500 bg-gradient-to-br from-blue-50 to-white text-slate-800 shadow-blue-100"
                                  : "border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-white/[0.04] text-slate-600 dark:text-slate-200 hover:border-slate-300 dark:hover:border-cyan-300/40 hover:bg-slate-50 dark:hover:bg-white/[0.08]",
                                showCorrect ? "border-[#0A995C] bg-[#E6F5EE] text-[#0A995C] font-bold shadow-emerald-100" : "",
                                showIncorrect ? "border-red-500 bg-red-50 text-red-600 font-bold shadow-red-100" : "",
                                feedback !== "none" && !showCorrect && !showIncorrect ? "opacity-60 saturate-50" : ""
                              )}
                            >
                              <div className="flex items-center gap-3 w-full">
                                <span
                                  className={cn(
                                    "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                                    isSelected && feedback === "none" ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300",
                                    showCorrect ? "bg-[#0A995C] text-white" : "",
                                    showIncorrect ? "bg-red-500 text-white" : ""
                                  )}
                                >
                                  {optionLabel}
                                </span>
                                <span className="pt-0.5 line-clamp-2 md:line-clamp-none">{option}</span>
                              </div>
                            </Button>
                          );
                        })}
                      </div>

                      <div className="rounded-[1.5rem] border border-slate-200/80 dark:border-white/10 bg-gradient-to-b from-white to-slate-50 dark:from-white/[0.06] dark:to-white/[0.03] shadow-sm flex flex-col overflow-hidden">
                        <div className="flex flex-col gap-0.5 px-4 pt-4 pb-2 border-b border-slate-100 dark:border-white/10">
                          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">Quick Note</span>
                          <Label htmlFor="question-note" className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Scratchpad
                          </Label>
                        </div>
                        <Textarea
                          id="question-note"
                          value={currentQuestionNote}
                          onChange={(e) =>
                            setQuestionNotes((prev) => ({
                              ...prev,
                              [currentQuestionKey]: e.target.value,
                            }))
                          }
                          placeholder="Write a short note..."
                          className="flex-1 min-h-[110px] resize-none border-0 rounded-none bg-transparent px-4 py-3 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                        />
                      </div>
                    </div>
                  )}
               </div>

               {feedback !== "none" && (
                 <div className={cn(
                   "p-5 md:p-6 rounded-[2rem] animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col gap-3 shadow-2xl",
                   feedback === "correct" 
                     ? "bg-[#0A995C] text-white shadow-[#0A995C]/20" 
                     : "bg-red-500 text-white shadow-red-500/20"
                 )}>
                   <div className="flex items-center gap-4">
                     <div className="w-[3.25rem] h-[3.25rem] bg-black/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                       {feedback === "correct" ? <CheckCircle2 className="w-7 h-7" /> : <X className="w-7 h-7" />}
                     </div>
                     <p className="text-xl md:text-[22px] font-bold tracking-tight">
                       {feedback === "correct" ? "PERFECT! THAT'S CORRECT" : "NOT QUITE RIGHT"}
                     </p>
                   </div>
                   
                   <div className="bg-black/10 rounded-2xl p-4 w-fit min-w-[200px] ml-0 md:ml-16">
                      <p className="text-[11px] font-bold uppercase tracking-wider opacity-80 mb-1">
                         {feedback === "correct" ? "Correct Answer" : "The Correct Answer Is"}
                      </p>
                      <p className="text-lg font-bold">{currentQ.answer_text}</p>
                   </div>
                      
                   <div className="ml-0 md:ml-16 space-y-3">
                     {currentQ.accepted_answer_variants && currentQ.accepted_answer_variants.length > 0 && (
                        <div className="bg-black/10 p-4 rounded-2xl w-fit min-w-[200px]">
                          <p className="text-[11px] font-bold uppercase tracking-wider opacity-80 mb-1">Also Accepted</p>
                          <p className="text-sm font-bold">{currentQ.accepted_answer_variants.join(", ")}</p>
                        </div>
                     )}
                     {evaluation?.gradingMode === "numeric_tolerance" && evaluation.acceptedRange && (
                        <div className="bg-black/10 p-4 rounded-2xl w-fit min-w-[200px]">
                          <p className="text-[11px] font-bold uppercase tracking-wider opacity-80 mb-1">Accepted Range</p>
                          <p className="text-sm font-bold">
                            {evaluation.acceptedRange.min} to {evaluation.acceptedRange.max}
                          </p>
                        </div>
                     )}
                     {evaluation?.gradingMode === "keyword_match" && (
                        <div className="bg-black/10 p-4 rounded-2xl space-y-1.5 w-fit min-w-[200px]">
                          <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">Keyword Check</p>
                          {evaluation.matchedKeywords && evaluation.matchedKeywords.length > 0 && (
                            <p className="text-sm font-bold">Matched: <span className="font-medium opacity-90">{evaluation.matchedKeywords.join(", ")}</span></p>
                          )}
                          {feedback === "incorrect" && evaluation.missingKeywords && evaluation.missingKeywords.length > 0 && (
                            <p className="text-sm font-bold">
                              Missing: <span className="font-medium opacity-90">{evaluation.missingKeywords.join(", ")}</span>
                            </p>
                          )}
                          {evaluation.minimumKeywordMatches && (
                            <p className="text-[11px] opacity-80 font-medium">
                              Required matches: {evaluation.minimumKeywordMatches}
                            </p>
                          )}
                        </div>
                     )}
                     {currentQ.explanation && (
                        <p className="text-sm font-medium opacity-90 leading-relaxed italic mt-2">
                           {currentQ.explanation}
                        </p>
                     )}
                   </div>
                 </div>
               )}
            </CardContent>
            <CardFooter className="px-5 md:px-6 py-6 border-t border-slate-100 dark:border-white/10 bg-white/70 dark:bg-white/[0.03]">
               {feedback === "none" ? (
                 <Button className="w-full h-14 rounded-[1rem] bg-blue-600 hover:bg-blue-700 text-base font-bold uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-blue-600/20" onClick={() => checkAnswer()}>
                   {usesChoiceUi ? "Check Selection" : "Validate Answer"}
                 </Button>
               ) : (
                 <Button className="w-full h-14 rounded-[1rem] bg-blue-600 hover:bg-blue-700 text-base font-bold uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-blue-600/20 group" onClick={nextQuestion}>
                   {currentIndex < questions.length - 1 ? "NEXT CHALLENGE" : "FINISH PRACTICE"}
                   <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                 </Button>
               )}
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
