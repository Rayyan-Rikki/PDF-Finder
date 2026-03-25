import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function PresentationsGalleryPage() {
  const supabase = await createClient()

  const { data: presentations, error } = await supabase
    .from('presentations')
    .select('*, profiles(display_name), sessions(title)')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    
  if (error) {
    console.error('Error fetching presentations:', error)
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Discovery Gallery</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {presentations?.map((p: any) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle>{p.title}</CardTitle>
              <div className="text-sm text-gray-500">by {p.profiles?.display_name}</div>
            </CardHeader>
            <CardContent>
               <div className="text-xs font-medium text-blue-600 mb-2">{p.sessions?.title}</div>
               <p className="line-clamp-3 text-sm">{p.abstract}</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <Link href={`/presentations/${p.id}`}>View Project</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
        {presentations?.length === 0 && (
          <div className="col-span-full text-center text-gray-500">No projects have been approved yet. Be the first!</div>
        )}
      </div>
    </div>
  )
}
