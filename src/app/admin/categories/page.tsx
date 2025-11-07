'use server'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminCategoriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className="p-6">Not authenticated</div>
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') return <div className="p-6">Unauthorized</div>

  const { data: categories } = await supabase
    .from('service_categories')
    .select('id, name, slug, description, parent_id, is_active')
    .order('name')
    .limit(100)

  const roots = (categories || []).filter(c => !c.parent_id)
  const children: Record<string, any[]> = {}
  for (const c of (categories || [])) {
    if (c.parent_id) {
      children[c.parent_id] = children[c.parent_id] || []
      children[c.parent_id].push(c)
    }
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-3xl font-bold">Category Management</h1>
        <p className="text-sm text-muted-foreground">Create, edit and deactivate service categories.</p>
        <Link href="/admin/categories/new" className="text-primary underline text-sm">New Category</Link>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roots.map(r => (
            <div key={r.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold">{r.name}</h2>
                <span className={`text-xs px-2 py-1 rounded ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{r.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{r.description}</p>
              <div className="space-y-1">
                {(children[r.id] || []).map(ch => (
                  <div key={ch.id} className="flex items-center justify-between text-xs">
                    <span>{ch.name}</span>
                    <Link href={`/admin/categories/${ch.id}`} className="text-primary underline">Edit</Link>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Link href={`/admin/categories/${r.id}`} className="text-primary text-xs underline">Edit Root</Link>
              </div>
            </div>
          ))}
          {roots.length === 0 && <p className="text-sm text-muted-foreground">No categories yet.</p>}
        </div>
      </div>
    </div>
  )
}
