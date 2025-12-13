import { UserDetailsPageClient } from '@/components/admin/user-details-page-client'

export const dynamic = 'force-dynamic'

export default async function AdminUserDetailsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = (await searchParams) || {}
  const typeParam = Array.isArray(sp.type) ? sp.type[0] : sp.type
  const idParam = Array.isArray(sp.id) ? sp.id[0] : sp.id

  const initialView = typeParam === 'helper' ? 'helpers' : typeParam === 'customer' ? 'customers' : undefined

  return <UserDetailsPageClient initialView={initialView} initialUserId={idParam} />
}
