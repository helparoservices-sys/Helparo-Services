'use client'

import { useState, useEffect } from 'react'
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
  Vibrate
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Capacitor } from '@capacitor/core'

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
  showAsModal = false 
}: { 
  onComplete?: () => void
  showAsModal?: boolean 
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

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform())
    
    // Check if user already dismissed this
    const wasDismissed = localStorage.getItem('job_alert_permissions_dismissed')
    if (wasDismissed === 'true') {
      setDismissed(true)
    }
    
    // Check if permissions were already set up
    const wasSetup = localStorage.getItem('job_alert_permissions_setup')
    if (wasSetup === 'true') {
      setPermissions(prev => ({ ...prev, checked: true }))
    }
  }, [])

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

  const openAndroidSettings = async (intentAction: string) => {
    if (!isNative) {
      alert('This feature only works in the mobile app')
      return
    }

    try {
      // Use Capacitor App plugin to open settings
      const { App } = await import('@capacitor/app')
      
      // For Android, we need to use a custom intent
      // Since Capacitor doesn't have direct intent support, we'll use a URL scheme workaround
      // or show instructions to manually navigate
      
      if (intentAction === 'android.settings.APP_NOTIFICATION_SETTINGS') {
        // Try to open app notification settings
        window.open('intent:#Intent;action=android.settings.APP_NOTIFICATION_SETTINGS;S.android.provider.extra.APP_PACKAGE=in.helparo.app;end', '_system')
      } else if (intentAction === 'android.settings.action.MANAGE_OVERLAY_PERMISSION') {
        window.open('intent:#Intent;action=android.settings.action.MANAGE_OVERLAY_PERMISSION;data=package:in.helparo.app;end', '_system')
      } else if (intentAction === 'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS') {
        window.open('intent:#Intent;action=android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS;end', '_system')
      }
    } catch (error) {
      console.error('Error opening settings:', error)
      // Fallback: Show manual instructions
      alert('Please go to Settings > Apps > Helparo to configure this permission')
    }
  }

  const markStepComplete = (stepId: string) => {
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
    localStorage.setItem('job_alert_permissions_dismissed', 'true')
    setDismissed(true)
    onComplete?.()
  }

  const allDone = permissions.notifications && permissions.overlay && permissions.battery

  if (dismissed || !isNative) {
    return null
  }

  const content = (
    <div className={`bg-white ${showAsModal ? 'rounded-2xl shadow-2xl max-w-md w-full mx-4' : ''}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white rounded-t-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <BellRing className="w-8 h-8" />
          </div>
          {showAsModal && (
            <button onClick={handleDismiss} className="p-2 hover:bg-white/20 rounded-full">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <h2 className="text-2xl font-bold mb-1">Setup Job Alerts</h2>
        <p className="text-white/90 text-sm">
          Get Rapido-style alerts even when your phone is locked!
        </p>
      </div>

      {/* Benefits */}
      <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
        <p className="text-sm font-medium text-amber-800 mb-2">✨ After setup, you'll get:</p>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 text-xs bg-white px-2 py-1 rounded-full text-amber-700 border border-amber-200">
            <Volume2 className="w-3 h-3" /> Loud Alert Sound
          </span>
          <span className="inline-flex items-center gap-1 text-xs bg-white px-2 py-1 rounded-full text-amber-700 border border-amber-200">
            <Vibrate className="w-3 h-3" /> Vibration
          </span>
          <span className="inline-flex items-center gap-1 text-xs bg-white px-2 py-1 rounded-full text-amber-700 border border-amber-200">
            <Smartphone className="w-3 h-3" /> Lock Screen Popup
          </span>
        </div>
      </div>

      {/* Steps */}
      <div className="p-6 space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = index === currentStep
          const isCompleted = permissions[step.id as keyof PermissionStatus]
          
          return (
            <div 
              key={step.id}
              className={`rounded-xl border-2 transition-all ${
                isCompleted 
                  ? 'border-green-200 bg-green-50' 
                  : isActive 
                    ? 'border-orange-300 bg-orange-50' 
                    : 'border-gray-100 bg-gray-50 opacity-60'
              }`}
            >
              {/* Step Header */}
              <div 
                className="p-4 flex items-center gap-3 cursor-pointer"
                onClick={() => !isCompleted && setCurrentStep(index)}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isCompleted ? 'bg-green-500' : step.color
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  ) : (
                    <Icon className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{step.title}</h3>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                  {index + 1}
                </div>
              </div>

              {/* Step Details (expanded) */}
              {isActive && !isCompleted && (
                <div className="px-4 pb-4 border-t border-orange-200 pt-3">
                  <div className="bg-white rounded-lg p-3 mb-3">
                    <p className="text-xs font-medium text-gray-600 mb-2">Follow these steps:</p>
                    <ol className="space-y-1.5">
                      {step.instructions.map((instruction, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {instruction}
                        </li>
                      ))}
                    </ol>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => openAndroidSettings(step.androidIntent)}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      Open Settings
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                    <Button
                      onClick={() => markStepComplete(step.id)}
                      variant="outline"
                      className="border-green-300 text-green-600 hover:bg-green-50"
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
      <div className="px-6 pb-6">
        {allDone ? (
          <Button 
            onClick={handleComplete}
            className="w-full bg-green-500 hover:bg-green-600 text-white h-12 text-lg font-semibold"
          >
            <Zap className="w-5 h-5 mr-2" />
            All Set! Start Receiving Jobs
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={handleDismiss}
              variant="ghost"
              className="flex-1 text-gray-500"
            >
              Skip for now
            </Button>
            <Button
              onClick={handleComplete}
              variant="outline"
              className="flex-1"
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
 */
export function JobAlertPermissionBanner({ onSetup }: { onSetup: () => void }) {
  const [show, setShow] = useState(false)
  const [isNative, setIsNative] = useState(false)

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform())
    
    const wasSetup = localStorage.getItem('job_alert_permissions_setup')
    const wasDismissed = localStorage.getItem('job_alert_permissions_dismissed')
    
    // Show banner if not setup and not dismissed
    if (wasSetup !== 'true' && wasDismissed !== 'true') {
      setShow(true)
    }
  }, [])

  if (!show || !isNative) return null

  return (
    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-3 rounded-xl mb-4 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Setup Job Alerts</p>
          <p className="text-xs text-white/80">Enable permissions to get alerts on lock screen</p>
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
