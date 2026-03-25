'use client'

import { useState } from 'react'
import { createKidAccount } from '@/app/auth/actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export function AddKidForm() {
    const [message, setMessage] = useState('')

    async function handleSubmit(formData: FormData) {
        const result = await createKidAccount(formData as any)
        if (result?.error) {
            setMessage(result.error)
        } else {
            setMessage('Kid account created successfully!')
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Add a Kid Builder</CardTitle>
                <CardDescription>Create an account for your child (under 13).</CardDescription>
            </CardHeader>
            <form action={(formData) => { handleSubmit(formData) }}>
                <CardContent className="space-y-2">
                    <div className="space-y-1">
                        <Label htmlFor="kid-username">Username</Label>
                        <Input id="kid-username" name="username" placeholder="space_explorer" required />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="kid-password">Password</Label>
                        <Input id="kid-password" name="password" type="password" required />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="kid-age">Age</Label>
                        <Input id="kid-age" name="age" type="number" min="5" max="12" required />
                    </div>
                    {message && <p className="text-sm text-blue-600">{message}</p>}
                </CardContent>
                <CardFooter>
                    <Button type="submit">Create Kid Account</Button>
                </CardFooter>
            </form>
        </Card>
    )
}
