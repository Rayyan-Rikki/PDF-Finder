'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const presentationSchema = z.object({
  title: z.string().min(3),
  abstract: z.string().min(10),
  session_id: z.string().uuid(),
  video_url: z.string().url().optional().or(z.literal('')),
})

export async function upsertPresentation(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const rawData = {
    title: formData.get('title'),
    abstract: formData.get('abstract'),
    session_id: formData.get('session_id'),
    video_url: formData.get('video_url'),
  }

  const validated = presentationSchema.safeParse(rawData)
  if (!validated.success) return { error: 'Invalid fields' }

  const id = formData.get('id') as string 
  const thumbnailFile = formData.get('thumbnail') as File
  const presentationFile = formData.get('file') as File

  let thumbnailPath = formData.get('current_thumbnail_path') as string
  let filePath = formData.get('current_file_path') as string

  // Upload thumbnail if provided
  if (thumbnailFile && thumbnailFile.size > 0) {
    const fileExt = thumbnailFile.name.split('.').pop()
    const fileName = `${user.id}-${Math.random()}.${fileExt}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(fileName, thumbnailFile)
    
    if (uploadError) return { error: 'Thumbnail upload failed: ' + uploadError.message }
    thumbnailPath = uploadData.path
  }

  // Upload presentation file if provided
  if (presentationFile && presentationFile.size > 0) {
    const fileExt = presentationFile.name.split('.').pop()
    const fileName = `${user.id}-${Math.random()}.${fileExt}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('presentations')
      .upload(fileName, presentationFile)
    
    if (uploadError) return { error: 'Presentation file upload failed: ' + uploadError.message }
    filePath = uploadData.path
  }

  const presentationData = {
    ...validated.data,
    owner_user_id: user.id,
    thumbnail_path: thumbnailPath,
    file_path: filePath,
    status: 'draft',
    updated_at: new Date().toISOString()
  }

  let resultId = id;
  if (id) {
     const { error: updateError } = await supabase
        .from('presentations')
        .update(presentationData)
        .eq('id', id)
        .eq('owner_user_id', user.id)
        .eq('status', 'draft')
     if (updateError) return { error: updateError.message }
  } else {
     const { data: insertData, error: insertError } = await supabase
        .from('presentations')
        .insert(presentationData)
        .select()
        .single()
     if (insertError) return { error: insertError.message }
     resultId = insertData.id
  }

  revalidatePath('/dashboard')
  revalidatePath('/presentations')
  if (resultId) {
      revalidatePath(`/presentations/${resultId}`)
      redirect(`/presentations/${resultId}`)
  } else {
      redirect('/dashboard')
  }
}

export async function submitPresentation(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('presentations')
        .update({ status: 'submitted' })
        .eq('id', id)
        .eq('owner_user_id', user.id)
        .eq('status', 'draft')

    if (error) return { error: error.message }
    
    revalidatePath(`/presentations/${id}`)
    revalidatePath('/dashboard')
    return { success: true }
}
