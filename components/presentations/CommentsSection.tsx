'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Trash2 } from 'lucide-react'
import { addComment, softDeleteComment } from '@/app/presentations/interaction-actions'

export function CommentsSection({ 
    presentationId, 
    comments, 
    currentUserId, 
    isAdmin 
}: { 
    presentationId: string, 
    comments: any[], 
    currentUserId?: string, 
    isAdmin: boolean 
}) {
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim() || loading) return
    
    setLoading(true)
    setError('')
    
    const result = await addComment(presentationId, newComment)
    setLoading(false)
    
    if (result?.error) {
      setError(result.error)
    } else {
      setNewComment('')
      // In a real app, we'd probably use optimistic updates or revalidatePath would trigger a refresh.
      // For this MVP, we'll let the server action handle revalidation.
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm('Are you sure you want to delete this comment?')) return
    await softDeleteComment(commentId, presentationId)
  }

  return (
    <div className="space-y-8">
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="What do you think about this project?"
              className="resize-none"
              rows={3}
            />
          </div>
          <Button type="submit" disabled={loading || !newComment.trim()}>
            {loading ? 'Posting...' : 'Post Comment'}
          </Button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>
      ) : (
        <div className="bg-gray-50 border rounded-lg p-4 text-center text-sm text-gray-500">
          Please <a href="/auth" className="text-blue-600 hover:underline">login</a> to join the conversation.
        </div>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 italic text-sm text-center py-4">No comments yet. Be the first to say something!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-white border rounded-lg p-4 shadow-sm relative group">
              <div className="flex justify-between items-start mb-2">
                <div className="font-semibold text-sm">{comment.profiles?.display_name || 'Anonymous'}</div>
                <div className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</div>
              </div>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.body}</p>
              
              {(isAdmin || comment.user_id === currentUserId) && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="absolute bottom-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete comment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
