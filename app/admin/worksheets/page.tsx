"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, ExternalLink, Eye, Edit, Trash2, Clock, CheckCircle2, AlertCircle, FileText, Loader2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function WorksheetsPage() {
  const [worksheets, setWorksheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchWorksheets();
    
    // Set up real-time subscription for status updates
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'worksheets' }, () => {
        fetchWorksheets();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchWorksheets = async () => {
    const { data, error } = await supabase
      .from("worksheets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching worksheets:", error);
    } else {
      setWorksheets(data || []);
    }
    setLoading(false);
  };

  const filteredWorksheets = worksheets.filter(ws => 
    ws.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ws.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ws.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published": return <Badge variant="success" className="px-3">Published</Badge>;
      case "draft_generated": return <Badge variant="info" className="px-3">Draft Ready</Badge>;
      case "processing": return <Badge variant="warning" className="animate-pulse px-3">Processing</Badge>;
      case "uploaded": return <Badge variant="secondary" className="px-3">Uploaded</Badge>;
      case "failed": return <Badge variant="destructive" className="px-3">Failed</Badge>;
      case "reviewed": return <Badge variant="default" className="px-3">Reviewed</Badge>;
      default: return <Badge variant="outline" className="px-3">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Manage Worksheets</h2>
          <p className="text-slate-500 mt-1">View status, review drafts, and publish interactive quizzes.</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 shadow-md">
          <Link href="/admin/upload">
            <Plus className="mr-2 h-4 w-4" />
            New Worksheet
          </Link>
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b bg-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>All Worksheets</CardTitle>
              <CardDescription>Manage your collection of educational content.</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search title, subject, grade..."
                  className="pl-9 w-full sm:w-64 h-10 border-slate-200 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-4 text-left">Title & Subject</th>
                  <th className="px-6 py-4 text-left">Class</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Date Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-8">
                        <div className="h-10 bg-slate-100 rounded-md"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredWorksheets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <FileText className="w-12 h-12 opacity-20" />
                        <p className="text-lg font-medium">No worksheets found</p>
                        <p className="text-sm">Start by uploading your first PDF document.</p>
                        <Button variant="link" asChild className="text-blue-600 mt-2">
                          <Link href="/admin/upload">Upload Now</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredWorksheets.map((ws) => (
                    <tr key={ws.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100/50 group-hover:scale-105 transition-transform">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{ws.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{ws.subject}</span>
                              {ws.topic && <span className="text-xs text-slate-400">• {ws.topic}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-semibold text-slate-700">{ws.class}</span>
                      </td>
                      <td className="px-6 py-5">{getStatusBadge(ws.status)}</td>
                      <td className="px-6 py-5 text-slate-500">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 opacity-40" />
                          {new Date(ws.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           {ws.status === 'draft_generated' ? (
                             <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-700 h-9 px-4 rounded-lg shadow-sm">
                               <Link href={`/admin/review/${ws.id}`}>
                                 Review Q&A
                               </Link>
                             </Button>
                           ) : ws.status === 'published' ? (
                             <Button variant="outline" size="sm" asChild className="h-9 px-4 rounded-lg border-slate-200">
                               <Link href={`/worksheets/${ws.id}`}>
                                 View Live
                                 <ExternalLink className="ml-2 h-3.5 w-3.5 opacity-50" />
                               </Link>
                             </Button>
                           ) : (
                             <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                               <Eye className="h-5 w-5" />
                             </Button>
                           )}
                           <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50">
                             <Trash2 className="h-5 w-5" />
                           </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Keep up the good work!</p>
            <p className="text-sm text-slate-500">You've uploaded {worksheets.length} worksheets so far. Check back for processing updates.</p>
          </div>
        </div>
        <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
          Learn more about processing
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
