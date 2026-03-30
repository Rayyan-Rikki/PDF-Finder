"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FilterSectionProps {
  classes: string[];
  subjects: string[];
}

export default function FilterSection({ classes, subjects }: FilterSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const selectedClass = searchParams.get("class") || "all";
  const selectedSubject = searchParams.get("subject") || "all";

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/");
  };

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-4 shadow-lg shadow-slate-200/40 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
      <div className="flex-1 min-w-[200px]">
        <Select value={selectedClass} onValueChange={(val) => updateFilter("class", val)}>
          <SelectTrigger className="w-full border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100">
            <SelectValue placeholder="All Grades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {classes.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-[200px]">
        <Select value={selectedSubject} onValueChange={(val) => updateFilter("subject", val)}>
          <SelectTrigger className="w-full border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(selectedClass !== "all" || selectedSubject !== "all") && (
        <Button variant="ghost" onClick={clearFilters} className="text-slate-500 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400">
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
