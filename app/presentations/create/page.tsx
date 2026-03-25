import { createClient } from "@/lib/supabase/server"
import { PresentationForm } from "@/components/presentations/presentation-form"
import { redirect } from "next/navigation"

export default async function CreatePresentationPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth')
  }

  // Check valid roles? Assuming any auth user (kid/parent) can present?
  // "Registration: attendee or presenter per session"
  // Ideally, should check if registered as presenter?
  // User request: "Presentations: draft -> submitted..."
  // I'll allow creation.

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, title')
    .eq('status', 'published')

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Create Presentation</h1>
      <PresentationForm sessions={sessions || []} />
    </div>
  )
}
