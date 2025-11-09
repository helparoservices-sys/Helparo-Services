'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading'
import { getUserBadges, getUserAchievements, getLoyaltyBalance, getLoyaltyTransactions } from '@/app/actions/gamification'

interface Badge {
  id: string
  badge_id: string
  awarded_at: string
  badge: {
    name: string
    description: string
    icon: string
    badge_type: string
    points_reward: number
  }
}

interface Achievement {
  id: string
  achievement_id: string
  progress: number
  completed_at: string | null
  achievement: {
    name: string
    description: string
    icon: string
    target_value: number
    points_reward: number
  }
}

export default function HelperBadgesPage() {
  const [loading, setLoading] = useState(true)
  const [badges, setBadges] = useState<Badge[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'badges' | 'achievements'>('badges')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError('')

    const { supabase } = await import('@/lib/supabase/client')
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    const [badgesRes, achievementsRes, loyaltyRes] = await Promise.all([
      getUserBadges(user.id),
      getUserAchievements(user.id),
      getLoyaltyBalance(user.id)
    ])

    if ('error' in badgesRes && badgesRes.error) {
      setError(badgesRes.error)
    } else if ('badges' in badgesRes) {
      setBadges(badgesRes.badges || [])
    }

    if ('error' in achievementsRes && achievementsRes.error) {
      setError(achievementsRes.error)
      } else if ('achievements' in achievementsRes) {
      setAchievements(achievementsRes.achievements || [])
    }

    if ('error' in loyaltyRes && loyaltyRes.error) {
      setError(loyaltyRes.error)
      } else if ('balance' in loyaltyRes) {
      setLoyaltyPoints(loyaltyRes.balance || 0)
    }

    setLoading(false)
  }

  const getBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      newcomer: 'from-blue-500 to-blue-300',
      service: 'from-green-500 to-green-300',
      loyalty: 'from-purple-500 to-purple-300',
      referral: 'from-pink-500 to-pink-300',
      special: 'from-yellow-500 to-yellow-300',
      milestone: 'from-red-500 to-red-300',
      expert: 'from-indigo-500 to-indigo-300'
    }
    return colors[type.toLowerCase()] || 'from-gray-500 to-gray-300'
  }

  const completedAchievements = achievements.filter(a => a.completed_at).length

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Badges & Achievements</h1>
            <p className="text-muted-foreground">Track your progress and showcase your accomplishments</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{loyaltyPoints.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Loyalty Points</div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary">{badges.length}</div>
              <p className="text-sm text-muted-foreground mt-1">Badges Earned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-green-600">{completedAchievements}</div>
              <p className="text-sm text-muted-foreground mt-1">Achievements</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {badges.reduce((sum, b) => sum + b.badge.points_reward, 0)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Points from Badges</p>
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
            Achievements ({completedAchievements}/{achievements.length})
          </button>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : activeTab === 'badges' ? (
          <>
            {badges.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground text-center">
                    Complete jobs to earn your first badge!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {badges.map(badge => (
                  <Card key={badge.id} className="overflow-hidden">
                    <div className={`h-32 bg-gradient-to-br ${getBadgeColor(badge.badge.badge_type)} flex items-center justify-center`}>
                      <div className="text-6xl">{badge.badge.icon}</div>
                    </div>
                    
                    <CardHeader>
                      <CardTitle className="text-lg">{badge.badge.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{badge.badge.description}</p>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Earned</span>
                        <span className="font-medium">{new Date(badge.awarded_at).toLocaleDateString()}</span>
                      </div>
                      {badge.badge.points_reward > 0 && (
                        <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t">
                          <span className="text-muted-foreground">Reward</span>
                          <span className="font-medium text-primary">+{badge.badge.points_reward} points</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {achievements.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground text-center">
                    No achievements available yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {achievements.map(achievement => {
                  const progress = Math.min(achievement.progress, achievement.achievement.target_value)
                  const percentage = (progress / achievement.achievement.target_value) * 100
                  const isCompleted = !!achievement.completed_at

                  return (
                    <Card key={achievement.id} className={isCompleted ? 'border-green-300' : ''}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className={`text-5xl ${isCompleted ? '' : 'opacity-40 grayscale'}`}>
                            {achievement.achievement.icon}
                          </div>
                          
                          <div className="flex-1 space-y-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{achievement.achievement.name}</h3>
                                {isCompleted && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">✓ Completed</span>}
                              </div>
                              <p className="text-sm text-muted-foreground">{achievement.achievement.description}</p>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">
                                  {progress} / {achievement.achievement.target_value}
                                </span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-sm pt-2 border-t">
                              {isCompleted ? (
                                <>
                                  <span className="text-green-600 font-medium">
                                    Completed {new Date(achievement.completed_at!).toLocaleDateString()}
                                  </span>
                                  <span className="font-medium text-primary">
                                    +{achievement.achievement.points_reward} points earned
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="text-muted-foreground">
                                    {achievement.achievement.target_value - progress} more to go
                                  </span>
                                  <span className="text-primary font-medium">
                                    {achievement.achievement.points_reward} points reward
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
