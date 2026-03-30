import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { requirePageAuth } from "@/lib/auth";
import {
  ArrowRight,
  BookOpenCheck,
  Download,
  FileText,
  Layers3,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FilterSection from "@/components/dashboard/FilterSection";
import LogoutButton from "@/components/auth/LogoutButton";
import ThemeToggle from "@/components/theme/ThemeToggle";

const CLASSES = ["LKG", "UKG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
const SUBJECTS = ["Mathematics", "Science", "English", "Social Studies", "Hindi", "Environmental Studies", "Physics", "Chemistry", "Biology", "Computer Science", "History", "Geography", "Civics"];

export default async function Home({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const auth = await requirePageAuth("/");
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

  const worksheetCount = worksheets?.length ?? 0;
  const subjectCount = new Set((worksheets || []).map((worksheet) => worksheet.subject)).size;
  const gradeCount = new Set((worksheets || []).map((worksheet) => worksheet.class)).size;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.14),_transparent_20%)] text-slate-950 transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.14),_transparent_18%)] dark:text-slate-50">
      <header className="relative overflow-hidden border-b border-slate-200/70 dark:border-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(255,255,255,0.35))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(15,23,42,0.62))]" />
        <div className="relative mx-auto max-w-7xl px-6 pt-6 pb-18 md:pb-24">
          <nav className="mb-12 flex flex-col gap-4 rounded-[2rem] border border-slate-200/80 bg-white/70 px-5 py-4 shadow-lg shadow-slate-200/40 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white shadow-lg shadow-slate-300/40 dark:bg-cyan-300 dark:text-slate-950 dark:shadow-cyan-500/20">
                P
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">Created by</p>
                <div>
                  <p className="text-xl font-black tracking-tight text-slate-950 dark:text-white">Rayyan Shaik</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">PDF Finder student practice platform</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                {auth.profile?.role === "admin" ? "Admin Access" : "Student View"}
              </Badge>
              <ThemeToggle />
              {auth.profile?.role === "admin" && (
                <Button
                  variant="outline"
                  className="rounded-2xl border-slate-200 bg-white/70 px-5 font-bold dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                  asChild
                >
                  <Link href="/admin">Admin Portal</Link>
                </Button>
              )}
              <LogoutButton
                variant="ghost"
                className="rounded-2xl border border-transparent px-5 font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
              />
            </div>
          </nav>

          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/90 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-blue-700 shadow-sm dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-200">
                <Sparkles className="h-4 w-4" />
                Review-backed worksheet intelligence
              </div>

              <div className="space-y-5">
                <h1 className="max-w-4xl text-5xl font-black uppercase tracking-[-0.05em] text-slate-950 dark:text-white md:text-7xl">
                  Practice worksheets in a cleaner, smarter interface.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300 md:text-xl">
                  PDFs are parsed once, reviewed by admin, and delivered as a stable student experience with matching question types, faster practice flow, and consistent feedback.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="h-15 rounded-2xl bg-slate-950 px-8 text-lg font-black tracking-tight text-white shadow-xl shadow-slate-300/40 hover:bg-slate-800 dark:bg-cyan-300 dark:text-slate-950 dark:shadow-cyan-500/20 dark:hover:bg-cyan-200"
                  asChild
                >
                  <Link href="#library">
                    Browse worksheets
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-15 rounded-2xl border-slate-200 bg-white/75 px-8 text-lg font-bold text-slate-700 shadow-sm hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                  asChild
                >
                  <Link href="#workflow">See workflow</Link>
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.75rem] border border-slate-200/80 bg-white/75 p-5 shadow-lg shadow-slate-200/40 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Published</p>
                  <p className="mt-3 text-3xl font-black tracking-tight">{worksheetCount}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ready for students now</p>
                </div>
                <div className="rounded-[1.75rem] border border-slate-200/80 bg-white/75 p-5 shadow-lg shadow-slate-200/40 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Subjects</p>
                  <p className="mt-3 text-3xl font-black tracking-tight">{subjectCount}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Active in this view</p>
                </div>
                <div className="rounded-[1.75rem] border border-slate-200/80 bg-white/75 p-5 shadow-lg shadow-slate-200/40 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Grades</p>
                  <p className="mt-3 text-3xl font-black tracking-tight">{gradeCount}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Covered in results</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 rounded-[2.75rem] bg-gradient-to-br from-blue-500/15 via-transparent to-emerald-500/15 blur-2xl dark:from-cyan-400/20 dark:to-lime-400/10" />
              <div className="relative overflow-hidden rounded-[2.75rem] border border-slate-200/80 bg-white/78 p-6 shadow-2xl shadow-slate-300/30 backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/40 dark:shadow-none">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-rose-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  </div>
                  <Badge className="rounded-full bg-slate-950 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white dark:bg-cyan-300 dark:text-slate-950">
                    Live platform
                  </Badge>
                </div>

                <div className="mt-8 space-y-5">
                  <div className="rounded-[2rem] border border-slate-200/70 bg-slate-50/80 p-5 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-600 dark:text-cyan-300">Session design</p>
                        <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">One worksheet. One reviewed version. Same view for every learner.</h2>
                      </div>
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-cyan-300 dark:text-slate-950">
                        <Play className="h-7 w-7 fill-current" />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[1.5rem] border border-slate-200/70 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                      <Layers3 className="h-5 w-5 text-blue-600 dark:text-cyan-300" />
                      <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Question type</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">MCQ, true/false, and short answer stay aligned with the worksheet.</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-slate-200/70 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                      <Workflow className="h-5 w-5 text-blue-600 dark:text-cyan-300" />
                      <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Parsing model</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">The worksheet is parsed once during upload instead of per student.</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-slate-200/70 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                      <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-cyan-300" />
                      <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Human review</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">Admins approve the final version before students ever see it.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section id="workflow" className="border-b border-slate-200/70 py-18 dark:border-white/10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Platform workflow</p>
              <h2 className="max-w-3xl text-4xl font-black tracking-[-0.04em] text-slate-950 dark:text-white md:text-5xl">
                A new interface, but the same reliable worksheet pipeline.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              No logic was changed here. Upload, parse, review, publish, and practice still follow the same system. This update is presentation-focused and theme-aware.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {[
              {
                index: "01",
                title: "Parse on upload",
                body: "Gemini extracts structure, order, and answer shape the moment the admin uploads the PDF.",
                icon: FileText,
              },
              {
                index: "02",
                title: "Review before publish",
                body: "Admins adjust the draft, validate question types, and publish one stable version.",
                icon: BookOpenCheck,
              },
              {
                index: "03",
                title: "Practice without drift",
                body: "Students always interact with the same stored worksheet version instead of a live re-parse.",
                icon: ShieldCheck,
              },
            ].map((item) => (
              <div
                key={item.index}
                className="rounded-[2rem] border border-slate-200/80 bg-white/78 p-6 shadow-lg shadow-slate-200/40 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">{item.index}</p>
                  <item.icon className="h-5 w-5 text-blue-600 dark:text-cyan-300" />
                </div>
                <h3 className="mt-8 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main id="library" className="mx-auto max-w-7xl px-6 py-18">
        <div className="mb-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Worksheet library</p>
            <h2 className="text-4xl font-black tracking-[-0.04em] text-slate-950 dark:text-white md:text-5xl">
              Explore published practice sessions.
            </h2>
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                {selectedClass ? `Grade: ${selectedClass}` : "All grades"}
              </Badge>
              <Badge className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                {selectedSubject ? `Subject: ${selectedSubject}` : "All subjects"}
              </Badge>
            </div>
          </div>

          <div className="w-full max-w-2xl">
            <Suspense fallback={<div className="h-20 animate-pulse rounded-[1.75rem] bg-slate-200/70 dark:bg-white/10" />}>
              <FilterSection classes={CLASSES} subjects={SUBJECTS} />
            </Suspense>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {worksheets && worksheets.length > 0 ? (
            worksheets.map((worksheet, index) => (
              <Card
                key={worksheet.id}
                className="group overflow-hidden rounded-[2.25rem] border border-slate-200/80 bg-white/80 shadow-xl shadow-slate-200/35 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1.5 hover:border-blue-300 dark:border-white/10 dark:bg-white/5 dark:shadow-none dark:hover:border-cyan-400/40"
              >
                <CardContent className="p-6">
                  <div className="rounded-[1.8rem] border border-slate-200/70 bg-[linear-gradient(135deg,rgba(248,250,252,0.95),rgba(219,234,254,0.75))] p-6 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.7),rgba(8,145,178,0.14))]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <Badge className="rounded-full bg-slate-950 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white dark:bg-cyan-300 dark:text-slate-950">
                          {worksheet.class}
                        </Badge>
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-700 dark:text-cyan-300">
                          {worksheet.subject}
                        </p>
                      </div>
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-md dark:bg-white/10 dark:text-white dark:shadow-none">
                        <FileText className="h-7 w-7" />
                      </div>
                    </div>

                    <div className="mt-8">
                      <h3 className="text-2xl font-black uppercase tracking-tight text-slate-950 dark:text-white">
                        {worksheet.title}
                      </h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {worksheet.topic || "Practice the published worksheet in a guided session with consistent question structure and immediate answer feedback."}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                        {index % 3 === 0 ? "Fresh review" : index % 2 === 0 ? "Student ready" : "Stable draft"}
                      </p>
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-white/70 dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-slate-950 dark:bg-cyan-300"
                          style={{ width: `${60 + ((index % 4) * 10)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="grid grid-cols-2 gap-3 px-6 pb-6 pt-0">
                  <Button
                    variant="outline"
                    className="h-12 rounded-2xl border-slate-200 bg-white/80 font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                    asChild
                  >
                    <a href={`/api/worksheets/${worksheet.id}/pdf`} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      PDF
                    </a>
                  </Button>
                  <Button
                    className="h-12 rounded-2xl bg-slate-950 font-black tracking-tight text-white shadow-lg shadow-slate-300/40 hover:bg-slate-800 dark:bg-cyan-300 dark:text-slate-950 dark:shadow-cyan-500/20 dark:hover:bg-cyan-200"
                    asChild
                  >
                    <Link href={`/worksheets/${worksheet.id}/practice`}>
                      <Play className="mr-2 h-4 w-4 fill-current" />
                      Practice
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full rounded-[2.5rem] border border-dashed border-slate-300 bg-white/75 px-6 py-18 text-center shadow-lg shadow-slate-200/30 dark:border-white/15 dark:bg-white/5 dark:shadow-none">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-slate-400">
                <Search className="h-10 w-10" />
              </div>
              <h3 className="mt-6 text-3xl font-black uppercase tracking-tight text-slate-950 dark:text-white">No worksheets in this view</h3>
              <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
                The library is empty for the current filter combination. Clear the filters or switch grade and subject selections.
              </p>
              <Button
                variant="outline"
                className="mt-8 h-12 rounded-2xl border-slate-200 bg-white px-8 font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                asChild
              >
                <Link href="/">Clear filters</Link>
              </Button>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-200/70 py-10 dark:border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white dark:bg-cyan-300 dark:text-slate-950">
              P
            </div>
            <div>
              <p className="text-base font-black tracking-tight text-slate-950 dark:text-white">PDF Finder</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Created by Rayyan Shaik</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            <Link href="/" className="transition-colors hover:text-blue-700 dark:hover:text-cyan-300">Home</Link>
            <Link href="#workflow" className="transition-colors hover:text-blue-700 dark:hover:text-cyan-300">Workflow</Link>
            <Link href="#library" className="transition-colors hover:text-blue-700 dark:hover:text-cyan-300">Library</Link>
            {auth.profile?.role === "admin" && (
              <Link href="/admin" className="transition-colors hover:text-blue-700 dark:hover:text-cyan-300">Admin</Link>
            )}
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400">© 2026 PDF Finder Project</p>
        </div>
      </footer>
    </div>
  );
}
