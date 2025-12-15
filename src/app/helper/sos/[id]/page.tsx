'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  AlertTriangle, 
  Phone, 
  MapPin, 
  Navigation, 
  Clock, 
  User, 
  CheckCircle,
  ArrowLeft,
  Heart,
  Shield,
  MessageCircle,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface SOSAlert {
  id: string
  user_id: string
  alert_type: string
  status: string
  description: string
  latitude: number
  longitude: number
  contact_phone: string
  created_at: string
  acknowledged_at: string | null
  acknowledged_by: string | null
  resolved_at: string | null
  customer?: {
    full_name: string
    phone: string
    avatar_url: string | null
  }
}

export default function SOSResponsePage() {
  const params = useParams()
  const router = useRouter()
  const alertId = params.id as string
  const supabase = createClient()
  
  const [alert, setAlert] = useState<SOSAlert | null>(null)
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    loadAlert()
  }, [alertId])

  const loadAlert = async () => {
    setLoading(true)
    
    const { data, error } = await supabase
      .from('sos_alerts')
      .select(`
        *,
        customer:profiles!sos_alerts_user_id_fkey (
          full_name,
          phone,
          avatar_url
        )
      `)
      .eq('id', alertId)
      .single()

    if (error) {
      console.error('Error loading SOS alert:', error)
      toast.error('Could not load SOS alert')
    } else {
      setAlert(data)
    }
    
    setLoading(false)
  }

  const markAsResolved = async () => {
    setResolving(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please log in')
      setResolving(false)
      return
    }

    console.log('Marking SOS as resolved:', { alertId, userId: user.id })

    const { error } = await supabase
      .from('sos_alerts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: user.id
      })
      .eq('id', alertId)

    if (error) {
      console.error('Error marking SOS as resolved:', error)
      toast.error(`Failed to mark as resolved: ${error.message}`)
      setResolving(false)
    } else {
      toast.success('🎉 Thank you! SOS marked as resolved')
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/helper/dashboard')
      }, 1500)
    }
  }

  const openDirections = () => {
    if (alert?.latitude && alert?.longitude) {
      openExternalUrl(
        `https://www.google.com/maps/dir/?api=1&destination=${alert.latitude},${alert.longitude}`
      )
    }
  }

  const getAlertTypeInfo = (type: string) => {
    const types: Record<string, { label: string; emoji: string; color: string; bgColor: string }> = {
      'safety_concern': { label: 'Safety Emergency', emoji: '🚨', color: 'text-red-700', bgColor: 'bg-red-100' },
      'emergency': { label: 'Medical Emergency', emoji: '🏥', color: 'text-blue-700', bgColor: 'bg-blue-100' },
      'dispute': { label: 'Dispute', emoji: '⚠️', color: 'text-orange-700', bgColor: 'bg-orange-100' },
    }
    return types[type] || { label: 'Emergency', emoji: '🆘', color: 'text-red-700', bgColor: 'bg-red-100' }
  }

  const getStatusInfo = (status: string) => {
    const statuses: Record<string, { label: string; color: string; bgColor: string }> = {
      'active': { label: 'Active - Needs Help', color: 'text-red-700', bgColor: 'bg-red-100' },
      'acknowledged': { label: 'Helper Responding', color: 'text-blue-700', bgColor: 'bg-blue-100' },
      'resolved': { label: 'Resolved', color: 'text-green-700', bgColor: 'bg-green-100' },
      'cancelled': { label: 'Cancelled', color: 'text-gray-700', bgColor: 'bg-gray-100' },
    }
    return statuses[status] || { label: status, color: 'text-gray-700', bgColor: 'bg-gray-100' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading SOS details...</p>
        </div>
      </div>
    )
  }

  if (!alert) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
          <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">SOS Alert Not Found</h2>
          <p className="text-gray-500 mb-4">This emergency alert may have been resolved or cancelled.</p>
          <Link href="/helper/dashboard" className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const alertType = getAlertTypeInfo(alert.alert_type)
  const statusInfo = getStatusInfo(alert.status)
  const customerPhone = alert.customer?.phone || alert.contact_phone

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Back Button */}
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      {/* Emergency Header */}
      <div className="bg-gradient-to-br from-red-600 via-red-500 to-orange-500 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black">SOS Emergency Response</h1>
            <p className="text-red-100 text-sm">You are responding to this emergency</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex flex-wrap gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${alertType.bgColor} ${alertType.color}`}>
            {alertType.emoji} {alertType.label}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${statusInfo.bgColor} ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          Customer in Need
        </h3>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {alert.customer?.full_name?.charAt(0) || 'C'}
            </span>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{alert.customer?.full_name || 'Customer'}</p>
            <p className="text-sm text-gray-500">Needs your help urgently</p>
          </div>
        </div>

        {/* Phone - Big and Prominent */}
        {customerPhone && (
          <a 
            href={`tel:${customerPhone}`}
            className="flex items-center gap-4 p-4 bg-green-50 hover:bg-green-100 rounded-2xl border-2 border-green-200 transition-all mb-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <Phone className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">Tap to Call Customer</p>
              <p className="text-2xl font-black text-green-800">{customerPhone}</p>
            </div>
          </a>
        )}

        {/* Description */}
        {alert.description && (
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500 font-medium mb-1">Emergency Description</p>
            <p className="text-gray-800">{alert.description}</p>
          </div>
        )}
      </div>

      {/* Location Card */}
      {alert.latitude && alert.longitude && (
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-600" />
            Customer Location
          </h3>
          
          {/* Map Preview */}
          <div className="relative h-40 rounded-xl overflow-hidden mb-4 bg-gray-100">
            <img 
              src={`https://maps.googleapis.com/maps/api/staticmap?center=${alert.latitude},${alert.longitude}&zoom=15&size=600x200&markers=color:red%7C${alert.latitude},${alert.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}`}
              alt="Location map"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200/80">
              <MapPin className="w-10 h-10 text-red-600" />
            </div>
          </div>

          {/* Coordinates */}
          <p className="text-sm text-gray-500 mb-4">
            Coordinates: {alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)}
          </p>

          {/* Directions Button */}
          <button
            onClick={openDirections}
            className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all"
          >
            <Navigation className="w-6 h-6" />
            Open Google Maps Directions
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Humanity Reminder */}
      <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-2xl p-5 border border-pink-200">
        <div className="flex items-start gap-3">
          <Heart className="w-8 h-8 text-pink-500 flex-shrink-0 animate-pulse" />
          <div>
            <p className="font-bold text-gray-900 text-lg mb-1">Thank You for Responding! 🙏</p>
            <p className="text-gray-600">
              Your kindness and quick response can make a huge difference in someone&apos;s life. 
              You&apos;re not just a helper - you&apos;re a hero!
            </p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-600" />
          Timeline
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">SOS Alert Created</p>
              <p className="text-sm text-gray-500">
                {new Date(alert.created_at).toLocaleString('en-IN', { 
                  dateStyle: 'medium', 
                  timeStyle: 'short' 
                })}
              </p>
            </div>
          </div>

          {alert.acknowledged_at && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Helper Responded</p>
                <p className="text-sm text-gray-500">
                  {new Date(alert.acknowledged_at).toLocaleString('en-IN', { 
                    dateStyle: 'medium', 
                    timeStyle: 'short' 
                  })}
                </p>
              </div>
            </div>
          )}

          {alert.resolved_at && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Emergency Resolved</p>
                <p className="text-sm text-gray-500">
                  {new Date(alert.resolved_at).toLocaleString('en-IN', { 
                    dateStyle: 'medium', 
                    timeStyle: 'short' 
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {alert.status !== 'resolved' && alert.status !== 'cancelled' && (
        <div className="space-y-3">
          <button
            onClick={markAsResolved}
            disabled={resolving}
            className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-green-500/30 transition-all disabled:opacity-50"
          >
            {resolving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <CheckCircle className="w-6 h-6" />
                Mark as Resolved
              </>
            )}
          </button>

          {customerPhone && (
            <a 
              href={`tel:${customerPhone}`}
              className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-green-500 text-green-700 rounded-xl font-bold hover:bg-green-50 transition-all"
            >
              <Phone className="w-6 h-6" />
              Call Customer: {customerPhone}
            </a>
          )}
        </div>
      )}

      {/* Emergency Services */}
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-xs text-gray-500 text-center mb-2">If needed, contact emergency services:</p>
        <div className="flex justify-center gap-4">
          <a href="tel:100" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
            <Phone className="w-4 h-4" /> Police (100)
          </a>
          <a href="tel:102" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
            <Phone className="w-4 h-4" /> Ambulance (102)
          </a>
          <a href="tel:101" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
            <Phone className="w-4 h-4" /> Fire (101)
          </a>
        </div>
      </div>
    </div>
  )
}
