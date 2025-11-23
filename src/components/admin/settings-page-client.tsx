'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { DollarSign, MapPin, CreditCard, Star, Trophy, Save, X } from 'lucide-react'
import { updateCommissionSettings } from '@/app/actions/admin'
import { useToast } from '@/components/ui/toast-notification'

interface SettingsData {
  commission: {
    current: number
    lastUpdated: string
  }
  subscriptions: {
    helperPro: number
    customerPremium: number
  }
  platform: {
    totalHelpers: number
    totalCustomers: number
  }
  allSettings: {
    commission: number
    surgeMultiplier: number
    serviceRadius: number
    emergencyRadius: number
    minWithdrawal: number
    autoPayoutThreshold: number
    gamification: {
      enableBadges: boolean
      enableLoyaltyPoints: boolean
      showLeaderboard: boolean
    }
  }
}

interface SettingsPageClientProps {
  settings: SettingsData
}

export function SettingsPageClient({ settings }: SettingsPageClientProps) {
  const router = useRouter()
  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [commission, setCommission] = useState(settings.allSettings.commission)
  const [surgeMultiplier, setSurgeMultiplier] = useState(settings.allSettings.surgeMultiplier)
  const [serviceRadius, setServiceRadius] = useState(settings.allSettings.serviceRadius)
  const [emergencyRadius, setEmergencyRadius] = useState(settings.allSettings.emergencyRadius)
  const [minWithdrawal, setMinWithdrawal] = useState(settings.allSettings.minWithdrawal)
  const [autoPayoutThreshold, setAutoPayoutThreshold] = useState(settings.allSettings.autoPayoutThreshold)
  const [gamificationSettings, setGamificationSettings] = useState(settings.allSettings.gamification)

  const handleRefresh = useCallback(() => {
    router.refresh()
  }, [router])

  const handleSave = async () => {
    setLoading(true)
    try {
      const result = await updateCommissionSettings({
        commission,
        surgeMultiplier,
        serviceRadius,
        emergencyRadius,
        minWithdrawal,
        autoPayoutThreshold,
        enableBadges: gamificationSettings.enableBadges,
        enableLoyaltyPoints: gamificationSettings.enableLoyaltyPoints,
        showLeaderboard: gamificationSettings.showLeaderboard
      })
      
      if ('success' in result && result.success) {
        router.refresh()
        showSuccess('Settings Saved! ⚙️', 'Platform settings have been updated successfully')
      } else {
        const message = 'message' in result ? result.message : 'Failed to update settings'
        showError('Save Failed', message)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      showError('Save Failed', 'An unexpected error occurred while saving settings')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset all fields to original database values
    setCommission(settings.allSettings.commission)
    setSurgeMultiplier(settings.allSettings.surgeMultiplier)
    setServiceRadius(settings.allSettings.serviceRadius)
    setEmergencyRadius(settings.allSettings.emergencyRadius)
    setMinWithdrawal(settings.allSettings.minWithdrawal)
    setAutoPayoutThreshold(settings.allSettings.autoPayoutThreshold)
    setGamificationSettings(settings.allSettings.gamification)
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Platform Settings</h1>
            <p className="text-muted-foreground">Configure platform behavior & policies</p>
          </div>
          <Button onClick={handleRefresh} variant="outline">
            Refresh Data
          </Button>
        </div>

        {/* Platform Overview */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-blue-600">{settings.platform.totalHelpers}</div>
              <p className="text-sm text-muted-foreground mt-1">Total Helpers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-green-600">{settings.platform.totalCustomers}</div>
              <p className="text-sm text-muted-foreground mt-1">Total Customers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-purple-600">{settings.subscriptions.helperPro}</div>
              <p className="text-sm text-muted-foreground mt-1">Active Helper Plans</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-gray-400">-</div>
              <p className="text-sm text-muted-foreground mt-1">Customer Plans (Coming Soon)</p>
            </CardContent>
          </Card>
        </div>

        {/* Commission Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              Commission & Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Platform Commission (%)
                </label>
                <Input
                  type="number"
                  value={commission}
                  onChange={(e) => setCommission(Number(e.target.value))}
                  step="0.1"
                  min="0"
                  max="100"
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Commission charged on each completed job
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Surge Pricing Multiplier
                </label>
                <Input
                  type="number"
                  value={surgeMultiplier}
                  onChange={(e) => setSurgeMultiplier(Number(e.target.value))}
                  step="0.1"
                  min="1"
                  max="5"
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Price multiplier during peak hours/emergency
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">Current: {settings.commission.current}%</Badge>
              <span>Last updated: {new Date(settings.commission.lastUpdated).toLocaleDateString('en-IN', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                timeZone: 'Asia/Kolkata'
              })}</span>
            </div>
          </CardContent>
        </Card>

        {/* Service Area Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              Service Area Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Default Service Radius (km)
                </label>
                <Input
                  type="number"
                  value={serviceRadius}
                  onChange={(e) => setServiceRadius(Number(e.target.value))}
                  min="1"
                  max="100"
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum distance for helper matching
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Emergency Service Radius (km)
                </label>
                <Input
                  type="number"
                  value={emergencyRadius}
                  onChange={(e) => setEmergencyRadius(Number(e.target.value))}
                  min="1"
                  max="100"
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Extended radius for SOS/emergency services
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
              Payment Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Minimum Withdrawal Amount (₹)
                </label>
                <Input
                  type="number"
                  value={minWithdrawal}
                  onChange={(e) => setMinWithdrawal(Number(e.target.value))}
                  min="1"
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum amount helpers can withdraw
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Auto-payout Threshold (₹)
                </label>
                <Input
                  type="number"
                  value={autoPayoutThreshold}
                  onChange={(e) => setAutoPayoutThreshold(Number(e.target.value))}
                  min="100"
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Automatic payout when balance reaches this amount
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Plans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              Subscription Tiers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div>
                <div className="font-medium">Helper Pro</div>
                <div className="text-xs text-muted-foreground">
                  Reduced commission: 7% instead of {commission}%
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">₹299/month</div>
                <Badge variant="secondary">{settings.subscriptions.helperPro} active</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 opacity-60">
              <div>
                <div className="font-medium text-gray-500">Customer Premium</div>
                <div className="text-xs text-gray-400">
                  Coming Soon - Priority booking features
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-400">₹199/month</div>
                <Badge variant="outline" className="text-gray-400 border-gray-300">Coming Soon</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gamification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-orange-600" />
              </div>
              Gamification Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={gamificationSettings.enableBadges}
                onChange={(e) => setGamificationSettings(prev => ({ ...prev, enableBadges: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm group-hover:text-foreground transition-colors">
                Enable helper badges & achievements
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={gamificationSettings.enableLoyaltyPoints}
                onChange={(e) => setGamificationSettings(prev => ({ ...prev, enableLoyaltyPoints: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm group-hover:text-foreground transition-colors">
                Enable customer loyalty points
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={gamificationSettings.showLeaderboard}
                onChange={(e) => setGamificationSettings(prev => ({ ...prev, showLeaderboard: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm group-hover:text-foreground transition-colors">
                Show helper leaderboard
              </span>
            </label>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}