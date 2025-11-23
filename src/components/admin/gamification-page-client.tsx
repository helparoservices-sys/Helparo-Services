'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useToast } from '@/components/ui/toast-notification'
import { 
  createBadge, 
  updateBadge, 
  deleteBadge, 
  toggleBadgeStatus,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  toggleAchievementStatus
} from '@/app/actions/admin'

interface BadgeDefinition {
  id: string
  name: string
  description: string | null
  icon_url: string | null
  badge_type: 'helper' | 'customer' | 'both'
  requirement_type: string
  requirement_value: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  points_value: number
  is_active: boolean
  created_at: string
}

interface Achievement {
  id: string
  name: string
  description: string | null
  category: 'performance' | 'consistency' | 'excellence' | 'community' | 'special'
  achievement_type: 'helper' | 'customer' | 'both'
  unlock_criteria: Record<string, string | number | boolean>
  reward_points: number
  is_active: boolean
  created_at: string
}

interface UserBadge {
  badge_id: string
  earned_at: string
  badge_definitions: {
    name: string
    badge_type: string
  }
}

interface UserAchievement {
  achievement_id: string
  earned_at: string
  achievements: {
    name: string
    achievement_type: string
  }
}

interface Stats {
  totalBadges: number
  activeBadges: number
  totalAchievements: number
  activeAchievements: number
  badgesEarned: number
  achievementsEarned: number
}

interface GamificationPageClientProps {
  badges: BadgeDefinition[]
  achievements: Achievement[]
  recentBadges: UserBadge[]
  recentAchievements: UserAchievement[]
  stats: Stats
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getBadgeTypeColor(type: string): string {
  const colors: Record<string, string> = {
    helper: 'bg-blue-100 text-blue-700',
    customer: 'bg-green-100 text-green-700',
    both: 'bg-purple-100 text-purple-700'
  }
  return colors[type.toLowerCase()] || 'bg-gray-100 text-gray-700'
}

function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: 'bg-gray-100 text-gray-700',
    rare: 'bg-blue-100 text-blue-700',
    epic: 'bg-purple-100 text-purple-700',
    legendary: 'bg-yellow-100 text-yellow-700'
  }
  return colors[rarity.toLowerCase()] || 'bg-gray-100 text-gray-700'
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    performance: 'bg-red-100 text-red-700',
    consistency: 'bg-blue-100 text-blue-700',
    excellence: 'bg-yellow-100 text-yellow-700',
    community: 'bg-green-100 text-green-700',
    special: 'bg-purple-100 text-purple-700'
  }
  return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-700'
}

function getRequirementText(type: string, value: number): string {
  const typeMap: Record<string, string> = {
    jobs_completed: `Complete ${value} jobs`,
    rating_threshold: `Maintain ${value}.0+ rating`,
    earnings_milestone: `Earn ₹${value}`,
    referrals: `Refer ${value} users`,
    consecutive_days: `${value} consecutive days`,
    specialization_verified: `Verify ${value} specialization`
  }
  return typeMap[type] || `${type}: ${value}`
}

