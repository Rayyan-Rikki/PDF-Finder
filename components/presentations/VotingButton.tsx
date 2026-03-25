'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ThumbsUp } from 'lucide-react'
import { voteForPresentation } from '@/app/presentations/interaction-actions'

export function VotingButton({ presentationId, initialVotes, hasVoted }: { presentationId: string, initialVotes: number, hasVoted: boolean }) {
  const [votes, setVotes] = useState(initialVotes)
  const [voted, setVoted] = useState(hasVoted)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleVote() {
    if (voted || loading) return
    setLoading(true)
    setError('')
    
    const result = await voteForPresentation(presentationId)
    setLoading(false)
    
    if (result?.error) {
      setError(result.error)
    } else {
      setVotes(votive => votive + 1)
      setVoted(true)
    }
  }

  return (
    <div className="space-y-2">
      <Button 
        onClick={handleVote} 
        disabled={voted || loading}
        variant={voted ? "secondary" : "default"}
        className="w-full flex items-center justify-center gap-2"
      >
        <ThumbsUp className={`w-4 h-4 ${voted ? 'fill-current' : ''}`} />
        {voted ? 'Voted' : 'Vote for Project'}
      </Button>
      <div className="text-center text-sm font-medium">
        {votes} {votes === 1 ? 'Vote' : 'Votes'}
      </div>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  )
}
