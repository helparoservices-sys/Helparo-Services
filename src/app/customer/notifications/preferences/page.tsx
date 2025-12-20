'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Mail, Smartphone, MessageSquare, Clock, Save, Check } from 'lucide-react'

interface NotificationPrefs {
  push_enabled: boolean
  in_app_enabled: boolean
  email_enabled: boolean
  sms_enabled: boolean
  quiet_hours: {
    start: string
    end: string
    timezone: string
  } | null
}

export default function NotificationPreferencesPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    push_enabled: true,
    in_app_enabled: true,
    email_enabled: false,
    sms_enabled: false,
    quiet_hours: null
  })

  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false)
  const [quietStart, setQuietStart] = useState('22:00')
  const [quietEnd, setQuietEnd] = useState('07:00')

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('user_notification_prefs')
      .select('user_id, email_notifications, sms_notifications, push_notifications, marketing_emails, job_updates, payment_notifications, quiet_hours, timezone') // 🟢 SAFE: All preference form fields
      .eq('user_id', user.id)
      .single()

    if (data) {
      setPrefs(data)
      if (data.quiet_hours) {
        setQuietHoursEnabled(true)
        setQuietStart(data.quiet_hours.start)
        setQuietEnd(data.quiet_hours.end)
      }
    }

    setLoading(false)
  }

  const savePreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setSaving(true)

    const updatedPrefs = {
      ...prefs,
      quiet_hours: quietHoursEnabled
        ? {
            start: quietStart,
            end: quietEnd,
            timezone: 'Asia/Kolkata'
          }
        : null
    }

    const { error } = await supabase
      .from('user_notification_prefs')
      .upsert({
        user_id: user.id,
        ...updatedPrefs
      })

    if (!error) {
      setPrefs(updatedPrefs)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading preferences...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Notification Preferences</h1>
        <p className="text-slate-600 dark:text-slate-400">Manage how you receive notifications</p>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
          <Check className="h-5 w-5 text-green-600" />
          <p className="text-green-700 dark:text-green-400 font-medium">Preferences saved successfully!</p>
        </div>
      )}

      {/* Notification Channels */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Notification Channels</h2>

        <div className="space-y-6">
          {/* Push Notifications */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Push Notifications</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Get instant alerts on your device for important updates
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.push_enabled}
                onChange={(e) => setPrefs({ ...prefs, push_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* In-App Notifications */}
          <div className="flex items-start justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Smartphone className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">In-App Notifications</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  See notifications in the notification center when using the app
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.in_app_enabled}
                onChange={(e) => setPrefs({ ...prefs, in_app_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Email Notifications */}
          <div className="flex items-start justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Mail className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Email Notifications</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Receive email updates for bookings, payments, and important announcements
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.email_enabled}
                onChange={(e) => setPrefs({ ...prefs, email_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* SMS Notifications */}
          <div className="flex items-start justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <MessageSquare className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">SMS Notifications</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Get text messages for critical alerts and booking confirmations
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.sms_enabled}
                onChange={(e) => setPrefs({ ...prefs, sms_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Clock className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quiet Hours</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Mute non-urgent notifications during specific hours
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={quietHoursEnabled}
              onChange={(e) => setQuietHoursEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {quietHoursEnabled && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={quietStart}
                onChange={(e) => setQuietStart(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={quietEnd}
                onChange={(e) => setQuietEnd(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  )
}
