'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading'

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  badge_type: string
  points_reward: number
  is_active: boolean
  created_at: string
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  achievement_type: string
  target_value: number
  points_reward: number
  is_active: boolean
  created_at: string
}

export default function AdminGamificationPage() {
  const [loading, setLoading] = useState(true)
  const [badges, setBadges] = useState<Badge[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'badges' | 'achievements'>('badges')
  const [showForm, setShowForm] = useState(false)

  // Form state for Badge
  const [badgeName, setBadgeName] = useState('')
  const [badgeDescription, setBadgeDescription] = useState('')
  const [badgeIcon, setBadgeIcon] = useState('')
  const [badgeType, setBadgeType] = useState('newcomer')
  const [badgePoints, setBadgePoints] = useState('0')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError('')

    // For now, showing mock data since these APIs would need to be created
    // In production, you would call server actions like:
    // const badgesRes = await getAllBadges()
    // const achievementsRes = await getAllAchievements()

    setBadges([])
    setAchievements([])
    setLoading(false)
  }

  const getBadgeTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      newcomer: 'bg-blue-100 text-blue-700',
      service: 'bg-green-100 text-green-700',
      loyalty: 'bg-purple-100 text-purple-700',
      referral: 'bg-pink-100 text-pink-700',
      special: 'bg-yellow-100 text-yellow-700',
      milestone: 'bg-red-100 text-red-700',
      expert: 'bg-indigo-100 text-indigo-700'
    }
    return colors[type.toLowerCase()] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gamification Management</h1>
            <p className="text-muted-foreground">Configure badges, achievements, and rewards</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : `+ Create ${activeTab === 'badges' ? 'Badge' : 'Achievement'}`}
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
              <div className="text-2xl font-bold text-primary">{badges.length}</div>
              <p className="text-sm text-muted-foreground mt-1">Total Badges</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-green-600">{badges.filter(b => b.is_active).length}</div>
              <p className="text-sm text-muted-foreground mt-1">Active Badges</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-blue-600">{achievements.length}</div>
              <p className="text-sm text-muted-foreground mt-1">Total Achievements</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-purple-600">{achievements.filter(a => a.is_active).length}</div>
              <p className="text-sm text-muted-foreground mt-1">Active Achievements</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'badges'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Badges ({badges.length})
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'achievements'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Achievements ({achievements.length})
          </button>
        </div>

        {/* Create Badge Form */}
        {showForm && activeTab === 'badges' && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Badge</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setError('Badge creation not yet implemented') }}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Badge Name</label>
                    <Input
                      value={badgeName}
                      onChange={(e) => setBadgeName(e.target.value)}
                      placeholder="First Booking"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Badge Type</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={badgeType}
                      onChange={(e) => setBadgeType(e.target.value)}
                    >
                      <option value="newcomer">Newcomer</option>
                      <option value="service">Service</option>
                      <option value="loyalty">Loyalty</option>
                      <option value="referral">Referral</option>
                      <option value="special">Special</option>
                      <option value="milestone">Milestone</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={badgeDescription}
                    onChange={(e) => setBadgeDescription(e.target.value)}
                    placeholder="Complete your first booking"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Icon (Emoji)</label>
                    <Input
                      value={badgeIcon}
                      onChange={(e) => setBadgeIcon(e.target.value)}
                      placeholder="🎖️"
                      maxLength={2}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Points Reward</label>
                    <Input
                      type="number"
                      min="0"
                      value={badgePoints}
                      onChange={(e) => setBadgePoints(e.target.value)}
                      placeholder="100"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button type="submit">
                    Create Badge
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : activeTab === 'badges' ? (
          badges.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🏆</div>
                  <p className="text-sm text-muted-foreground mb-4">No badges created yet</p>
                  <Button onClick={() => setShowForm(true)}>Create First Badge</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {badges.map(badge => (
                <Card key={badge.id}>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-3">
                      <div className="text-5xl">{badge.icon}</div>
                      <div>
                        <h3 className="font-semibold">{badge.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{badge.description}</p>
                      </div>
                      <div className="flex justify-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getBadgeTypeColor(badge.badge_type)}`}>
                          {badge.badge_type}
                        </span>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                          +{badge.points_reward} pts
                        </span>
                      </div>
                      <div className="flex gap-2 pt-3 border-t">
                        <Button size="sm" variant="outline" className="flex-1">
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          {badge.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          achievements.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🎯</div>
                  <p className="text-sm text-muted-foreground mb-4">No achievements created yet</p>
                  <Button onClick={() => setShowForm(true)}>Create First Achievement</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {achievements.map(achievement => (
                <Card key={achievement.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{achievement.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                        <div className="flex gap-2 mt-3">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            Target: {achievement.target_value}
                          </span>
                          <span className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                            Reward: +{achievement.points_reward} pts
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${achievement.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {achievement.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          {achievement.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
