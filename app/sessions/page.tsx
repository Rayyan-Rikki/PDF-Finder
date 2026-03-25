import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function SessionsPage() {
  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('status', 'published')
    .order('start_at', { ascending: true })

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Explore Sessions</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sessions?.map((session) => (
          <Card key={session.id}>
            <CardHeader>
              <CardTitle>{session.title}</CardTitle>
              <CardDescription>{new Date(session.start_at).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-2">{session.theme}</p>
              <p className="line-clamp-3">{session.description}</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`/sessions/${session.id}`}>View Details</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
        {sessions?.length === 0 && (
          <div className="col-span-full text-center text-gray-500">No sessions available at the moment.</div>
        )}
      </div>
    </div>
  )
}
