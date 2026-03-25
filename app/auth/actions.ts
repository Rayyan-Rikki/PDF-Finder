'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const validatedFields = schema.safeParse(data)

  if (!validatedFields.success) {
    return { error: 'Invalid fields' }
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const validatedFields = schema.safeParse(data)

  if (!validatedFields.success) {
    return { error: 'Invalid fields' }
  }

  const { data: authData, error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  if (authData.user) {
    // initialize profile as parent by default
    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: authData.user.id,
      role: 'parent',
      display_name: data.email.split('@')[0], 
    })
    
    if (profileError) {
       console.error('Profile creation failed:', profileError)
       // consider rollback or manual handling
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const kidSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  age: z.coerce.number().min(5).max(12),
})

export async function createKidAccount(formData: FormData) {
  const supabase = await createClient()
  const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!apiKey) {
      return { error: 'Server configuration error: Missing Service Role Key' }
  }
  
  const adminAuth = createAdminClient()

  // Verify current user is parent
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'parent') return { error: 'Only parents can create kid accounts' }

  const data = {
    username: formData.get('username') as string,
    password: formData.get('password') as string,
    age: formData.get('age') as string, // z.coerce handles string->number
  }

  const validated = kidSchema.safeParse(data)
  if (!validated.success) return { error: 'Invalid fields' }

  // Create kid user with admin client
  // Construct a dummy email or use username if allowed? Supabase email is required by default.
  // I'll make a pseudo-email: `parent_email+kid_username@...` or just `${username}@gen-alpha-builders.local`
  const email = `${data.username}@gen-alpha-builders.local`

  const { data: kidUser, error: createError } = await adminAuth.auth.admin.createUser({
    email: email,
    password: data.password,
    email_confirm: true,
    user_metadata: { display_name: data.username }
  })

  if (createError) return { error: createError.message }
  if (!kidUser.user) return { error: 'Failed to create user' }

  // Insert profile using admin client (bypass RLS)
  const { error: profileError } = await adminAuth.from('profiles').insert({
    user_id: kidUser.user.id,
    role: 'kid',
    display_name: data.username,
    age: validated.data.age,
    parent_user_id: user.id,
    consent_for_under13: true
  })

  if (profileError) {
     // Cleanup: delete user if profile fails? 
     await adminAuth.auth.admin.deleteUser(kidUser.user.id)
     return { error: 'Failed to create kid profile: ' + profileError.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
