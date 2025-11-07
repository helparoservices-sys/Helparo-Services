'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading'
import { getActiveCampaigns, createSeasonalCampaign, toggleCampaignStatus } from '@/app/actions/bundles'

interface Campaign {
  id: string
  name: string
  description: string
  campaign_type: string
  discount_type: string
  discount_value: number
  start_date: string
  end_date: string
  is_active: boolean
  usage_limit: number | null
  times_used: number
  created_at: string
}

export default function AdminCampaignsPage() {
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [campaignType, setCampaignType] = useState('seasonal')
  const [discountType, setDiscountType] = useState('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [usageLimit, setUsageLimit] = useState('')

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    setLoading(true)
    setError('')

    const result = await getActiveCampaigns()

    if (result.error) {
      setError(result.error)
    } else {
      setCampaigns(result.campaigns || [])
    }

    setLoading(false)
  }

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setName(campaign.name)
    setDescription(campaign.description)
    setCampaignType(campaign.campaign_type)
    setDiscountType(campaign.discount_type)
    setDiscountValue(campaign.discount_value.toString())
    setStartDate(campaign.start_date.split('T')[0])
    setEndDate(campaign.end_date.split('T')[0])
    setUsageLimit(campaign.usage_limit?.toString() || '')
    setShowForm(true)
  }

  const handleCancelEdit = () => {
    setEditingCampaign(null)
    setName('')
    setDescription('')
    setCampaignType('seasonal')
    setDiscountType('percentage')
    setDiscountValue('')
    setStartDate('')
    setEndDate('')
    setUsageLimit('')
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingCampaign) {
      setError('Edit functionality not yet implemented - please create a new campaign')
      return
    }
    
    setSaving(true)
    setError('')

    const formData = new FormData()
    formData.append('name', name)
    formData.append('description', description)
    formData.append('campaign_type', campaignType)
    formData.append('discount_type', discountType)
    formData.append('discount_value', discountValue)
    formData.append('start_date', startDate)
    formData.append('end_date', endDate)
    if (usageLimit) formData.append('max_redemptions', usageLimit)

    const result = await createSeasonalCampaign(formData)

    if (result.error) {
      setError(result.error)
    } else {
      handleCancelEdit()
      await loadCampaigns()
    }

    setSaving(false)
  }

  const handleToggleActive = async (campaignId: string, currentStatus: boolean) => {
    const result = await toggleCampaignStatus(campaignId, !currentStatus)

    if (result.error) {
      setError(result.error)
    } else {
      await loadCampaigns()
    }
  }

  const handleDelete = async (campaignId: string) => {
    setError('Delete functionality not yet implemented')
  }

  const getCampaignIcon = (type: string) => {
    const icons: Record<string, string> = {
      seasonal: '🎉',
      promotional: '🎯',
      flash_sale: '⚡',
      referral: '🎁',
      loyalty: '💎',
      special: '⭐'
    }
    return icons[type.toLowerCase()] || '🎪'
  }

  const getDaysRemaining = (endDate: string) => {
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
  }

  const formatDiscount = (type: string, value: number) => {
    return type === 'percentage' ? `${value}% off` : `₹${value} off`
  }

  const isEndingSoon = (endDate: string) => {
    const days = getDaysRemaining(endDate)
    return days > 0 && days <= 7
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Campaign Management</h1>
            <p className="text-muted-foreground">Create and manage seasonal campaigns and promotions</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Create Campaign'}
          </Button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-primary">{campaigns.length}</div>
              <p className="text-sm text-muted-foreground mt-1">Total Campaigns</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-green-600">{campaigns.filter(c => c.is_active).length}</div>
              <p className="text-sm text-muted-foreground mt-1">Active Now</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {campaigns.filter(c => isEndingSoon(c.end_date) && c.is_active).length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Ending Soon</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {campaigns.reduce((sum, c) => sum + c.times_used, 0).toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Total Uses</p>
            </CardContent>
          </Card>
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Campaign Name</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Diwali Special"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Campaign Type</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={campaignType}
                      onChange={(e) => setCampaignType(e.target.value)}
                      required
                    >
                      <option value="seasonal">Seasonal</option>
                      <option value="promotional">Promotional</option>
                      <option value="flash_sale">Flash Sale</option>
                      <option value="referral">Referral</option>
                      <option value="loyalty">Loyalty</option>
                      <option value="special">Special</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Campaign details..."
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Discount Type</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      required
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Discount Value {discountType === 'percentage' ? '(%)' : '(₹)'}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step={discountType === 'percentage' ? '1' : '0.01'}
                      max={discountType === 'percentage' ? '100' : undefined}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === 'percentage' ? '20' : '500'}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Usage Limit (optional)</label>
                    <Input
                      type="number"
                      min="1"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(e.target.value)}
                      placeholder="Unlimited"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      editingCampaign ? 'Update Campaign' : 'Create Campaign'
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Campaigns List */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : campaigns.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">No campaigns created yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {campaigns.map(campaign => {
              const daysLeft = getDaysRemaining(campaign.end_date)
              const isExpired = daysLeft < 0
              const isActive = campaign.is_active && !isExpired

              return (
                <Card key={campaign.id} className={!isActive ? 'opacity-50' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-3xl">{getCampaignIcon(campaign.campaign_type)}</div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{campaign.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{campaign.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${isActive ? 'bg-green-100 text-green-700' : isExpired ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                          {isExpired ? 'Expired' : isActive ? 'Active' : 'Inactive'}
                        </span>
                        {isEndingSoon(campaign.end_date) && isActive && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700 whitespace-nowrap">
                            {daysLeft}d left
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Type</span>
                        <span className="font-medium capitalize">{campaign.campaign_type.replace('_', ' ')}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="font-medium text-green-600">{formatDiscount(campaign.discount_type, campaign.discount_value)}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Period</span>
                        <span className="font-medium text-xs">
                          {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Usage</span>
                        <span className="font-medium">
                          {campaign.times_used.toLocaleString()}
                          {campaign.usage_limit && ` / ${campaign.usage_limit.toLocaleString()}`}
                        </span>
                      </div>

                      {campaign.usage_limit && (
                        <div className="pt-2">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-primary/70"
                              style={{ width: `${Math.min((campaign.times_used / campaign.usage_limit) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(campaign)} className="flex-1">
                        Edit
                      </Button>
                      {!isExpired && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleToggleActive(campaign.id, campaign.is_active)}
                          className="flex-1"
                        >
                          {campaign.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleDelete(campaign.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
