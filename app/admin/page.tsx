"use client";

import { useEffect, useState } from "react";
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Upload, 
  ArrowRight,
  BarChart3,
  BookOpen,
  Sparkles,
  LayoutDashboard
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    processing: 0,
    drafts: 0
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: worksheets, error } = await supabase.from("worksheets").select("status");
    if (!error && worksheets) {
      setStats({
        total: worksheets.length,
        published: worksheets.filter(w => w.status === 'published').length,
        processing: worksheets.filter(w => w.status === 'processing').length,
        drafts: worksheets.filter(w => w.status === 'draft_generated').length
      });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">Admin Overview</h2>
          <p className="text-slate-400 mt-1 font-medium italic">Empowering education with AI automation.</p>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <LayoutDashboard className="w-32 h-32" />
        </div>
        <div className="flex gap-3">
           <Button asChild className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-100 px-6 font-bold">
             <Link href="/admin/upload">
               <Upload className="mr-2 h-4 w-4" />
               New Upload
             </Link>
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm rounded-[2rem] bg-white group hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Total Content</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
               <BookOpen className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-slate-900">{loading ? "..." : stats.total}</div>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Worksheets added</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[2rem] bg-white group hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Live Quizzes</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
               <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-emerald-600">{loading ? "..." : stats.published}</div>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Ready for students</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[2rem] bg-white group hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">AI Pending</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
               <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-amber-600">{loading ? "..." : stats.processing}</div>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Extracting data...</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[2rem] bg-white group hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Review Drafts</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
               <FileText className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-indigo-600">{loading ? "..." : stats.drafts}</div>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Need your approval</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        <div className="lg:col-span-2 space-y-6">
           <Card className="border-none shadow-sm rounded-[3rem] bg-white p-6 md:p-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 group-hover:bg-blue-600/10 transition-colors"></div>
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight">Rapid Ingestion</CardTitle>
                <CardDescription className="text-slate-400 font-medium tracking-tight">Start the AI pipeline today.</CardDescription>
              </CardHeader>
              <CardContent className="px-0 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <Button asChild className="h-32 bg-slate-900 hover:bg-black rounded-[2rem] flex flex-col gap-3 items-center justify-center shadow-2xl shadow-slate-200 transition-all hover:-translate-y-1 active:scale-95">
                   <Link href="/admin/upload">
                     <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                        <Upload className="h-6 w-6 text-white" />
                     </div>
                     <span className="font-black uppercase tracking-widest text-xs">Upload Worksheet</span>
                   </Link>
                 </Button>
                 <Button variant="outline" asChild className="h-32 rounded-[2rem] flex flex-col gap-3 items-center justify-center border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 transition-all hover:-translate-y-1 active:scale-95">
                    <Link href="/admin/worksheets">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <BarChart3 className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className="font-black uppercase tracking-widest text-xs text-slate-600">Manage Content</span>
                    </Link>
                 </Button>
              </CardContent>
           </Card>
        </div>

        <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden relative p-4">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles className="w-48 h-48" />
          </div>
          <CardHeader className="relative z-10 border-b border-slate-800/50 pb-8">
            <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tighter">
              <Sparkles className="h-6 w-6 text-blue-400 animate-pulse" />
              Extraction Hub
            </CardTitle>
            <CardDescription className="text-slate-500 font-semibold tracking-wide uppercase text-[10px]">Processing Stats</CardDescription>
          </CardHeader>
          <CardContent className="pt-10 space-y-8 relative z-10">
             <div className="flex justify-between items-center group">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 group-hover:scale-150 transition-transform"></div>
                  <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Queue Status</span>
               </div>
               <Badge variant="warning" className="rounded-lg px-4 font-black uppercase tracking-widest text-[10px]">{stats.processing} TASK</Badge>
             </div>
             
             <div className="flex justify-between items-center group">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-150 transition-transform"></div>
                  <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Drafts Ready</span>
               </div>
               <Badge variant="info" className="rounded-lg px-4 font-black uppercase tracking-widest text-[10px] bg-blue-500 text-white border-none">{stats.drafts} ITEMS</Badge>
             </div>

             <div className="pt-8 border-t border-slate-800/50">
                <div className="bg-slate-800/50 p-6 rounded-2xl">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-3 underline decoration-blue-400/30 underline-offset-4">Developer Note</p>
                   <p className="text-xs text-slate-400 leading-relaxed font-medium italic">
                     "Every worksheet processed by Gemini requires manual review before publishing to ensure 100% educational accuracy for students."
                   </p>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
