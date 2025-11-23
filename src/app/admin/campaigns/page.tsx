import { createClient } from '@/lib/supabase/server'
import CampaignsPageClient from '@/components/admin/campaigns-page-client'

export default async function AdminCampaignsPage() {
  const supabase = await createClient()
  const { data: campaigns } = await supabase
    .from('seasonal_campaigns')
    .select('*, categories:campaign_applicable_services(category_id)')
    .order('created_at', { ascending: false })

  const { data: categories } = await supabase
    .from('service_categories')
    .select('id,name')
    .order('name')

  return <CampaignsPageClient campaigns={campaigns || []} categories={categories || []} />
}
