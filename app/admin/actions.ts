'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const sessionSchema = z.object({
  title: z.string().min(3),
  theme: z.string().min(2),
  description: z.string().min(10),
  start_at: z.string(),
  end_at: z.string(),
  status: z.enum(['draft', 'published', 'closed']),
})

export async function updatePresentationStatus(id: string, status: 'approved' | 'rejected') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('presentations')
    .update({ status })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath(`/presentations/${id}`)
  return { success: true }
}

export async function upsertSession(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const rawData = {
    title: formData.get('title'),
    theme: formData.get('theme'),
    description: formData.get('description'),
    start_at: formData.get('start_at'),
    end_at: formData.get('end_at'),
    status: formData.get('status'),
  }

  const validated = sessionSchema.safeParse(rawData)
  if (!validated.success) return { error: 'Invalid fields' }

  const id = formData.get('id') as string

  const sessionData = {
    ...validated.data,
    created_by: user.id
  }

  let error;
  if (id) {
    const { error: updateError } = await supabase
      .from('sessions')
      .update(sessionData)
      .eq('id', id)
    error = updateError
  } else {
    const { error: insertError } = await supabase
      .from('sessions')
      .insert(sessionData)
    error = insertError
  }

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath('/sessions')
  redirect('/admin')
}
