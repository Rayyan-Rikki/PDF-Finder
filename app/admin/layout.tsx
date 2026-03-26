import Link from "next/link";
import { LayoutDashboard, Upload, BookOpen } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white p-6 flex flex-col gap-8 shadow-sm">
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">P</div>
          <h1 className="text-xl font-bold tracking-tight">PDF Finder</h1>
        </div>
        
        <nav className="flex-1 flex flex-col gap-1">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors text-slate-700 font-medium">
            <LayoutDashboard className="w-5 h-5 opacity-70" />
            <span>Dashboard</span>
          </Link>
          <Link href="/admin/upload" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors text-slate-700 font-medium">
            <Upload className="w-5 h-5 opacity-70" />
            <span>Upload PDF</span>
          </Link>
          <Link href="/admin/worksheets" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors text-slate-700 font-medium">
            <BookOpen className="w-5 h-5 opacity-70" />
            <span>Manage Worksheets</span>
          </Link>
        </nav>
        
        <div className="mt-auto border-t pt-4">
           <p className="text-xs text-slate-400 px-3">Admin Portal v1.0</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50/50">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
