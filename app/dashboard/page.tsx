import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AddKidForm } from "@/components/dashboard/add-kid-form"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!error && !user) {
    redirect('/auth')
  }
  
  if (!user) {
    redirect('/auth')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return <div>Profile not found. Please contact support.</div>
  }

  if (profile.role === 'admin') {
    redirect('/admin')
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <div className="mb-4">
        Welcome back, {profile.display_name}!
      </div>
      
      {profile.role === 'parent' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Parent Controls</h2>
            <p className="mb-4">Here you can manage kid profiles.</p>
            <div className="max-w-md">
                <AddKidForm />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
             <h2 className="text-xl font-semibold mb-2">My Kids</h2>
             {/* List kids here */}
             <div className="text-gray-500">Kid list coming soon...</div>
          </div>
        </div>
      )}

      {profile.role === 'kid' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">My Builder Space</h2>
          <p>Ready to build and share?</p>
          <div className="mt-4">
            <a href="/sessions" className="text-blue-600 hover:underline">Browse Sessions</a>
          </div>
        </div>
      )}
    </div>
  )
}