export function GamificationPageClient({ 
  badges, 
  achievements, 
  recentBadges, 
  recentAchievements, 
  stats 
}: GamificationPageClientProps) {
  const router = useRouter()
  const { showSuccess, showError, showWarning, showInfo } = useToast()
  const [activeTab, setActiveTab] = useState<'badges' | 'achievements' | 'recent'>('badges')
  const [badgeFilter, setBadgeFilter] = useState<string>('all')
  const [achievementFilter, setAchievementFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // CRUD Modal States
  const [showBadgeModal, setShowBadgeModal] = useState(false)
  const [showAchievementModal, setShowAchievementModal] = useState(false)
  const [editingBadge, setEditingBadge] = useState<BadgeDefinition | null>(null)
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRefresh = useCallback(() => {
    showInfo('Refreshing Data...', 'Fetching latest gamification data')
    router.refresh()
  }, [router, showInfo])

  // CRUD Operations
  const handleCreateBadge = useCallback(() => {
    setEditingBadge(null)
    setShowBadgeModal(true)
  }, [])

  const handleEditBadge = useCallback((badge: BadgeDefinition) => {
    setEditingBadge(badge)
    setShowBadgeModal(true)
  }, [])

  const handleCreateAchievement = useCallback(() => {
    setEditingAchievement(null)
    setShowAchievementModal(true)
  }, [])

  const handleEditAchievement = useCallback((achievement: Achievement) => {
    setEditingAchievement(achievement)
    setShowAchievementModal(true)
  }, [])

  const handleDeleteBadge = useCallback(async (badgeId: string) => {
    const badgeToDelete = badges.find(b => b.id === badgeId)
    if (!confirm(`Are you sure you want to delete "${badgeToDelete?.name}"? This cannot be undone.`)) return
    
    setLoading(true)
    try {
      const result = await deleteBadge(badgeId)
      if ('success' in result && result.success) {
        showSuccess('Badge Deleted! 🗑️', `Badge "${badgeToDelete?.name}" has been removed`)
        router.refresh()
      } else {
        showError('Delete Failed', 'Failed to delete badge')
      }
    } catch (error) {
      console.error('Failed to delete badge:', error)
      showError('Delete Failed', 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [router, badges, showSuccess, showError])

  const handleDeleteAchievement = useCallback(async (achievementId: string) => {
    const achievementToDelete = achievements.find(a => a.id === achievementId)
    if (!confirm(`Are you sure you want to delete "${achievementToDelete?.name}"? This cannot be undone.`)) return
    
    setLoading(true)
    try {
      const result = await deleteAchievement(achievementId)
      if ('success' in result && result.success) {
        showSuccess('Achievement Deleted! 🗑️', `Achievement "${achievementToDelete?.name}" has been removed`)
        router.refresh()
      } else {
        showError('Delete Failed', 'Failed to delete achievement')
      }
    } catch (error) {
      console.error('Failed to delete achievement:', error)
      showError('Delete Failed', 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [router, achievements, showSuccess, showError])

  const handleToggleBadgeStatus = useCallback(async (badgeId: string, currentStatus: boolean) => {
    setLoading(true)
    const badge = badges.find(b => b.id === badgeId)
    try {
      const result = await toggleBadgeStatus(badgeId, !currentStatus)
      if ('success' in result && result.success) {
        showSuccess(`Badge ${!currentStatus ? 'Activated' : 'Deactivated'}! ${!currentStatus ? '✅' : '⏸️'}`, `Badge "${badge?.name}" is now ${!currentStatus ? 'active' : 'inactive'}`)
        router.refresh()
      } else {
        showError('Toggle Failed', 'Failed to toggle badge status')
      }
    } catch (error) {
      console.error('Failed to toggle badge status:', error)
      showError('Toggle Failed', 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [router, badges, showSuccess, showError])

  const handleToggleAchievementStatus = useCallback(async (achievementId: string, currentStatus: boolean) => {
    setLoading(true)
    const achievement = achievements.find(a => a.id === achievementId)
    try {
      const result = await toggleAchievementStatus(achievementId, !currentStatus)
      if ('success' in result && result.success) {
        showSuccess(`Achievement ${!currentStatus ? 'Activated' : 'Deactivated'}! ${!currentStatus ? '✅' : '⏸️'}`, `Achievement "${achievement?.name}" is now ${!currentStatus ? 'active' : 'inactive'}`)
        router.refresh()
      } else {
        showError('Toggle Failed', 'Failed to toggle achievement status')
      }
    } catch (error) {
      console.error('Failed to toggle achievement status:', error)
      showError('Toggle Failed', 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [router, achievements, showSuccess, showError])

  // Filter badges
  const filteredBadges = useMemo(() => {
    return badges.filter(badge => {
      if (badgeFilter !== 'all' && badge.badge_type !== badgeFilter) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return badge.name.toLowerCase().includes(query) || 
               (badge.description && badge.description.toLowerCase().includes(query))
      }
      return true
    })
  }, [badges, badgeFilter, searchQuery])

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    return achievements.filter(achievement => {
      if (achievementFilter !== 'all' && achievement.achievement_type !== achievementFilter) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return achievement.name.toLowerCase().includes(query) || 
               (achievement.description && achievement.description.toLowerCase().includes(query))
      }
      return true
    })
  }, [achievements, achievementFilter, searchQuery])

  return (
    <div className="min-h-screen bg-primary-50 dark:bg-slate-900 py-10 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold dark:text-white">Gamification Management</h1>
            <p className="text-muted-foreground dark:text-slate-400">Configure badges, achievements, and track engagement</p>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'badges' && (
              <Button onClick={handleCreateBadge} className="bg-green-600 hover:bg-green-700">
                + New Badge
              </Button>
            )}
            {activeTab === 'achievements' && (
              <Button onClick={handleCreateAchievement} className="bg-blue-600 hover:bg-blue-700">
                + New Achievement
              </Button>
            )}
            <Button onClick={handleRefresh} variant="outline" className="dark:bg-slate-800 dark:text-white dark:border-slate-600">
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalBadges}</div>
              <p className="text-sm text-muted-foreground mt-1">Total Badges</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.activeBadges}</div>
              <p className="text-sm text-muted-foreground mt-1">Active Badges</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalAchievements}</div>
              <p className="text-sm text-muted-foreground mt-1">Total Achievements</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.activeAchievements}</div>
              <p className="text-sm text-muted-foreground mt-1">Active Achievements</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.badgesEarned}</div>
              <p className="text-sm text-muted-foreground mt-1">Badges Earned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-pink-600">{stats.achievementsEarned}</div>
              <p className="text-sm text-muted-foreground mt-1">Achievements Earned</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b dark:border-slate-700">
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'badges'
                ? 'border-primary text-primary dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white'
            }`}
          >
            Badges ({badges.length})
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'achievements'
                ? 'border-primary text-primary dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white'
            }`}
          >
            Achievements ({achievements.length})
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'recent'
                ? 'border-primary text-primary dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white'
            }`}
          >
            Recent Activity ({recentBadges.length + recentAchievements.length})
          </button>
        </div>

        {/* Filters */}
        {activeTab !== 'recent' && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              {activeTab === 'badges' ? (
                <select
                  value={badgeFilter}
                  onChange={(e) => setBadgeFilter(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="helper">Helper</option>
                  <option value="customer">Customer</option>
                  <option value="both">Both</option>
                </select>
              ) : (
                <select
                  value={achievementFilter}
                  onChange={(e) => setAchievementFilter(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="helper">Helper</option>
                  <option value="customer">Customer</option>
                  <option value="both">Both</option>
                </select>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-80"
              />
            </div>
          </div>
        )}

        {/* Content */}
        {activeTab === 'badges' ? (
          filteredBadges.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🏆</div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {badges.length === 0 ? 'No badges found' : 'No badges match your filters'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredBadges.map(badge => (
                <Card key={badge.id} className={!badge.is_active ? 'opacity-60' : ''}>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-3">
                      <div className="text-5xl">
                        {badge.icon_url ? (
                          <div className="relative w-12 h-12 mx-auto">
                            <Image src={badge.icon_url} alt={badge.name} fill className="object-contain" />
                          </div>
                        ) : (
                          '🏆'
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{badge.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {badge.description || 'No description'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-center gap-2">
                          <Badge className={getBadgeTypeColor(badge.badge_type)}>
                            {badge.badge_type}
                          </Badge>
                          <Badge className={getRarityColor(badge.rarity)}>
                            {badge.rarity}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getRequirementText(badge.requirement_type, badge.requirement_value)}
                        </div>
                        <div className="text-sm font-medium text-primary">
                          +{badge.points_value} points
                        </div>
                      </div>
                      <div className="pt-3 border-t">
                        <div className="text-xs text-muted-foreground mt-2">
                          Created {formatDateTime(badge.created_at)}
                        </div>
                        {!badge.is_active && (
                          <div className="text-xs text-red-600 mt-1">Inactive</div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditBadge(badge)}
                            disabled={loading}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleBadgeStatus(badge.id, badge.is_active)}
                            disabled={loading}
                            className={badge.is_active ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                          >
                            {badge.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteBadge(badge.id)}
                            disabled={loading}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : activeTab === 'achievements' ? (
          filteredAchievements.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🎯</div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {achievements.length === 0 ? 'No achievements found' : 'No achievements match your filters'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredAchievements.map(achievement => (
                <Card key={achievement.id} className={!achievement.is_active ? 'opacity-60' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">🎯</div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{achievement.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {achievement.description || 'No description'}
                        </p>
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <Badge className={getBadgeTypeColor(achievement.achievement_type)}>
                            {achievement.achievement_type}
                          </Badge>
                          <Badge className={getCategoryColor(achievement.category)}>
                            {achievement.category}
                          </Badge>
                          <Badge variant="outline">
                            +{achievement.reward_points} points
                          </Badge>
                          {!achievement.is_active && (
                            <Badge variant="destructive">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Created {formatDateTime(achievement.created_at)}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditAchievement(achievement)}
                            disabled={loading}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleAchievementStatus(achievement.id, achievement.is_active)}
                            disabled={loading}
                            className={achievement.is_active ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                          >
                            {achievement.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteAchievement(achievement.id)}
                            disabled={loading}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          /* Recent Activity */
          <div className="space-y-6">
            {/* Recent Badges */}
            {recentBadges.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Recent Badges Earned</h3>
                <div className="space-y-2">
                  {recentBadges.map((userBadge, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">🏆</div>
                            <div>
                              <p className="font-medium">{userBadge.badge_definitions.name}</p>
                              <p className="text-sm text-muted-foreground">Badge earned</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                              {formatDateTime(userBadge.earned_at)}
                            </div>
                            <Badge className={getBadgeTypeColor(userBadge.badge_definitions.badge_type)}>
                              {userBadge.badge_definitions.badge_type}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Achievements */}
            {recentAchievements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Recent Achievements Unlocked</h3>
                <div className="space-y-2">
                  {recentAchievements.map((userAchievement, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">🎯</div>
                            <div>
                              <p className="font-medium">{userAchievement.achievements.name}</p>
                              <p className="text-sm text-muted-foreground">Achievement unlocked</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                              {formatDateTime(userAchievement.earned_at)}
                            </div>
                            <Badge className={getBadgeTypeColor(userAchievement.achievements.achievement_type)}>
                              {userAchievement.achievements.achievement_type}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* No Recent Activity */}
            {recentBadges.length === 0 && recentAchievements.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">📊</div>
                    <p className="text-sm text-muted-foreground mb-4">No recent gamification activity</p>
                    <p className="text-xs text-muted-foreground">
                      Badge and achievement earnings will appear here
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Results Count */}
        {activeTab !== 'recent' && (
          <div className="text-sm text-muted-foreground text-center">
            Showing {activeTab === 'badges' ? filteredBadges.length : filteredAchievements.length} of{' '}
            {activeTab === 'badges' ? badges.length : achievements.length} {activeTab}
          </div>
        )}

        {/* Badge Create/Edit Modal */}
        {showBadgeModal && (
          <BadgeModal
            badge={editingBadge}
            onClose={() => {
              setShowBadgeModal(false)
              setEditingBadge(null)
            }}
            onSave={() => {
              setShowBadgeModal(false)
              setEditingBadge(null)
              router.refresh()
            }}
          />
        )}

        {/* Achievement Create/Edit Modal */}
        {showAchievementModal && (
          <AchievementModal
            achievement={editingAchievement}
            onClose={() => {
              setShowAchievementModal(false)
              setEditingAchievement(null)
            }}
            onSave={() => {
              setShowAchievementModal(false)
              setEditingAchievement(null)
              router.refresh()
            }}
          />
        )}
      </div>
    </div>
  )
}

// Badge Create/Edit Modal Component
function BadgeModal({ 
  badge, 
  onClose, 
  onSave 
}: { 
  badge: BadgeDefinition | null
  onClose: () => void
  onSave: () => void
}) {
  const { showSuccess, showError } = useToast()
  const [formData, setFormData] = useState({
    name: badge?.name || '',
    description: badge?.description || '',
    badge_type: badge?.badge_type || 'helper',
    requirement_type: badge?.requirement_type || 'jobs_completed',
    requirement_value: badge?.requirement_value || 1,
    rarity: badge?.rarity || 'common',
    points_value: badge?.points_value || 10,
    is_active: badge?.is_active ?? true
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      let result
      if (badge) {
        result = await updateBadge(badge.id, formData)
      } else {
        result = await createBadge(formData)
      }
      
      if ('success' in result && result.success) {
        showSuccess(badge ? 'Badge Updated! ✅' : 'Badge Created! 🏆', `Badge "${formData.name}" has been ${badge ? 'updated' : 'created'} successfully`)
        onSave()
      } else {
        const message = 'message' in result ? result.message : 'Failed to save badge'
        showError('Save Failed', message)
      }
    } catch (error) {
      console.error('Failed to save badge:', error)
      showError('Save Failed', 'An unexpected error occurred while saving badge')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">
          {badge ? 'Edit Badge' : 'Create New Badge'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Badge Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Enter badge name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Badge description (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Badge Type *</label>
            <select
              className="w-full p-2 border rounded-md"
              value={formData.badge_type}
              onChange={(e) => setFormData(prev => ({ ...prev, badge_type: e.target.value as 'helper' | 'customer' | 'both' }))}
              required
            >
              <option value="helper">Helper</option>
              <option value="customer">Customer</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Requirement Type *</label>
            <select
              className="w-full p-2 border rounded-md"
              value={formData.requirement_type}
              onChange={(e) => setFormData(prev => ({ ...prev, requirement_type: e.target.value }))}
              required
            >
              <option value="jobs_completed">Jobs Completed</option>
              <option value="rating_threshold">Rating Threshold</option>
              <option value="earnings_milestone">Earnings Milestone</option>
              <option value="referrals">Referrals</option>
              <option value="consecutive_days">Consecutive Days</option>
              <option value="specialization_verified">Specialization Verified</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Requirement Value *</label>
            <Input
              type="number"
              value={formData.requirement_value}
              onChange={(e) => setFormData(prev => ({ ...prev, requirement_value: Number(e.target.value) }))}
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Rarity *</label>
            <select
              className="w-full p-2 border rounded-md"
              value={formData.rarity}
              onChange={(e) => setFormData(prev => ({ ...prev, rarity: e.target.value as 'common' | 'rare' | 'epic' | 'legendary' }))}
              required
            >
              <option value="common">Common</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Points Value *</label>
            <Input
              type="number"
              value={formData.points_value}
              onChange={(e) => setFormData(prev => ({ ...prev, points_value: Number(e.target.value) }))}
              required
              min="1"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium">
              Active Badge
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : badge ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Achievement Create/Edit Modal Component
function AchievementModal({ 
  achievement, 
  onClose, 
  onSave 
}: { 
  achievement: Achievement | null
  onClose: () => void
  onSave: () => void
}) {
  const { showSuccess, showError } = useToast()
  const [formData, setFormData] = useState({
    name: achievement?.name || '',
    description: achievement?.description || '',
    category: achievement?.category || 'performance',
    achievement_type: achievement?.achievement_type || 'helper',
    reward_points: achievement?.reward_points || 50,
    is_active: achievement?.is_active ?? true
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      let result
      const achievementData = {
        ...formData,
        unlock_criteria: {} // Default empty unlock criteria
      }
      
      if (achievement) {
        result = await updateAchievement(achievement.id, achievementData)
      } else {
        result = await createAchievement(achievementData)
      }
      
      if ('success' in result && result.success) {
        showSuccess(achievement ? 'Achievement Updated! ✅' : 'Achievement Created! 🎯', `Achievement "${formData.name}" has been ${achievement ? 'updated' : 'created'} successfully`)
        onSave()
      } else {
        const message = 'message' in result ? result.message : 'Failed to save achievement'
        showError('Save Failed', message)
      }
    } catch (error) {
      console.error('Failed to save achievement:', error)
      showError('Save Failed', 'An unexpected error occurred while saving achievement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">
          {achievement ? 'Edit Achievement' : 'Create New Achievement'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Achievement Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Enter achievement name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Achievement description (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category *</label>
            <select
              className="w-full p-2 border rounded-md"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as Achievement['category'] }))}
              required
            >
              <option value="performance">Performance</option>
              <option value="consistency">Consistency</option>
              <option value="excellence">Excellence</option>
              <option value="community">Community</option>
              <option value="special">Special</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Achievement Type *</label>
            <select
              className="w-full p-2 border rounded-md"
              value={formData.achievement_type}
              onChange={(e) => setFormData(prev => ({ ...prev, achievement_type: e.target.value as 'helper' | 'customer' | 'both' }))}
              required
            >
              <option value="helper">Helper</option>
              <option value="customer">Customer</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Reward Points *</label>
            <Input
              type="number"
              value={formData.reward_points}
              onChange={(e) => setFormData(prev => ({ ...prev, reward_points: Number(e.target.value) }))}
              required
              min="1"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="achievement_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="achievement_active" className="text-sm font-medium">
              Active Achievement
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : achievement ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}