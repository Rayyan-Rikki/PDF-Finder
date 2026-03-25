import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <nav className="border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Rayyan Gen Alpha Builders
          </Link>
          <div className="flex gap-4">
            <Link href="/sessions">
              <Button variant="ghost">Sessions</Button>
            </Link>
            <Link href="/presentations">
              <Button variant="ghost">Gallery</Button>
            </Link>
            <Link href="/auth">
              <Button>Login / Join</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Empowering the Next Generation of Builders
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
              Join exclusive sessions, share your creative projects, and connect with a community of innovative young minds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sessions">
                <Button size="lg" className="px-8 text-lg">
                  Browse Sessions
                </Button>
              </Link>
              <Link href="/presentations">
                <Button size="lg" variant="outline" className="px-8 text-lg">
                  View Project Gallery
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <section className="bg-white py-20 border-t">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-12 text-left">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  📅
                </div>
                <h3 className="text-xl font-bold text-slate-900">Live Sessions</h3>
                <p className="text-slate-600">Register for interactive building sessions and workshops hosted by experts.</p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                  🚀
                </div>
                <h3 className="text-xl font-bold text-slate-900">Showcase Projects</h3>
                <p className="text-slate-600">Submit your Minecraft builds, LEGO creations, or coding projects to our public gallery.</p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                  🗳️
                </div>
                <h3 className="text-xl font-bold text-slate-900">Community Interaction</h3>
                <p className="text-slate-600">Vote on your favorite projects and leave encouraging comments for fellow builders.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-slate-50">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p>© 2024 Rayyan Gen Alpha Builders. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
