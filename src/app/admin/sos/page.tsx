import { createClient } from '@/lib/supabase/server'
import { SOSPageClient } from '@/components/admin/sos-page-client'

interface SOSAlert {
  id: string
  status: string
  time_elapsed_minutes: number
}

export default async function AdminSOSPage() {
  const supabase = await createClient()

  const { data: alerts, error } = await supabase.rpc('get_active_sos_alerts')

  // Calculate stats
  const totalAlerts = alerts?.length || 0
  const pendingAlerts = alerts?.filter((a: SOSAlert) => a.status === 'pending').length || 0
  const acknowledgedAlerts = alerts?.filter((a: SOSAlert) => a.status === 'acknowledged').length || 0
  const avgResponseTime = alerts?.reduce((sum: number, a: SOSAlert) => sum + (a.time_elapsed_minutes || 0), 0) / (totalAlerts || 1)

  return (
    <SOSPageClient
      alerts={alerts || []}
      stats={{
        totalAlerts,
        pendingAlerts,
        acknowledgedAlerts,
        avgResponseTime: Math.round(avgResponseTime),
      }}
      error={error?.message}
    />
  )
}
