import { createClient } from "@/lib/supabase/server";
import { Search, ArrowRight, Download, Play, FileText, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FilterSection from "@/components/dashboard/FilterSection";

const CLASSES = ["LKG", "UKG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
const SUBJECTS = ["Mathematics", "Science", "English", "Social Studies", "Hindi", "Environmental Studies", "Physics", "Chemistry", "Biology", "Computer Science", "History", "Geography", "Civics"];

export default async function Home({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const query = await searchParams;
  const selectedClass = query.class || "";
  const selectedSubject = query.subject || "";

  const supabase = await createClient();
  
  let dbQuery = supabase
    .from("worksheets")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (selectedClass) dbQuery = dbQuery.eq("class", selectedClass);
  if (selectedSubject) dbQuery = dbQuery.eq("subject", selectedSubject);

  const { data: worksheets } = await dbQuery;

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* Hero Section */}
      <header className="bg-white border-b border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 space-y-8 text-center md:text-left">
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-full animate-in fade-in slide-in-from-bottom-2 duration-700">
                <Sparkles className="w-5 h-5 mr-2" />
                <span className="text-sm font-bold uppercase tracking-wider">AI-Powered Question Engine</span>
              </div>
              <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-slate-900 leading-[1.05] animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
                Master your skills with <span className="text-blue-600">PDF Finder</span>
              </h1>
              <p className="text-xl text-slate-500 max-w-lg leading-relaxed mx-auto md:mx-0 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
                The ultimate companion for students. Turn static worksheet PDFs into interactive practice sessions with instant feedback.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 h-16 px-10 rounded-2xl shadow-xl shadow-blue-200 text-xl font-bold group transition-all hover:scale-105 active:scale-95" asChild>
                  <Link href="#browse">
                    Browse Worksheets
                    <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl border-slate-200 text-xl font-bold hover:bg-slate-50 transition-all hover:scale-105 active:scale-95" asChild>
                   <Link href="/admin">Admin Portal</Link>
                </Button>
              </div>
            </div>
            
            <div className="flex-1 w-full max-w-xl animate-in fade-in slide-in-from-right-8 duration-1000 delay-500">
              <div className="relative aspect-square">
                {/* Decorative Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-600/10 rounded-full scale-110 blur-2xl animate-pulse"></div>
                
                {/* Main Card */}
                <div className="absolute inset-x-8 inset-y-8 bg-white border border-slate-100 rounded-[3rem] shadow-2xl flex flex-col p-10 transform -rotate-2 hover:rotate-0 transition-all duration-700 group cursor-default overflow-hidden">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex gap-2">
                       <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                       <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                       <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                    </div>
                    <Badge className="bg-blue-50 text-blue-600 border-none font-bold">LIVE PREVIEW</Badge>
                  </div>
                  
                  <div className="space-y-6 flex-1">
                    <div className="h-6 bg-slate-100 rounded-lg w-1/2 animate-pulse"></div>
                    <div className="space-y-4">
                      <div className="h-4 bg-slate-50 rounded-lg w-full"></div>
                      <div className="h-4 bg-slate-50 rounded-lg w-5/6"></div>
                      <div className="h-4 bg-slate-50 rounded-lg w-3/4"></div>
                    </div>
                    
                    <div className="pt-10 flex flex-col items-center justify-center gap-6">
                      <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-blue-200 group-hover:scale-110 transition-transform duration-500">
                        <Play className="w-10 h-10 ml-1.5" />
                      </div>
                      <div className="text-center">
                        <p className="font-black text-2xl text-slate-800">Quiz Interface</p>
                        <p className="text-slate-400 font-medium">Interactive & Fun</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Overlay Effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-blue-600/5 group-hover:to-blue-600/10 transition-colors"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Browsing Section */}
      <main id="browse" className="max-w-7xl mx-auto px-6 py-24 space-y-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="space-y-4 text-center md:text-left">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Level up your learning</h2>
            <p className="text-lg text-slate-500 max-w-md">Find worksheets tailored to your grade and subject. Ready to start practicing?</p>
          </div>
          <FilterSection classes={CLASSES} subjects={SUBJECTS} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {worksheets && worksheets.length > 0 ? (
            worksheets.map((ws, idx) => (
              <Card key={ws.id} className="group flex flex-col overflow-hidden border-slate-200 hover:border-blue-300 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 rounded-[2.5rem] bg-white">
                <CardHeader className="p-0">
                  <div className="aspect-[4/3] bg-slate-100 flex flex-col items-center justify-center border-b border-slate-100 group-hover:bg-blue-50/50 transition-all duration-500 relative overflow-hidden">
                    <div className="absolute top-4 left-4">
                       <Badge className="bg-white/80 backdrop-blur-sm text-slate-700 border-slate-200 font-bold px-4 py-1.5 rounded-xl shadow-sm">{ws.class}</Badge>
                    </div>
                    
                    <div className="w-24 h-24 bg-white rounded-3xl shadow-xl border border-slate-100 flex items-center justify-center text-blue-600 transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                      <FileText className="w-12 h-12" />
                    </div>
                    
                    <div className="absolute bottom-4 left-0 right-0 px-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                       <div className="bg-blue-600 text-white text-xs font-black uppercase tracking-widest text-center py-2 rounded-xl shadow-lg shadow-blue-200">
                          {idx % 3 === 0 ? "Highly Recommended" : idx % 2 === 0 ? "New Content" : "Popular Worksheet"}
                       </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8 px-8 flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    <p className="text-xs font-black uppercase tracking-widest text-blue-600">{ws.subject}</p>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight group-hover:text-blue-700 transition-colors uppercase tracking-tight">{ws.title}</h3>
                  <p className="text-slate-400 font-medium line-clamp-2 text-sm">
                    {ws.topic || "Practice comprehensive questions focused on key concepts and learning objectives."}
                  </p>
                </CardContent>
                <CardFooter className="px-8 pb-10 pt-4 grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-14 border-slate-200 rounded-2xl font-black uppercase text-xs tracking-widest hover:border-blue-200 hover:text-blue-600 transition-all" asChild>
                    <a href={ws.pdf_url} target="_blank" rel="noopener noreferrer">
                      <Download className="w-5 h-5 mr-2" />
                      PDF
                    </a>
                  </Button>
                  <Button className="h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-100 transition-all active:scale-95" asChild>
                    <Link href={`/worksheets/${ws.id}/practice`}>
                      <Play className="w-5 h-5 mr-2" />
                      Practice
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
               <div className="w-24 h-24 bg-slate-50 rounded-full mx-auto flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
                 <Search className="w-12 h-12" />
               </div>
               <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Empty classroom!</h3>
               <p className="text-slate-400 max-w-sm mx-auto font-medium text-lg mt-2">We couldn&apos;t find any worksheets matching your filters. Try selecting a different grade or subject.</p>
               <Button variant="outline" asChild className="h-14 px-10 rounded-2xl border-slate-200 text-lg font-bold mt-8 hover:bg-slate-50">
                 <Link href="/">Clear All Filters</Link>
               </Button>
            </div>
          )}
        </div>
      </main>

      {/* Trust/Stats Section */}
      <section className="bg-slate-900 py-24 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16 relative z-10 text-center">
            <div className="space-y-4">
               <div className="text-5xl font-black text-blue-400 tracking-tighter">100%</div>
               <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">AI Accuracy Goal</p>
               <p className="text-slate-500 text-sm">Every question is human-reviewed before publishing.</p>
            </div>
            <div className="space-y-4">
               <div className="text-5xl font-black text-white tracking-tighter">LKG-12</div>
               <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Complete Coverage</p>
               <p className="text-slate-500 text-sm">Designed for every student from kindergarten to high school.</p>
            </div>
            <div className="space-y-4">
               <div className="text-5xl font-black text-emerald-400 tracking-tighter">FREE</div>
               <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Forever Open</p>
               <p className="text-slate-500 text-sm">Access to premium educational content without barriers.</p>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 border-t border-slate-100 pt-16 uppercase tracking-widest font-black text-[10px] text-slate-400">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-lg">P</div>
             <span className="text-slate-900 text-base">PDF FINDER</span>
           </div>
           <nav className="flex flex-wrap justify-center gap-8">
             <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
             <Link href="/admin" className="hover:text-blue-600 transition-colors">Admin</Link>
             <Link href="#browse" className="hover:text-blue-600 transition-colors">Browse</Link>
             <Link href="#" className="hover:text-blue-600 transition-colors">Contact</Link>
           </nav>
           <p>© 2026 PDF FINDER PROJECT</p>
        </div>
      </footer>
    </div>
  );
}
