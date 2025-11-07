'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/database.types'
import Link from 'next/link'

type Category = Pick<Database['public']['Tables']['service_categories']['Row'], 'id' | 'name' | 'slug' | 'description' | 'parent_id'>

async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('service_categories')
    .select('id, name, slug, description, parent_id')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return (data as Category[]) || []
}

export default async function ServicesPage() {
  const categories = await getCategories()
  const roots = categories.filter(c => !c.parent_id)
  const childrenByParent: Record<string, Category[]> = {}
  for (const c of categories) {
    if (c.parent_id) {
      childrenByParent[c.parent_id] = childrenByParent[c.parent_id] || []
      childrenByParent[c.parent_id].push(c)
    }
  }

  return (
    <div className="min-h-screen bg-primary-50 py-12 px-4">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold mb-6">Browse Services</h1>
        <p className="text-muted-foreground mb-10 max-w-2xl">Explore categories and find the right expert for your task.</p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roots.map(root => (
            <div key={root.id} className="rounded-lg border bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold mb-2">{root.name}</h2>
              <p className="text-sm text-muted-foreground mb-3">{root.description}</p>
              <div className="space-y-1">
                {(childrenByParent[root.id] || []).map(child => (
                  <Link key={child.id} href={`/services/${child.slug}`} className="block text-sm text-primary hover:underline">
                    {child.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
