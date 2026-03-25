'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { upsertSession } from '@/app/admin/actions'
import { PlusCircle, Calendar } from 'lucide-react'

export function SessionManager({ sessions }: { sessions: any[] }) {
  const [showForm, setShowForm] = useState(false)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Sessions Management</CardTitle>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <PlusCircle className="w-4 h-4 mr-1" /> {showForm ? 'Cancel' : 'New Session'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {showForm && (
          <form action={async (formData) => { await upsertSession(formData) }} className="bg-gray-50 p-4 rounded-lg border space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Session Title</Label>
                    <Input id="title" name="title" placeholder="Space Robotics 2024" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Input id="theme" name="theme" placeholder="Space" required />
                </div>
             </div>
             <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="A challenge to build robots for Mars..." required />
             </div>
             <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="start_at">Start Time</Label>
                    <Input id="start_at" name="start_at" type="datetime-local" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="end_at">End Time</Label>
                    <Input id="end_at" name="end_at" type="datetime-local" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="status">Initial Status</Label>
                    <Select name="status" defaultValue="draft">
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
             </div>
             <Button type="submit" className="w-full">Create Session</Button>
          </form>
        )}

        <div className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-gray-500 italic text-sm text-center py-4">No sessions created yet.</p>
          ) : (
            sessions.map((s) => (
              <div key={s.id} className="border p-3 rounded flex justify-between items-center text-sm">
                <div>
                  <span className="font-semibold">{s.title}</span>
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" /> {new Date(s.start_at).toLocaleDateString()}
                  </div>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                  s.status === 'published' ? 'bg-green-100 text-green-700' : 
                  s.status === 'closed' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {s.status}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
