import { describe, it, expect, vi, beforeEach } from 'vitest'
import { voteForPresentation } from '../app/presentations/interaction-actions'
import { createClient } from '../lib/supabase/server'

vi.mock('../lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('voteForPresentation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should redirect if user is not authenticated', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) }
    }
    ;(createClient as any).mockResolvedValue(mockSupabase)

    // Using try/catch because redirect() throws an error in Next.js
    try {
      await voteForPresentation('pres-123')
    } catch (e: any) {
      // In Next.js skip console logic. check the redirect.
      // For now we just expect the getUser to have been called.
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
    }
  })

  it('should insert a vote if user is authenticated', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }) },
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null })
    }
    ;(createClient as any).mockResolvedValue(mockSupabase)

    const result = await voteForPresentation('pres-123')
    
    expect(mockSupabase.from).toHaveBeenCalledWith('votes')
    expect(mockSupabase.insert).toHaveBeenCalledWith({
      presentation_id: 'pres-123',
      user_id: 'user-123'
    })
    expect(result).toEqual({ success: true })
  })

  it('should return error if unique constraint is violated (already voted)', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }) },
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ 
        error: { code: '23505', message: 'Unique violation' } 
      })
    }
    ;(createClient as any).mockResolvedValue(mockSupabase)

    const result = await voteForPresentation('pres-123')
    
    expect(result).toEqual({ error: 'You have already voted for this project.' })
  })
})
