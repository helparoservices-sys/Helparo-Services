'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Check, MapPin, IndianRupee, User, Vibrate } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { useRouter } from 'next/navigation'
import { JobAlertService, JobAlertData as ServiceJobData } from '@/lib/job-alert-service'
import { createClient } from '@/lib/supabase/client'

interface JobAlertOverlayProps {
  onAccept: (requestId: string) => void
  onReject: (requestId: string) => void
}

export default function JobAlertOverlay({ onAccept, onReject }: JobAlertOverlayProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [jobData, setJobData] = useState<ServiceJobData | null>(null)
  const [takenByOther, setTakenByOther] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const vibrationRef = useRef<NodeJS.Timeout | null>(null)
  const soundIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // Subscribe to JobAlertService
  useEffect(() => {
    const unsubscribe = JobAlertService.subscribe((data) => {
      if (data) {
        setJobData(data)
        setIsVisible(true)
        setTakenByOther(false)
        startAlertEffects()
      } else {
        setIsVisible(false)
        stopAlertEffects()
      }
    })

    return () => {
      unsubscribe()
      stopAlertEffects()
    }
  }, [])

  // Listen for job being accepted by another helper (realtime)
  useEffect(() => {
    if (!isVisible || !jobData?.jobId) return

    const supabase = createClient()
    
    // Subscribe to changes on the service_requests table
    const channel = supabase
      .channel(`job-status-${jobData.jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests',
          filter: `id=eq.${jobData.jobId}`
        },
        (payload) => {
          const newStatus = (payload.new as any)?.status
          // If job is no longer pending/broadcasted, it was taken
          if (newStatus && !['pending', 'broadcasted'].includes(newStatus)) {
            console.log('🚨 Job taken by another helper, closing alert')
            setTakenByOther(true)
            // Auto-close after showing message
            setTimeout(() => {
              stopAlertEffects()
              setIsVisible(false)
              setTakenByOther(false)
            }, 2000)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isVisible, jobData?.jobId])

  // Play urgent alert sound using Web Audio API
  const playAlertSound = useCallback(() => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioContextRef.current
      
      // Resume if suspended (required by browser autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      
      const playTone = (freq: number, startTime: number, duration: number, volume: number = 0.6) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'square'
        osc.frequency.value = freq
        gain.gain.value = volume
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(startTime)
        osc.stop(startTime + duration)
      }
      
      const now = ctx.currentTime
      // Urgent alert pattern - loud and attention-grabbing
      // Pattern: HIGH-LOW-HIGH-LOW (like an alarm)
      playTone(1200, now, 0.1, 0.7)
      playTone(800, now + 0.12, 0.1, 0.7)
      playTone(1200, now + 0.24, 0.1, 0.7)
      playTone(800, now + 0.36, 0.1, 0.7)
      playTone(1400, now + 0.5, 0.15, 0.8)  // Final higher note
    } catch (err) {
      console.log('Audio not supported:', err)
    }
  }, [])

  const startAlertEffects = useCallback(async () => {
    // Play alert sound immediately
    playAlertSound()
    
    // Continue playing sound every 1.5 seconds
    soundIntervalRef.current = setInterval(() => {
      playAlertSound()
    }, 1500)

    // Continuous vibration pattern
    if (Capacitor.isNativePlatform()) {
      const vibratePattern = async () => {
        try {
          await Haptics.impact({ style: ImpactStyle.Heavy })
        } catch (err) {
          console.log('Haptics failed:', err)
        }
      }
      
      // Vibrate immediately
      vibratePattern()
      // Then vibrate every 400ms
      vibrationRef.current = setInterval(vibratePattern, 400)
    } else {
      // Web vibration API fallback
      if (navigator.vibrate) {
        const webVibrate = () => {
          navigator.vibrate([300, 100, 300, 100, 300])
        }
        webVibrate()
        vibrationRef.current = setInterval(webVibrate, 1200)
      }
    }
  }, [playAlertSound])

  const stopAlertEffects = useCallback(() => {
    // Stop sound loop
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current)
      soundIntervalRef.current = null
    }

    // Stop vibration
    if (vibrationRef.current) {
      clearInterval(vibrationRef.current)
      vibrationRef.current = null
    }
    
    // Stop web vibration
    if (navigator.vibrate) {
      navigator.vibrate(0)
    }
    
    // Clear the service alert
    JobAlertService.clearAlert()
  }, [])

  const handleAccept = async () => {
    stopAlertEffects()
    setIsVisible(false)
    
    if (jobData) {
      // Quick haptic feedback
      if (Capacitor.isNativePlatform()) {
        try {
          await Haptics.impact({ style: ImpactStyle.Heavy })
        } catch {}
      }
      
      onAccept(jobData.jobId)
      
      // Navigate to job details
      router.push(`/helper/jobs/${jobData.jobId}`)
    }
  }

  const handleReject = () => {
    stopAlertEffects()
    setIsVisible(false)
    
    if (jobData) {
      onReject(jobData.jobId)
    }
  }

  if (!isVisible || !jobData) return null

  const urgencyColors = {
    normal: 'from-emerald-500 to-teal-600',
    urgent: 'from-orange-500 to-red-500',
    emergency: 'from-red-600 to-red-800'
  }

  const bgGradient = urgencyColors[jobData.urgency || 'urgent']

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 animate-fade-in">
      {/* Pulsing background effect */}
      <div className="absolute inset-0 animate-pulse-slow opacity-30">
        <div className={`w-full h-full bg-gradient-to-br ${bgGradient}`} />
      </div>

      {/* Taken by another helper overlay */}
      {takenByOther && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="bg-red-500 text-white px-8 py-6 rounded-2xl text-center animate-scale-in">
            <X className="h-12 w-12 mx-auto mb-3" />
            <p className="text-xl font-bold">Job Taken!</p>
            <p className="text-red-100 mt-1">Another helper accepted this job</p>
          </div>
        </div>
      )}

      {/* Main Alert Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className={`bg-gradient-to-r ${bgGradient} p-6 text-white relative overflow-hidden`}>
          {/* Animated rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-4 border-white/20 animate-ping-slow" />
            <div className="absolute w-24 h-24 rounded-full border-4 border-white/30 animate-ping-slower" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Vibrate className="h-6 w-6 animate-bounce" />
              <span className="text-lg font-bold uppercase tracking-wider">New Job Alert!</span>
            </div>
            
            <h2 className="text-2xl font-bold mt-3">{jobData.title}</h2>
          </div>
        </div>

        {/* Job Details */}
        <div className="p-6 space-y-4">
          {/* Customer */}
          {jobData.customerName && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <User className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Customer</p>
                <p className="font-semibold text-slate-900 dark:text-white">{jobData.customerName}</p>
              </div>
            </div>
          )}

          {/* Location */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-500 dark:text-slate-400">Location</p>
              <p className="font-medium text-slate-900 dark:text-white line-clamp-2">{jobData.location}</p>
              {jobData.distance && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                  📍 {jobData.distance} away
                </p>
              )}
            </div>
          </div>

          {/* Budget */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <IndianRupee className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Estimated Price</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹{jobData.price}</p>
            </div>
          </div>

          {/* Description */}
          {jobData.description && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                {jobData.description}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-0 grid grid-cols-2 gap-4">
          <button
            onClick={handleReject}
            disabled={takenByOther}
            className="flex items-center justify-center gap-2 py-4 px-6 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
            Reject
          </button>
          
          <button
            onClick={handleAccept}
            disabled={takenByOther}
            className="flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-bold text-lg hover:from-emerald-600 hover:to-teal-700 transition-all active:scale-95 shadow-lg shadow-emerald-500/30 disabled:opacity-50"
          >
            <Check className="h-6 w-6" />
            Accept
          </button>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes ping-slower {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-scale-in { animation: scale-in 0.4s ease-out; }
        .animate-ping-slow { animation: ping-slow 2s ease-out infinite; }
        .animate-ping-slower { animation: ping-slower 2.5s ease-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
