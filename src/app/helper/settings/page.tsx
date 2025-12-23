'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { User, Bell, Lock, CreditCard, Shield, Save, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react'

export default function HelperSettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [activeTab, setActiveTab] = useState('profile')

  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    bio: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  })

  const [notifications, setNotifications] = useState({
    email_notifications: true,
    sms_notifications: true,
    push_notifications: true,
    booking_updates: true,
    payment_alerts: true,
    promotional_emails: false,
  })

  const [privacy, setPrivacy] = useState({
    profile_visibility: 'public',
    show_phone: true,
    show_address: false,
    allow_reviews: true,
  })

  const loadSettings = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, email, phone, bio, address, city, state, pincode, email_notifications, sms_notifications, push_notifications, booking_updates, payment_alerts, promotional_emails, profile_visibility, show_phone, show_address, allow_reviews')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setProfile({
        full_name: profileData.full_name || '',
        email: profileData.email || user.email || '',
        phone: profileData.phone || '',
        bio: profileData.bio || '',
        address: profileData.address || '',
        city: profileData.city || '',
        state: profileData.state || '',
        pincode: profileData.pincode || '',
      })

      setNotifications({
        email_notifications: profileData.email_notifications ?? true,
        sms_notifications: profileData.sms_notifications ?? true,
        push_notifications: profileData.push_notifications ?? true,
        booking_updates: profileData.booking_updates ?? true,
        payment_alerts: profileData.payment_alerts ?? true,
        promotional_emails: profileData.promotional_emails ?? false,
      })

      setPrivacy({
        profile_visibility: profileData.profile_visibility || 'public',
        show_phone: profileData.show_phone ?? true,
        show_address: profileData.show_address ?? false,
        allow_reviews: profileData.allow_reviews ?? true,
      })
    }

    setLoading(false)
  }

  useEffect(() => {
    loadSettings()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const saveProfile = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          bio: profile.bio,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          pincode: profile.pincode,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'An error occurred' })
    } finally {
      setSaving(false)
    }
  }

  const saveNotifications = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update(notifications)
        .eq('id', user.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Notification preferences saved!' })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'An error occurred' })
    } finally {
      setSaving(false)
    }
  }

  const savePrivacy = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update(privacy)
        .eq('id', user.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Privacy settings saved!' })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'An error occurred' })
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your account preferences</p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {tabs.map(tab => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        value={profile.full_name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        placeholder="Your full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        disabled
                        className="bg-slate-100 dark:bg-slate-800"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="+91 9154781126"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={profile.city}
                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                        placeholder="Your city"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={profile.state}
                        onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                        placeholder="Your state"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pincode">Pincode</Label>
                      <Input
                        id="pincode"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        value={profile.pincode}
                        onChange={(e) => {
                          // Only allow numeric input, max 6 digits
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                          setProfile({ ...profile, pincode: value })
                        }}
                        maxLength={6}
                        placeholder="400001"
                      />
                      <p className="text-xs text-muted-foreground">6-digit pincode (numbers only)</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      placeholder="Your address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <textarea
                      id="bio"
                      className="w-full min-h-[100px] px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Tell customers about yourself..."
                    />
                  </div>

                  <Button onClick={saveProfile} disabled={saving} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Profile'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose how you want to receive updates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries({
                    email_notifications: 'Email Notifications',
                    sms_notifications: 'SMS Notifications',
                    push_notifications: 'Push Notifications',
                    booking_updates: 'Booking Updates',
                    payment_alerts: 'Payment Alerts',
                    promotional_emails: 'Promotional Emails',
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                      <span className="font-medium text-slate-900 dark:text-white">{label}</span>
                      <input
                        type="checkbox"
                        checked={notifications[key as keyof typeof notifications]}
                        onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                        className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                  ))}

                  <Button onClick={saveNotifications} disabled={saving} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeTab === 'privacy' && (
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>Control your profile visibility</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Profile Visibility</Label>
                    <select
                      value={privacy.profile_visibility}
                      onChange={(e) => setPrivacy({ ...privacy, profile_visibility: e.target.value })}
                      className="w-full h-11 px-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="public">Public</option>
                      <option value="customers_only">Customers Only</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  {Object.entries({
                    show_phone: 'Show Phone Number',
                    show_address: 'Show Address',
                    allow_reviews: 'Allow Reviews',
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                      <span className="font-medium text-slate-900 dark:text-white">{label}</span>
                      <input
                        type="checkbox"
                        checked={privacy[key as keyof typeof privacy] as boolean}
                        onChange={(e) => setPrivacy({ ...privacy, [key]: e.target.checked })}
                        className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                  ))}

                  <Button onClick={savePrivacy} disabled={saving} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Privacy Settings'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    OTP-Only Login
                  </CardTitle>
                  <CardDescription>
                    Password changes are disabled because this account uses one-time passcodes for authentication.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    You will continue signing in with OTPs sent to your registered phone. If you suspect account issues, log out of other devices or contact support.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/helper/notifications')}
                  >
                    Manage Login Alerts
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeTab === 'payments' && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Settings</CardTitle>
                  <CardDescription>Manage your payment methods and withdrawal preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <CreditCard className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Payment settings will be managed through the wallet page.</p>
                    <Button
                      onClick={() => router.push('/helper/wallet')}
                      variant="outline"
                      className="mt-4"
                    >
                      Go to Wallet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
