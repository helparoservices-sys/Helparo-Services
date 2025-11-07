'use server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminServicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className="p-6">Not authenticated</div>
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') return <div className="p-6">Unauthorized</div>

  const { data: services } = await supabase
    .from('service_categories')
    .select('id, name, slug, description, parent_id, is_active, icon')
    .order('name')

  const roots = (services || []).filter(s => !s.parent_id)

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Service Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage service catalog & dynamic pricing</p>
          </div>
          <Link href="/admin/services/new" className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary/90">+ Add Service</Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roots.map(svc => {
            const children = (services || []).filter((s: any) => s.parent_id === svc.id)
            return (
              <div key={svc.id} className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{svc.icon || '📦'}</div>
                    <div>
                      <h3 className="font-semibold text-lg">{svc.name}</h3>
                      <p className="text-xs text-gray-500">{svc.slug}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${svc.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200'}`}>
                    {svc.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{svc.description}</p>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-500">Sub-services ({children.length})</div>
                  {children.map((child: any) => (
                    <div key={child.id} className="flex items-center justify-between text-sm py-1">
                      <span>{child.name}</span>
                      <Link href={`/admin/services/${child.id}`} className="text-primary text-xs hover:underline">Edit</Link>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href={`/admin/services/${svc.id}`} className="text-sm text-primary hover:underline">Edit Category</Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
