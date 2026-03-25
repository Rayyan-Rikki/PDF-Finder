'use client'

import { useActionState } from 'react'
import { signup } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CardContent, CardFooter } from '@/components/ui/card'

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      return await signup(formData)
    },
    null
  )

  return (
    <form action={formAction}>
      <CardContent className="space-y-2">
        {state?.error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
            {state.error}
          </div>
        )}
        <div className="space-y-1">
          <Label htmlFor="signup-email">Email</Label>
          <Input id="signup-email" name="email" type="email" placeholder="m@example.com" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="signup-password">Password</Label>
          <Input id="signup-password" name="password" type="password" required />
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" disabled={isPending}>
          {isPending ? 'Creating account...' : 'Create account'}
        </Button>
      </CardFooter>
    </form>
  )
}
