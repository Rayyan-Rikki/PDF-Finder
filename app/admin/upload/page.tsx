"use client";

import { useState } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Info, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CLASSES = [
  "LKG", "UKG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", 
  "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"
];

const SUBJECTS = [
  "Mathematics", "Science", "English", "Social Studies", "Hindi", "Environmental Studies",
  "Physics", "Chemistry", "Biology", "Computer Science", "History", "Geography", "Civics"
];

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        setError("Only PDF files are supported.");
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }
    if (!selectedClass || !selectedSubject) {
      setError("Please select a class and subject.");
      return;
    }

    setLoading(true);
    setStatus("idle");
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("file", file);
    formData.set("class", selectedClass);
    formData.set("subject", selectedSubject);

    try {
      const res = await fetch("/api/worksheets/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setStatus("success");
      setFile(null);
      form.reset();
      setSelectedClass("");
      setSelectedSubject("");
    } catch (err: unknown) {
      console.error(err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Upload Worksheet</h2>
        <p className="text-slate-500 mt-2">Upload a worksheet PDF and let AI extract questions for your interactive quiz.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-xl">Worksheet Details</CardTitle>
              <CardDescription>Provide metadata to help students find this content.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Worksheet Title</Label>
                    <Input id="title" name="title" placeholder="e.g. Photosynthesis Basics" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic (Optional)</Label>
                    <Input id="topic" name="topic" placeholder="e.g. Plant Biology" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Class / Grade</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLASSES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>PDF Document</Label>
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 transition-all flex flex-col items-center justify-center gap-4 ${
                      file ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {file ? (
                      <>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-slate-900">{file.name}</p>
                          <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setFile(null)} className="text-slate-500">
                          Change file
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <Label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:underline font-medium">
                            Click to upload
                          </Label>
                          <p className="text-xs text-slate-500 mt-1">or drag and drop worksheet PDF</p>
                        </div>
                        <Input 
                          id="file-upload" 
                          type="file" 
                          className="hidden" 
                          accept=".pdf" 
                          onChange={handleFileChange} 
                        />
                      </>
                    )}
                  </div>
                </div>

                {status === "success" && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-lg flex gap-3 items-center animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">Success! Worksheet has been uploaded and AI is extracting Q&A.</p>
                  </div>
                )}

                {status === "error" && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex gap-3 items-center animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full h-12 text-md font-semibold bg-blue-600 hover:bg-blue-700 shadow-md transition-all">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing PDF...
                    </>
                  ) : (
                    <>
                      Start AI Extraction
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-blue-600 text-white border-none shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Info className="w-24 h-24" />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Pro Tip
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-50 text-sm leading-relaxed">
                For best results, ensure the PDF is clear and text-based. AI works best with structured worksheets that have clearly marked questions and spaces for answers.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 border-dashed bg-slate-50/50">
            <CardHeader>
              <CardTitle className="text-slate-700 text-lg">Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">1</div>
                <p className="text-sm text-slate-600">AI extracts text and images from your PDF to identify Q&A pairs.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">2</div>
                <p className="text-sm text-slate-600">Review the generated draft on the &quot;Review&quot; page to ensure accuracy.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">3</div>
                <p className="text-sm text-slate-600">Publish the worksheet to make it available for students to practice.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
