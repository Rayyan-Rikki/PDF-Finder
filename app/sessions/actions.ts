'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function registerForSession(sessionId: string, type: 'attendee' | 'presenter') {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Check if profile exists (RLS might handle it, but good to check)
  
  const { error } = await supabase
    .from('registrations')
    .insert({
      session_id: sessionId,
      user_id: user.id,
      type: type
    })

  if (error) {
    // Check for unique constraint violation
    if (error.code === '23505') { // unique_violation
        return { error: 'You are already registered for this session.' }
    }
    return { error: error.message }
  }

  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath('/sessions')
  return { success: true }
}
