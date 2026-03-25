import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { submitPresentation } from "../actions"
import { VotingButton } from "@/components/presentations/VotingButton"
import { CommentsSection } from "@/components/presentations/CommentsSection"

export default async function PresentationDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { id } = params

  const { data: presentation } = await supabase
    .from('presentations')
    .select('*, profiles(user_id, display_name, role), sessions(title)')
    .eq('id', id)
    .single()

  if (!presentation) {
    notFound()
  }

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === presentation.owner_user_id

  // Fetch role of current user
  let isAdmin = false
  let currentUserId = user?.id
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    isAdmin = profile?.role === 'admin'
  }

  // Fetch initial votes count
  const { count: votesCount } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('presentation_id', id)

  // Check if current user has voted
  let hasVoted = false
  if (user) {
    const { data: vote } = await supabase
      .from('votes')
      .select('id')
      .eq('presentation_id', id)
      .eq('user_id', user.id)
      .single()
    hasVoted = !!vote
  }

  // Fetch comments (non-deleted)
  const { data: comments } = await supabase
    .from('comments')
    .select('*, profiles(display_name)')
    .eq('presentation_id', id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto p-8">
      <div className="mb-4">
        <Link href="/presentations" className="text-blue-600 hover:underline">? Back to Gallery</Link>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">{presentation.title}</h1>
            <p className="text-sm text-gray-500">by {presentation.profiles?.display_name} | Session: {presentation.sessions?.title}</p>
          </div>
          
          <div className="prose max-w-none">
            <h2 className="text-2xl font-semibold mb-4">Abstract</h2>
            <p className="whitespace-pre-wrap">{presentation.abstract}</p>
          </div>

          {presentation.video_url && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Video Presentation</h2>
              <div className="aspect-video bg-black rounded-lg flex items-center justify-center text-white overflow-hidden">
                 {/* Video URL embedding would happen here if we had a player component. For now, a link. */}
                <a href={presentation.video_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex flex-col items-center gap-2">
                  <span className="text-4xl text-blue-500">?</span>
                  Watch Video on External Site
                </a>
              </div>
            </div>
          )}

          <div className="border-t pt-8">
            <h2 className="text-2xl font-semibold mb-6">Discussion</h2>
            <CommentsSection 
              presentationId={id} 
              comments={comments || []} 
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow border sticky top-8 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Project Status</h3>
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                presentation.status === 'approved' ? 'bg-green-100 text-green-800' :
                presentation.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                presentation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {presentation.status.toUpperCase()}
              </div>
            </div>

            {isOwner && presentation.status === 'draft' && (
              <form action={async () => {
                'use server'
                await submitPresentation(id)
              }}>
                <Button className="w-full">Submit for Review</Button>
                <p className="text-xs text-center text-gray-400 mt-2">Ready to share? Submit your project to the admin review queue.</p>
              </form>
            )}

            <div className="pt-6 border-t">
               <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Appreciation</h3>
               {presentation.status === 'approved' ? (
                 <VotingButton 
                   presentationId={id} 
                   initialVotes={votesCount || 0} 
                   hasVoted={hasVoted} 
                 />
               ) : (
                 <p className="text-sm text-gray-400 bg-gray-50 p-4 rounded text-center italic">
                   Voting will open once the project is approved.
                 </p>
               )}
            </div>
            
            <div className="pt-6 border-t text-center">
                 <p className="text-xs text-gray-400">Created: {new Date(presentation.created_at).toLocaleDateString()}</p>
                 <p className="text-xs text-gray-400">Last updated: {new Date(presentation.updated_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
