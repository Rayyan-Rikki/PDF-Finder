'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function voteForPresentation(presentationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { error } = await supabase
    .from('votes')
    .insert({
      presentation_id: presentationId,
      user_id: user.id
    })

  if (error) {
    if (error.code === '23505') { // unique_violation
        return { error: 'You have already voted for this project.' }
    }
    return { error: error.message }
  }

  revalidatePath(`/presentations/${presentationId}`)
  return { success: true }
}

export async function addComment(presentationId: string, body: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  if (!body || body.trim().length === 0) {
    return { error: 'Comment body cannot be empty.' }
  }

  const { error } = await supabase
    .from('comments')
    .insert({
      presentation_id: presentationId,
      user_id: user.id,
      body: body.trim()
    })

  if (error) return { error: error.message }

  revalidatePath(`/presentations/${presentationId}`)
  return { success: true }
}

export async function softDeleteComment(commentId: string, presentationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { error } = await supabase
    .from('comments')
    .update({ is_deleted: true })
    .eq('id', commentId)

  if (error) return { error: error.message }

  revalidatePath(`/presentations/${presentationId}`)
  return { success: true }
}
