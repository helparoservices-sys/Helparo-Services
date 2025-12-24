'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Bell, 
  BellRing, 
  Shield, 
  Battery, 
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  X,
  Zap,
  Volume2,
  Vibrate,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'

// Register the native settings plugin
const SettingsPlugin = registerPlugin<{
  openNotificationSettings: () => Promise<{ success: boolean }>
  openOverlaySettings: () => Promise<{ success: boolean }>
  openBatterySettings: () => Promise<{ success: boolean }>
  openAppSettings: () => Promise<{ success: boolean }>
  canDrawOverlays: () => Promise<{ granted: boolean }>
  isBatteryOptimizationDisabled: () => Promise<{ disabled: boolean }>
}>('SettingsPlugin')

interface PermissionStatus {
  notifications: boolean
  overlay: boolean
  battery: boolean
  checked: boolean
}

/**
 * Job Alert Permission Setup Component
 * 
 * Shows helpers what permissions they need to enable for Rapido-style job alerts.
 * Guides them to Android settings to enable:
 * 1. Notification permissions
 * 2. Display over other apps (for lock screen alerts)
 * 3. Battery optimization exemption (to receive alerts when app is closed)
 */
export function JobAlertPermissionSetup({ 
  onComplete,
  showAsModal = false,
  mandatory = false  // If true, can't be dismissed
}: { 
  onComplete?: () => void
  showAsModal?: boolean
  mandatory?: boolean
}) {
  const [currentStep, setCurrentStep] = useState(0)
  const [permissions, setPermissions] = useState<PermissionStatus>({
    notifications: false,
    overlay: false,
    battery: false,
    checked: false
  })
  const [isNative, setIsNative] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [checking, setChecking] = useState(false)

  // Auto-check all permissions
  const checkAllPermissions = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return
    
    setChecking(true)
    try {
      // Check notification permission
      const notifStatus = await PushNotifications.checkPermissions()
      const hasNotifications = notifStatus.receive === 'granted'
      
      // Check overlay permission
      let hasOverlay = false
      try {
        const overlayResult = await SettingsPlugin.canDrawOverlays()
        hasOverlay = overlayResult.granted
      } catch (e) {
        console.log('Overlay check not available:', e)
        hasOverlay = true // Assume granted if can't check (older Android)
      }
      
      // Battery optimization - we'll assume it needs setup (can't easily check)
      // User marks this manually
      const batterySetup = localStorage.getItem('battery_optimization_disabled') === 'true'
      
      setPermissions({
        notifications: hasNotifications,
        overlay: hasOverlay,
        battery: batterySetup,
        checked: true
      })
      
      // Auto-advance to first incomplete step
      if (!hasNotifications) {
        setCurrentStep(0)
      } else if (!hasOverlay) {
        setCurrentStep(1)
      } else if (!batterySetup) {
        setCurrentStep(2)
      }
      
      console.log('📋 Permission check:', { hasNotifications, hasOverlay, batterySetup })
      
    } catch (error) {
      console.error('Error checking permissions:', error)
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    const isNativePlatform = Capacitor.isNativePlatform()
    setIsNative(isNativePlatform)
    
    if (!isNativePlatform) return
    
    // Check if user already dismissed this (only if not mandatory)
    if (!mandatory) {
      const wasDismissed = localStorage.getItem('job_alert_permissions_dismissed')
      if (wasDismissed === 'true') {
        setDismissed(true)
        return
      }
    }
    
    // Auto-check permissions on mount
    checkAllPermissions()
    
    // Re-check when app comes back to foreground
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 App resumed, re-checking permissions...')
        checkAllPermissions()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [mandatory, checkAllPermissions])

  const steps = [
    {
      id: 'notifications',
      title: 'Enable Notifications',
      description: 'Allow Helparo to send you job alerts',
      icon: Bell,
      color: 'bg-blue-500',
      instructions: [
        'Tap "Open Settings" below',
        'Find "Notifications" or "App notifications"',
        'Turn ON notifications for Helparo',
        'Make sure "Job Alerts" channel is enabled with sound & vibration'
      ],
      androidIntent: 'android.settings.APP_NOTIFICATION_SETTINGS'
    },
    {
      id: 'overlay',
      title: 'Display Over Other Apps',
      description: 'Show job alerts on lock screen & over other apps',
      icon: Smartphone,
      color: 'bg-purple-500',
      instructions: [
        'Tap "Open Settings" below',
        'Find "Display over other apps" or "Appear on top"',
        'Turn it ON for Helparo',
        'This allows alerts to show even when phone is locked'
      ],
      androidIntent: 'android.settings.action.MANAGE_OVERLAY_PERMISSION'
    },
    {
      id: 'battery',
      title: 'Disable Battery Optimization',
      description: 'Receive alerts even when app is closed',
      icon: Battery,
      color: 'bg-green-500',
      instructions: [
        'Tap "Open Settings" below',
        'Find Helparo in the list',
        'Select "Don\'t optimize" or "Unrestricted"',
        'This ensures you get alerts even if app is in background'
      ],
      androidIntent: 'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS'
    }
  ]

  const openAndroidSettings = async (stepId: string) => {
    if (!isNative) {
      alert('This feature only works in the mobile app')
      return
    }

    try {
      // Open the appropriate settings screen
      if (stepId === 'notifications') {
        await SettingsPlugin.openNotificationSettings()
        console.log('✅ Opened notification settings')
      } else if (stepId === 'overlay') {
        await SettingsPlugin.openOverlaySettings()
        console.log('✅ Opened overlay settings')
      } else if (stepId === 'battery') {
        await SettingsPlugin.openBatterySettings()
        console.log('✅ Opened battery settings')
      }
      
    } catch (error) {
      console.error('Error opening settings via native plugin:', error)
      // Fallback to showing manual instructions
      showManualInstructions(stepId)
    }
  }

  const showManualInstructions = (stepId: string) => {
    let message = ''
    if (stepId === 'notifications') {
      message = '📱 Go to: Settings → Apps → Helparo → Notifications → Enable All'
    } else if (stepId === 'overlay') {
      message = '📱 Go to: Settings → Apps → Helparo → Display over other apps → Allow'
    } else if (stepId === 'battery') {
      message = '📱 Go to: Settings → Apps → Helparo → Battery → Unrestricted'
    }
    
    // Use toast if available, otherwise alert
    if (typeof window !== 'undefined') {
      import('sonner').then(({ toast }) => {
        toast.info(message, { duration: 8000 })
      }).catch(() => {
        alert(message)
      })
    }
  }

  const markStepComplete = (stepId: string) => {
    // For battery, save to localStorage since we can't easily check it
    if (stepId === 'battery') {
      localStorage.setItem('battery_optimization_disabled', 'true')
    }
    
    setPermissions(prev => ({
      ...prev,
      [stepId]: true
    }))
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem('job_alert_permissions_setup', 'true')
    onComplete?.()
  }

  const handleDismiss = () => {
    if (mandatory) {
      // Can't dismiss if mandatory - just re-check permissions
      checkAllPermissions()
      return
    }
    localStorage.setItem('job_alert_permissions_dismissed', 'true')
    setDismissed(true)
    onComplete?.()
  }

  const allDone = permissions.notifications && permissions.overlay && permissions.battery

  // Auto-complete when all permissions are granted
  useEffect(() => {
    if (allDone && permissions.checked) {
      handleComplete()
    }
  }, [allDone, permissions.checked])

  if (dismissed || !isNative) {
    return null
  }

  // If all permissions granted, don't show anything
  if (allDone && !showAsModal) {
    return null
  }

  const content = (
    <div className={`bg-white dark:bg-slate-800 ${showAsModal ? 'rounded-2xl shadow-2xl max-w-sm w-full mx-3 max-h-[90vh] overflow-y-auto' : ''}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-white rounded-t-2xl">
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <BellRing className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            {/* Refresh button to re-check permissions */}
            <button 
              onClick={checkAllPermissions} 
              disabled={checking}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              title="Re-check permissions"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            </button>
            {showAsModal && !mandatory && (
              <button onClick={handleDismiss} className="p-1.5 hover:bg-white/20 rounded-full">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <h2 className="text-lg font-bold mb-0.5">
          {mandatory ? '⚠️ Setup Required' : 'Setup Job Alerts'}
        </h2>
        <p className="text-white/90 text-xs">
          {mandatory 
            ? 'Enable these to receive job alerts on lock screen!'
            : 'Get alerts even when phone is locked!'
          }
        </p>
      </div>

      {/* Benefits */}
      <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100">
        <p className="text-xs font-medium text-amber-800 mb-1.5">✨ After setup:</p>
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] bg-white px-1.5 py-0.5 rounded-full text-amber-700 border border-amber-200">
            <Volume2 className="w-2.5 h-2.5" /> Sound
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] bg-white px-1.5 py-0.5 rounded-full text-amber-700 border border-amber-200">
            <Vibrate className="w-2.5 h-2.5" /> Vibration
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] bg-white px-1.5 py-0.5 rounded-full text-amber-700 border border-amber-200">
            <Smartphone className="w-2.5 h-2.5" /> Lock Screen
          </span>
        </div>
      </div>

      {/* Steps */}
      <div className="p-4 space-y-3">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = index === currentStep
          const isCompleted = permissions[step.id as keyof PermissionStatus]
          
          return (
            <div 
              key={step.id}
              className={`rounded-lg border-2 transition-all ${
                isCompleted 
                  ? 'border-green-200 bg-green-50' 
                  : isActive 
                    ? 'border-orange-300 bg-orange-50' 
                    : 'border-gray-100 bg-gray-50 opacity-60'
              }`}
            >
              {/* Step Header */}
              <div 
                className="p-3 flex items-center gap-2.5 cursor-pointer"
                onClick={() => !isCompleted && setCurrentStep(index)}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isCompleted ? 'bg-green-500' : step.color
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    <Icon className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-sm leading-tight">{step.title}</h3>
                  <p className="text-[10px] text-gray-500 truncate">{step.description}</p>
                </div>
                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 flex-shrink-0">
                  {index + 1}
                </div>
              </div>

              {/* Step Details (expanded) */}
              {isActive && !isCompleted && (
                <div className="px-3 pb-3 border-t border-orange-200 pt-2">
                  <div className="bg-white rounded-lg p-2 mb-2">
                    <p className="text-[10px] font-medium text-gray-600 mb-1.5">Follow these steps:</p>
                    <ol className="space-y-1">
                      {step.instructions.map((instruction, i) => (
                        <li key={i} className="text-[11px] text-gray-700 flex items-start gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="leading-tight">{instruction}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => openAndroidSettings(step.id)}
                      size="sm"
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs h-8"
                    >
                      Open Settings
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                    <Button
                      onClick={() => markStepComplete(step.id)}
                      variant="outline"
                      size="sm"
                      className="border-green-300 text-green-600 hover:bg-green-50 text-xs h-8"
                    >
                      Done ✓
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        {allDone ? (
          <Button 
            onClick={handleComplete}
            className="w-full bg-green-500 hover:bg-green-600 text-white h-10 text-sm font-semibold"
          >
            <Zap className="w-4 h-4 mr-1.5" />
            All Set! Start Receiving Jobs
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="flex-1 text-gray-500 text-xs"
            >
              Skip for now
            </Button>
            <Button
              onClick={handleComplete}
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              disabled={!permissions.notifications}
            >
              Continue
            </Button>
          </div>
        )}
        
        <p className="text-xs text-center text-gray-400 mt-3">
          You can change these settings anytime in Android Settings
        </p>
      </div>
    </div>
  )

  if (showAsModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        {content}
      </div>
    )
  }

  return content
}

/**
 * Small banner that shows if permissions aren't set up
 * Now auto-checks permissions and shows if any are missing
 */
export function JobAlertPermissionBanner({ onSetup }: { onSetup: () => void }) {
  const [show, setShow] = useState(false)
  const [isNative, setIsNative] = useState(false)
  const [missingCount, setMissingCount] = useState(0)

  useEffect(() => {
    const isNativePlatform = Capacitor.isNativePlatform()
    setIsNative(isNativePlatform)
    
    if (!isNativePlatform) return
    
    // Auto-check permissions
    const checkPermissions = async () => {
      try {
        let missing = 0
        
        // Check notification permission
        const notifStatus = await PushNotifications.checkPermissions()
        if (notifStatus.receive !== 'granted') missing++
        
        // Check overlay permission
        try {
          const overlayResult = await SettingsPlugin.canDrawOverlays()
          if (!overlayResult.granted) missing++
        } catch (e) {
          // Can't check overlay - don't count as missing
        }
        
        // Check battery (from localStorage)
        const batterySetup = localStorage.getItem('battery_optimization_disabled') === 'true'
        if (!batterySetup) missing++
        
        setMissingCount(missing)
        setShow(missing > 0)
        
      } catch (error) {
        console.error('Error checking permissions:', error)
        // Show banner if we can't check
        const wasSetup = localStorage.getItem('job_alert_permissions_setup')
        setShow(wasSetup !== 'true')
      }
    }
    
    checkPermissions()
    
    // Re-check when app comes back
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkPermissions()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  if (!show || !isNative) return null

  return (
    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-3 rounded-xl mb-4 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">
            {missingCount > 0 ? `${missingCount} Permission${missingCount > 1 ? 's' : ''} Needed` : 'Setup Job Alerts'}
          </p>
          <p className="text-xs text-white/80">Enable to get alerts on lock screen</p>
        </div>
        <Button
          onClick={onSetup}
          size="sm"
          className="bg-white text-orange-600 hover:bg-orange-50 font-semibold"
        >
          Setup
        </Button>
      </div>
    </div>
  )
}
