'use client'

import { useState } from 'react'
import { registerForSession } from '@/app/sessions/actions'
import { Button } from '@/components/ui/button'

export function RegistrationButton({ sessionId, isRegistered }: { sessionId: string, isRegistered: boolean }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleRegister(type: 'attendee' | 'presenter') {
    setLoading(true)
    setMessage('')
    const result = await registerForSession(sessionId, type)
    setLoading(false)
    if (result?.error) {
      setMessage(result.error)
    } else {
      setMessage('Successfully registered!')
    }
  }

  if (isRegistered) {
    return <Button disabled variant="secondary">Registered</Button>
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button onClick={() => handleRegister('attendee')} disabled={loading}>
          Register as Attendee
        </Button>
        <Button onClick={() => handleRegister('presenter')} disabled={loading} variant="outline">
          Register as Presenter
        </Button>
      </div>
      {message && <p className="text-sm text-blue-600">{message}</p>}
    </div>
  )
}
