import { createClient } from '@/lib/supabase/server'
import SupportPageClient from '@/components/admin/support-page-client'

export default async function AdminSupportPage() {
  const supabase = await createClient()

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select(`
      *,
      customer:profiles!support_tickets_user_id_fkey(full_name, email),
      assigned_agent:profiles!support_tickets_assigned_to_fkey(full_name)
    `)
    .order('created_at', { ascending: false })

  const { data: agents } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'admin')
    .order('full_name')

  return <SupportPageClient tickets={tickets || []} agents={agents || []} />
}
