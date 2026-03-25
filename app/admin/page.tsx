import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { ReviewQueue } from "@/components/admin/ReviewQueue"
import { SessionManager } from "@/components/admin/SessionManager"

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Double check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch pending review queue
  const { data: pendingPresentations } = await supabase
    .from('presentations')
    .select('*, profiles(display_name), sessions(title)')
    .eq('status', 'submitted')
    .order('created_at', { ascending: true })

  // Fetch all sessions
  const { data: allSessions } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500">Manage sessions and review builder submissions.</p>
        </div>
        <div className="text-sm bg-blue-50 text-blue-700 py-1 px-3 rounded-full border border-blue-200">
          Admin Portal
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <ReviewQueue presentations={pendingPresentations || []} />
        </div>
        <div className="space-y-8">
          <SessionManager sessions={allSessions || []} />
        </div>
      </div>
    </div>
  )
}
