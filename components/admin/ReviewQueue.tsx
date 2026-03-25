'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, X, ExternalLink } from 'lucide-react'
import { updatePresentationStatus } from '@/app/admin/actions'
import Link from 'next/link'

export function ReviewQueue({ presentations }: { presentations: any[] }) {
  async function handleStatus(id: string, status: 'approved' | 'rejected') {
    const result = await updatePresentationStatus(id, status)
    if (result?.error) alert(result.error)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Queue</CardTitle>
      </CardHeader>
      <CardContent>
        {presentations.length === 0 ? (
          <p className="text-gray-500 italic text-sm">No presentations pending review.</p>
        ) : (
          <div className="space-y-4">
            {presentations.map((p) => (
              <div key={p.id} className="border p-4 rounded-lg flex justify-between items-center group">
                <div>
                  <h4 className="font-semibold">{p.title}</h4>
                  <p className="text-xs text-gray-500">by {p.profiles?.display_name} | Session: {p.sessions?.title}</p>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="ghost" size="sm" title="View Detail">
                    <Link href={`/presentations/${p.id}`} target="_blank">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => handleStatus(p.id, 'approved')}
                  >
                    <Check className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleStatus(p.id, 'rejected')}
                  >
                    <X className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
