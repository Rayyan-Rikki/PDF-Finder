import { createClient } from "@/lib/supabase/server";
import { requirePageAuth } from "@/lib/auth";
import { ArrowLeft, Download, Play, FileText, Calendar, Clock, BookOpen, GraduationCap, ChevronRight, Share2, Printer, Sparkles, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default async function WorksheetPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageAuth("/worksheets");
  const { id } = await params;
  const supabase = await createClient();

  const { data: ws } = await supabase
    .from("worksheets")
    .select("*")
    .eq("id", id)
    .single();

  if (!ws) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white flex flex-col items-center justify-center p-6 gap-6">
        <div className="w-20 h-20 bg-slate-100 dark:bg-white/10 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-500">
           <FileText className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Worksheet not found</h1>
        <Button size="lg" className="rounded-2xl" asChild>
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  if (ws.status !== "published") {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white flex flex-col items-center justify-center p-6 gap-6">
        <div className="w-20 h-20 bg-slate-100 dark:bg-white/10 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-500">
           <FileText className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Worksheet unavailable</h1>
        <p className="max-w-md text-center text-slate-500 dark:text-slate-300">This worksheet is not currently published for students.</p>
        <Button size="lg" className="rounded-2xl" asChild>
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  // Fetch question count
  const { count } = await supabase
    .from("questions")
    .select("*", { count: 'exact', head: true })
    .eq("worksheet_id", id)
    .eq("is_published", true);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      {/* Navigation */}
      <nav className="h-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50 dark:border-white/10 dark:bg-slate-950/90">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-slate-400 dark:text-slate-200 group" asChild>
                <Link href="/">
                  <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                </Link>
              </Button>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                 <Link href="/" className="hover:text-blue-600 dark:hover:text-cyan-300">Home</Link>
                 <ChevronRight className="w-3 h-3 opacity-30" />
                 <span className="text-slate-600 dark:text-slate-300">{ws.class}</span>
                 <ChevronRight className="w-3 h-3 opacity-30" />
                 <span className="text-slate-900 dark:text-white truncate max-w-[150px]">{ws.title}</span>
              </div>
           </div>
           
           <div className="flex items-center gap-2">
              <ThemeToggle className="hidden sm:inline-flex" />
              <Button variant="outline" size="sm" className="hidden sm:flex rounded-xl font-bold border-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
           </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20 animate-in fade-in duration-700">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start text-center md:text-left">
            
            {/* Left Column: Info & Actions */}
            <div className="lg:col-span-2 space-y-10">
               <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                     <Badge variant="info" className="px-4 py-1.5 text-blue-700 bg-blue-50 border-blue-100 rounded-full font-bold uppercase tracking-widest text-[10px]">
                        Subject: {ws.subject}
                     </Badge>
                     <Badge variant="outline" className="px-4 py-1.5 text-slate-600 border-slate-200 rounded-full font-bold uppercase tracking-widest text-[10px]">
                        Grade: {ws.class}
                     </Badge>
                  </div>
                  
                  <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight uppercase tracking-tighter">
                     {ws.title}
                  </h1>
                  
                  {ws.topic && (
                    <p className="text-2xl text-slate-400 font-medium tracking-tight">
                       Detailed focus on <span className="text-slate-900 font-black">{ws.topic}</span>
                    </p>
                  )}
               </div>

               <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6">
                  <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/10 shadow-sm dark:shadow-none flex flex-col items-center gap-2">
                     <BookOpen className="w-6 h-6 text-blue-600" />
                     <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">Questions</p>
                     <p className="text-2xl font-black text-slate-900 dark:text-white">{count || 0}</p>
                  </div>
                  <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/10 shadow-sm dark:shadow-none flex flex-col items-center gap-2">
                     <Calendar className="w-6 h-6 text-blue-600" />
                     <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">Published</p>
                     <p className="text-2xl font-black text-slate-900 dark:text-white">
                        {new Date(ws.published_at || ws.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                     </p>
                  </div>
                  <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/10 shadow-sm dark:shadow-none flex flex-col items-center gap-2">
                     <Clock className="w-6 h-6 text-blue-600" />
                     <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">Duration</p>
                     <p className="text-2xl font-black text-slate-900 dark:text-white">~{ (count || 0) * 2 }m</p>
                  </div>
                  <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/10 shadow-sm dark:shadow-none flex flex-col items-center gap-2">
                     <GraduationCap className="w-6 h-6 text-blue-600" />
                     <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">Type</p>
                     <p className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Quiz</p>
                  </div>
               </div>

               <div className="flex flex-col sm:flex-row gap-6 pt-10">
                  <Button size="lg" className="h-20 px-12 rounded-[2rem] bg-blue-600 hover:bg-blue-700 text-2xl font-black shadow-2xl shadow-blue-200 transition-all hover:scale-105 active:scale-95 group uppercase tracking-tighter flex-1" asChild>
                    <Link href={`/worksheets/${id}/practice`}>
                      <Play className="mr-3 h-8 w-8 fill-current group-hover:scale-110 transition-transform" />
                      Start Practice
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="h-20 px-10 rounded-[2rem] border-slate-200 text-xl font-bold hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10 flex items-center justify-center gap-3 transition-all hover:border-blue-300 hover:text-blue-600 dark:hover:border-cyan-300 dark:hover:text-cyan-300" asChild>
                    <a href={`/api/worksheets/${id}/pdf`} target="_blank" rel="noopener noreferrer">
                      <Download className="w-7 h-7" />
                      Download PDF
                    </a>
                  </Button>
               </div>
               
               <div className="bg-blue-50/50 dark:bg-cyan-400/10 p-8 rounded-[3rem] border border-blue-100 dark:border-cyan-400/20 border-dashed flex items-start gap-6 text-left">
                  <div className="w-14 h-14 bg-white dark:bg-white/10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg shadow-blue-900/10 dark:shadow-none">
                    <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-blue-900 dark:text-cyan-200 uppercase tracking-tight">AI-Enhanced Experience</h3>
                    <p className="text-blue-700 dark:text-cyan-100 font-medium leading-relaxed opacity-80">
                      Our system has analyzed this worksheet to provide a structured interactive experience. You&apos;ll get instant feedback for every answer, helping you master the material faster.
                    </p>
                    <div className="flex gap-4">
                       <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600 dark:text-cyan-300"><Check className="w-4 h-4" /> Instant Feedback</span>
                       <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600 dark:text-cyan-300"><Check className="w-4 h-4" /> Smart Grading</span>
                    </div>
                  </div>
               </div>
            </div>

            {/* Right Column: Preview Thumbnail */}
            <div className="lg:col-span-1">
               <Card className="rounded-[3rem] border-none shadow-2xl dark:shadow-none overflow-hidden group cursor-pointer sticky top-32 dark:bg-white/5 dark:border dark:border-white/10">
                  <CardHeader className="bg-slate-900 dark:bg-slate-950 py-4 px-6 flex flex-row items-center justify-between text-white">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">PDF Preview</p>
                    <div className="flex gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                       <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 bg-slate-100 dark:bg-slate-900 flex items-center justify-center aspect-[3/4] group-hover:bg-slate-50 dark:group-hover:bg-slate-950 transition-colors">
                     <div className="text-center group-hover:scale-110 transition-transform duration-500">
                        <FileText className="w-24 h-24 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-400 dark:text-slate-300 font-black uppercase tracking-widest text-xs">Worksheet Preview</p>
                        <p className="text-slate-300 dark:text-slate-500 text-[10px] mt-1 italic">Click start to begin interactive mode</p>
                     </div>
                  </CardContent>
                  <CardFooter className="bg-white dark:bg-white/5 p-8 grid grid-cols-2 gap-4">
                     <Button variant="ghost" className="h-12 rounded-xl text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-white" asChild>
                        <a href={`/api/worksheets/${id}/pdf`} target="_blank" rel="noopener noreferrer">Full View</a>
                     </Button>
                     <Button variant="ghost" className="h-12 rounded-xl text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-white">
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                     </Button>
                  </CardFooter>
               </Card>
            </div>

         </div>
      </main>
      
      {/* Action Footer for Mobile */}
      <div className="md:hidden fixed bottom-8 inset-x-6 z-50">
         <Button className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-xl font-black shadow-2xl shadow-blue-400 flex items-center justify-center gap-3 active:scale-95 transition-all" asChild>
            <Link href={`/worksheets/${id}/practice`}>
               <Play className="w-6 h-6 fill-current" />
               START QUIZ
            </Link>
         </Button>
      </div>
    </div>
  );
}
