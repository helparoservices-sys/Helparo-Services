'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Award, Trophy, Target, Zap, Star, Lock, CheckCircle, TrendingUp } from 'lucide-react'

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
  last_updated: string
  achievement: {
    name: string
    description: string
    icon: string
    achievement_type: string
    target_value: number
    points_reward: number
  }
}

export default function CustomerBadgesPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [badges, setBadges] = useState<Badge[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [activeTab, setActiveTab] = useState<'badges' | 'achievements'>('badges')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // Load badges
    const { data: badgesData } = await supabase
      .from('user_badges')
      .select(`
        id,
        badge_id,
        awarded_at,
        badge:badges (
          name,
          description,
          icon,
          badge_type,
          points_reward
        )
      `)
      .eq('user_id', user.id)
      .order('awarded_at', { ascending: false })

    if (badgesData) {
      setBadges(badgesData as any)
    }

    // Load achievements
    const { data: achievementsData } = await supabase
      .from('user_achievements')
      .select(`
        id,
        achievement_id,
        progress,
        completed_at,
        last_updated,
        achievement:achievements (
          name,
          description,
          icon,
          achievement_type,
          target_value,
          points_reward
        )
      `)
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false, nullsFirst: false })

    if (achievementsData) {
      setAchievements(achievementsData as any)
    }

    setLoading(false)
  }

  const getBadgeColor = (type: string) => {
    const colors: Record<string, { bg: string; text: string; icon: any }> = {
      newcomer: { bg: 'from-blue-500 to-cyan-400', text: 'text-blue-600', icon: Star },
      service: { bg: 'from-green-500 to-emerald-400', text: 'text-green-600', icon: CheckCircle },
      loyalty: { bg: 'from-purple-500 to-pink-400', text: 'text-purple-600', icon: Trophy },
      referral: { bg: 'from-pink-500 to-rose-400', text: 'text-pink-600', icon: Award },
      special: { bg: 'from-yellow-500 to-amber-400', text: 'text-yellow-600', icon: Zap },
      milestone: { bg: 'from-red-500 to-orange-400', text: 'text-red-600', icon: Target }
    }
    return colors[type.toLowerCase()] || colors.newcomer
  }

  const completedAchievements = achievements.filter(a => a.completed_at).length
  const totalPoints = badges.reduce((sum, b) => sum + (b.badge.points_reward || 0), 0) +
                     achievements.filter(a => a.completed_at).reduce((sum, a) => sum + (a.achievement.points_reward || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading achievements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Badges & Achievements</h1>
        <p className="text-slate-600 dark:text-slate-400">Track your progress and unlock exclusive rewards</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Award className="h-6 w-6" />
            <span className="text-sm opacity-90">Total Badges</span>
          </div>
          <p className="text-4xl font-bold">{badges.length}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-6 w-6" />
            <span className="text-sm opacity-90">Achievements</span>
          </div>
          <p className="text-4xl font-bold">{completedAchievements} / {achievements.length}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="h-6 w-6" />
            <span className="text-sm opacity-90">Points Earned</span>
          </div>
          <p className="text-4xl font-bold">{totalPoints}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('badges')}
          className={`px-6 py-3 font-semibold border-b-2 transition-all ${
            activeTab === 'badges'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Badges ({badges.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`px-6 py-3 font-semibold border-b-2 transition-all ${
            activeTab === 'achievements'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Achievements ({completedAchievements}/{achievements.length})
          </div>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'badges' ? (
        <>
          {badges.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
              <Award className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Badges Yet</h3>
              <p className="text-slate-600 dark:text-slate-400">Complete services and reach milestones to earn your first badge!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {badges.map(badge => {
                const badgeStyle = getBadgeColor(badge.badge.badge_type)
                const BadgeIcon = badgeStyle.icon

                return (
                  <div
                    key={badge.id}
                    className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-slate-200 dark:border-slate-700 group"
                  >
                    <div className={`bg-gradient-to-br ${badgeStyle.bg} h-40 flex items-center justify-center relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                      <div className="relative z-10 text-white">
                        <BadgeIcon className="h-20 w-20 mx-auto mb-2 drop-shadow-lg" />
                        <div className="text-7xl opacity-80">{badge.badge.icon}</div>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{badge.badge.name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{badge.badge.description}</p>

                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Awarded on</span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {new Date(badge.awarded_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        
                        {badge.badge.points_reward > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Points Earned</span>
                            <span className="font-bold text-green-600">+{badge.badge.points_reward}</span>
                          </div>
                        )}

                        <div className="pt-2">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badgeStyle.text} bg-slate-100 dark:bg-slate-700`}>
                            {badge.badge.badge_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      ) : (
        <>
          {achievements.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
              <Target className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Achievements Yet</h3>
              <p className="text-slate-600 dark:text-slate-400">Start using services to track your progress!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {achievements.map(achievement => {
                const progress = Math.min(achievement.progress, achievement.achievement.target_value)
                const percentage = (progress / achievement.achievement.target_value) * 100
                const isCompleted = !!achievement.completed_at

                return (
                  <div
                    key={achievement.id}
                    className={`bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border-2 transition-all ${
                      isCompleted
                        ? 'border-green-500 dark:border-green-600'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-5">
                      {/* Icon */}
                      <div className={`text-6xl ${isCompleted ? '' : 'opacity-40 grayscale'} transition-all`}>
                        {achievement.achievement.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                              {achievement.achievement.name}
                            </h3>
                            {isCompleted && (
                              <span className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                                <CheckCircle className="h-3 w-3" />
                                Completed
                              </span>
                            )}
                            {!isCompleted && (
                              <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-full">
                                <Lock className="h-3 w-3" />
                                In Progress
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 dark:text-slate-400">{achievement.achievement.description}</p>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Progress
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {progress.toLocaleString()} / {achievement.achievement.target_value.toLocaleString()}
                            </span>
                          </div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                isCompleted
                                  ? 'bg-gradient-to-r from-green-500 to-green-400'
                                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {percentage.toFixed(0)}% Complete
                          </div>
                        </div>

                        {/* Footer Info */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                          {isCompleted ? (
                            <>
                              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                                ✓ Completed on {new Date(achievement.completed_at!).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                              <span className="flex items-center gap-1 text-sm font-bold text-green-600">
                                <Zap className="h-4 w-4" />
                                +{achievement.achievement.points_reward} points earned
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                {(achievement.achievement.target_value - progress).toLocaleString()} more to go
                              </span>
                              <span className="flex items-center gap-1 text-sm font-bold text-purple-600">
                                <Trophy className="h-4 w-4" />
                                {achievement.achievement.points_reward} points reward
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
