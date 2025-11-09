'use server'

import { createClient } from '@/lib/supabase/server'
import { AlertTriangle, Clock, MapPin, CheckCircle, Phone, Users } from 'lucide-react'

export default async function AdminSOSPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className="p-6">Not authenticated</div>
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') return <div className="p-6">Unauthorized</div>

  const { data: alerts } = await supabase.rpc('get_active_sos_alerts')

  // Calculate stats
  const totalAlerts = alerts?.length || 0
  const pendingAlerts = alerts?.filter((a: any) => a.status === 'pending').length || 0
  const acknowledgedAlerts = alerts?.filter((a: any) => a.status === 'acknowledged').length || 0
  const avgResponseTime = alerts?.reduce((sum: number, a: any) => sum + (a.time_elapsed_minutes || 0), 0) / (totalAlerts || 1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            Active SOS Alerts
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Monitor and respond to safety incidents in real-time</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Alerts</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalAlerts}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shadow-lg">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Pending</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{pendingAlerts}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shadow-lg">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Acknowledged</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{acknowledgedAlerts}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-lg">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Avg Response</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{Math.round(avgResponseTime)}m</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-slate-700/50 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Emergency Alerts</h2>
          </div>
          
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {(alerts || []).map((a: any) => (
              <div key={a.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white capitalize">
                          {a.alert_type.replace('_', ' ')}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            a.status === 'pending' 
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                              : a.status === 'acknowledged'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          }`}>
                            {a.status === 'pending' && <Clock className="h-3 w-3" />}
                            {a.status === 'acknowledged' && <Users className="h-3 w-3" />}
                            {a.status === 'resolved' && <CheckCircle className="h-3 w-3" />}
                            {a.status}
                          </span>
                          <span className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                            <Clock className="h-4 w-4" />
                            {a.time_elapsed_minutes} min ago
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-13 space-y-2">
                      {a.description && (
                        <p className="text-sm text-slate-700 dark:text-slate-300">{a.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <MapPin className="h-4 w-4" />
                        {a.address || `${a.latitude}, ${a.longitude}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {a.status === 'pending' && (
                      <form action={async () => { 
                        'use server'
                        const supabase = await createClient()
                        await supabase.rpc('acknowledge_sos_alert', { p_alert_id: a.id } as any) 
                      }}>
                        <button className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors">
                          <Users className="h-4 w-4" />
                          Acknowledge
                        </button>
                      </form>
                    )}
                    {a.status !== 'resolved' && (
                      <form action={async () => { 
                        'use server'
                        const supabase = await createClient()
                        await supabase.rpc('resolve_sos_alert', { p_alert_id: a.id } as any) 
                      }}>
                        <button className="inline-flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium transition-colors">
                          <CheckCircle className="h-4 w-4" />
                          Resolve
                        </button>
                      </form>
                    )}
                    <button className="inline-flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium transition-colors">
                      <Phone className="h-4 w-4" />
                      Call
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {(!alerts || alerts.length === 0) && (
              <div className="p-12 text-center">
                <CheckCircle className="h-16 w-16 text-green-300 dark:text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Active Alerts</h3>
                <p className="text-slate-500 dark:text-slate-400">All emergency situations are currently resolved.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
