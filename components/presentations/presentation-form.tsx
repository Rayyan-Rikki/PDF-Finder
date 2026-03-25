'use client'

import { upsertPresentation } from '@/app/presentations/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export function PresentationForm({ sessions, presentation }: { sessions: any[], presentation?: any }) {
    const [pending, setPending] = useState(false)

    async function handleSubmit(formData: FormData) {
        setPending(true)
        const result = await upsertPresentation(formData)
        setPending(false)
        if (result?.error) alert(result.error)
    }

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>{presentation ? 'Edit Presentation' : 'Create New Presentation'}</CardTitle>
            </CardHeader>
            <form action={(formData) => { handleSubmit(formData) }}>
                <input type="hidden" name="id" value={presentation?.id || ''} />
                <input type="hidden" name="current_thumbnail_path" value={presentation?.thumbnail_path || ''} />
                <input type="hidden" name="current_file_path" value={presentation?.file_path || ''} />
                
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="session">Session</Label>
                        <Select name="session_id" defaultValue={presentation?.session_id} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a session" />
                            </SelectTrigger>
                            <SelectContent>
                                {sessions.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" name="title" defaultValue={presentation?.title} required placeholder="My Amazing Project" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="abstract">Abstract</Label>
                        <Textarea id="abstract" name="abstract" defaultValue={presentation?.abstract} required placeholder="Describe your project..." />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="thumbnail">Thumbnail Image</Label>
                            <Input id="thumbnail" name="thumbnail" type="file" accept="image/*" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="file">Project PDF (Optional)</Label>
                            <Input id="file" name="file" type="file" accept=".pdf" />
                        </div>
                    </div>

                    <div className="space-y-2">
                         <Label htmlFor="video_url">Video URL (Optional)</Label>
                         <Input id="video_url" name="video_url" defaultValue={presentation?.video_url} placeholder="https://youtube.com/..." type="url" />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={pending} className="w-full">
                        {pending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : (presentation ? 'Update Draft' : 'Save Draft')}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
