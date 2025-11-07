'use server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminLegalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className="p-6">Not authenticated</div>
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') return <div className="p-6">Unauthorized</div>

  const { data: documents } = await supabase
    .from('legal_documents')
    .select('id, type, title, version, is_active, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Legal Documents</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage terms, privacy policy & legal content</p>
          </div>
          <Link href="/admin/legal/new" className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary/90">+ Add Document</Link>
        </div>

        <div className="grid gap-4">
          {(documents || []).map((doc: any) => (
            <div key={doc.id} className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-lg">{doc.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${doc.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200'}`}>
                      {doc.is_active ? 'Active' : 'Draft'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Type: {doc.type} • Version: {doc.version} • Created: {new Date(doc.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/legal/${doc.type}`} className="text-primary text-sm hover:underline" target="_blank">Preview</Link>
                  <Link href={`/admin/legal/${doc.id}`} className="text-primary text-sm hover:underline">Edit</Link>
                </div>
              </div>
            </div>
          ))}
          {(!documents || documents.length === 0) && (
            <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
              No legal documents found. Create terms and privacy policy.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
