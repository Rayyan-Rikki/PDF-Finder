import { createClient } from "@/lib/supabase/server"
import { RegistrationButton } from "@/components/sessions/registration-button"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function SessionDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { id } = params
  
  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (!session) {
    notFound()
  }

  const { data: { user } } = await supabase.auth.getUser()
  
  let isRegistered = false
  if (user) {
    const { data: registration } = await supabase
        .from('registrations')
        .select('id')
        .eq('session_id', id)
        .eq('user_id', user.id)
        .single()
    if (registration) isRegistered = true
  }

  // Fetch approved presentations
  const { data: presentations } = await supabase
    .from('presentations')
    .select('*, profiles(display_name)')
    .eq('session_id', id)
    .eq('status', 'approved')

  return (
    <div className="container mx-auto p-8">
      <div className="mb-4">
        <Link href="/sessions" className="text-blue-600 hover:underline">? Back to Sessions</Link>
      </div>
      <h1 className="text-4xl font-bold mb-2">{session.title}</h1>
      <p className="text-xl text-gray-600 mb-6">{session.theme}</p>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
           <h2 className="text-2xl font-semibold mb-4">About this Session</h2>
           <p className="whitespace-pre-wrap mb-8">{session.description}</p>
           
           <h3 className="text-2xl font-semibold mb-4">Gallery</h3>
           {presentations?.length === 0 ? (
             <p className="text-gray-500">No presentations yet.</p>
           ) : (
             <div className="grid gap-4">
                {presentations?.map((p: any) => (
                    <div key={p.id} className="border p-4 rounded bg-white shadow-sm">
                        <Link href={`/presentations/${p.id}`} className="text-lg font-bold hover:underline">
                            {p.title}
                        </Link>
                        <p className="text-sm text-gray-500">by {p.profiles?.display_name || 'Unknown'}</p>
                    </div>
                ))}
             </div>
           )}
        </div>
        
        <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow border">
                <h3 className="font-semibold mb-4">Session Details</h3>
                <div className="space-y-2 mb-6">
                    <div>
                        <span className="font-medium">Start:</span> {new Date(session.start_at).toLocaleString()}
                    </div>
                    <div>
                        <span className="font-medium">End:</span> {new Date(session.end_at).toLocaleString()}
                    </div>
                    <div>
                        <span className="font-medium">Status:</span> <span className="capitalize">{session.status}</span>
                    </div>
                </div>
                
                {user ? (
                   <RegistrationButton sessionId={id} isRegistered={isRegistered} />
                ) : (
                   <Link href="/auth" className="block text-center bg-primary text-white py-2 rounded">
                     Login to Register
                   </Link>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}
