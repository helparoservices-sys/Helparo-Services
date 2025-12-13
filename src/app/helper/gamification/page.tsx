'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading'
import { 
  Trophy, 
  Award, 
  TrendingUp, 
  Zap,
  Crown,
  Users,
  Star,
  Target,
  Flame,
  Gift,
  CheckCircle,
  Lock,
  Sparkles
} from 'lucide-react'

interface Achievement {
  id: string
  achievement_type: string
  title: string
  description: string
  points: number
  unlocked_at: string
}

interface LeaderboardEntry {
  rank: number
  full_name: string
  avatar_url: string | null
  total_points: number
  level: number
}

// Ola-style achievement badges
const achievementBadges = [
  {
    id: 'first_job',
    title: 'First Mile',
    description: 'Complete your first job',
    icon: Star,
    requirement: 1,
    type: 'jobs',
    reward: '₹50 bonus',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'five_star',
    title: '5-Star Champion',
    description: 'Get 5 five-star ratings',
    icon: Star,
    requirement: 5,
    type: 'ratings',
    reward: 'Priority in job matching',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Complete 10 jobs under estimated time',
    icon: Zap,
    requirement: 10,
    type: 'fast_jobs',
    reward: '₹100 bonus',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'century',
    title: 'Century Club',
    description: 'Complete 100 jobs',
    icon: Trophy,
    requirement: 100,
    type: 'jobs',
    reward: 'Gold badge + ₹500',
    color: 'from-amber-500 to-yellow-500'
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Accept 20 jobs before 8 AM',
    icon: Target,
    requirement: 20,
    type: 'early_jobs',
    reward: 'Morning boost multiplier',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'weekend_warrior',
    title: 'Weekend Warrior',
    description: 'Complete 25 weekend jobs',
    icon: Award,
    requirement: 25,
    type: 'weekend_jobs',
    reward: '₹200 bonus',
    color: 'from-red-500 to-rose-500'
  }
]

// Ola-style milestones
const milestones = [
  { jobs: 10, title: 'Rising Star', bonus: 100, icon: '⭐' },
  { jobs: 25, title: 'Go-Getter', bonus: 250, icon: '🚀' },
  { jobs: 50, title: 'Pro Helper', bonus: 500, icon: '💪' },
  { jobs: 100, title: 'Elite Helper', bonus: 1000, icon: '🏆' },
  { jobs: 250, title: 'Legend', bonus: 2500, icon: '👑' },
  { jobs: 500, title: 'Hall of Fame', bonus: 5000, icon: '🌟' }
]

export default function HelperAchievementsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total_points: 0,
    level: 1,
    achievements_count: 0,
    leaderboard_rank: 0,
    total_jobs: 0,
    streak_days: 0
  })
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    loadGamificationData()
  }, [])

  async function loadGamificationData() {
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    const user = data?.user
    if (!user) return

    // Load user gamification stats
    const { data: gamData } = await supabase
      .from('gamification_points')
      .select('total_points, level')
      .eq('user_id', user.id)
      .single()

    // Load achievements
    const { data: achievementsData } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false })

    // Load total completed jobs count
    const { count: jobsCount } = await supabase
      .from('service_requests')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_helper_id', user.id)
      .eq('status', 'completed')

    // Load leaderboard
    const { data: leaderboardData } = await supabase
      .from('gamification_points')
      .select(`
        user_id,
        total_points,
        level,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .order('total_points', { ascending: false })
      .limit(10)

    // Calculate rank
    const { count } = await supabase
      .from('gamification_points')
      .select('*', { count: 'exact', head: true })
      .gt('total_points', gamData?.total_points || 0)

    setStats({
      total_points: gamData?.total_points || 0,
      level: gamData?.level || 1,
      achievements_count: achievementsData?.length || 0,
      leaderboard_rank: (count || 0) + 1,
      total_jobs: jobsCount || 0,
      streak_days: 0 // TODO: Calculate from daily activity
    })

    setAchievements(achievementsData || [])
    
    if (leaderboardData) {
      const formattedLeaderboard = leaderboardData.map((entry: typeof leaderboardData[0], index: number) => ({
        rank: index + 1,
        full_name: (entry.profiles as { full_name?: string })?.full_name || 'Unknown',
        avatar_url: (entry.profiles as { avatar_url?: string | null })?.avatar_url || null,
        total_points: entry.total_points || 0,
        level: entry.level || 1
      }))
      setLeaderboard(formattedLeaderboard)
    }

    setLoading(false)
  }

  // Find current milestone
  const currentMilestone = milestones.find(m => stats.total_jobs < m.jobs) || milestones[milestones.length - 1]
  const prevMilestone = milestones[milestones.indexOf(currentMilestone) - 1]
  const milestoneProgress = prevMilestone 
    ? ((stats.total_jobs - prevMilestone.jobs) / (currentMilestone.jobs - prevMilestone.jobs)) * 100
    : (stats.total_jobs / currentMilestone.jobs) * 100

  const pointsToNextLevel = Math.ceil(stats.level * 1000 - (stats.total_points % 1000))
  const levelProgress = ((stats.total_points % 1000) / 1000) * 100

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header - Ola Style */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Achievements</h1>
          </div>
          <p className="text-purple-200 text-sm">Complete milestones & earn rewards</p>
        </div>
      </div>

      {/* Quick Stats - Ola Style Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Zap className="h-4 w-4 text-purple-600" />
            </div>
            <span className="text-xs text-slate-500">Points</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.total_points.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Trophy className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-xs text-slate-500">Level</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.level}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Crown className="h-4 w-4 text-amber-600" />
            </div>
            <span className="text-xs text-slate-500">Rank</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">#{stats.leaderboard_rank}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Flame className="h-4 w-4 text-orange-600" />
            </div>
            <span className="text-xs text-slate-500">Streak</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.streak_days} days</p>
        </div>
      </div>

      {/* Current Milestone Progress - Like Ola */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-5 border border-amber-200 dark:border-amber-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{currentMilestone.icon}</span>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">{currentMilestone.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Complete {currentMilestone.jobs} jobs</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-amber-600">Reward</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">₹{currentMilestone.bonus}</p>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">{stats.total_jobs} / {currentMilestone.jobs} jobs</span>
            <span className="font-medium text-amber-600">{Math.round(milestoneProgress)}%</span>
          </div>
          <div className="w-full bg-amber-200 dark:bg-amber-900/50 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(milestoneProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Achievement Badges - Ola Style Grid */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-purple-600" />
          Badges to Unlock
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {achievementBadges.map((badge) => {
            const isUnlocked = achievements.some(a => a.achievement_type === badge.id)
            const Icon = badge.icon
            
            return (
              <div
                key={badge.id}
                className={`relative rounded-xl p-4 border transition-all ${
                  isUnlocked 
                    ? 'bg-white dark:bg-slate-800 border-green-300 dark:border-green-700 shadow-sm' 
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 opacity-75'
                }`}
              >
                {isUnlocked && (
                  <div className="absolute -top-2 -right-2">
                    <CheckCircle className="h-5 w-5 text-green-500 fill-white" />
                  </div>
                )}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${badge.color} flex items-center justify-center mb-3 ${!isUnlocked ? 'grayscale' : ''}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{badge.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{badge.description}</p>
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-1">
                    <Gift className="h-3 w-3 text-purple-500" />
                    <span className="text-xs font-medium text-purple-600">{badge.reward}</span>
                  </div>
                </div>
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/5 dark:bg-slate-900/30 rounded-xl">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Milestones Journey */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-emerald-600" />
          Your Journey
        </h2>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {milestones.map((milestone, index) => {
              const isCompleted = stats.total_jobs >= milestone.jobs
              const isCurrent = currentMilestone.jobs === milestone.jobs
              
              return (
                <div key={milestone.jobs} className="flex items-center flex-shrink-0">
                  <div className={`flex flex-col items-center ${isCurrent ? 'scale-110' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      isCompleted 
                        ? 'bg-gradient-to-br from-emerald-500 to-green-500' 
                        : isCurrent
                        ? 'bg-gradient-to-br from-amber-500 to-yellow-500 animate-pulse'
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}>
                      {milestone.icon}
                    </div>
                    <span className={`text-xs mt-1 font-medium ${
                      isCompleted ? 'text-emerald-600' : isCurrent ? 'text-amber-600' : 'text-slate-400'
                    }`}>
                      {milestone.jobs}
                    </span>
                  </div>
                  {index < milestones.length - 1 && (
                    <div className={`w-8 h-0.5 mx-1 ${
                      stats.total_jobs >= milestones[index + 1].jobs 
                        ? 'bg-emerald-500' 
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Leaderboard - Compact */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Top Helpers This Week
        </h2>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <Crown className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500 text-sm">No leaderboard data yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {leaderboard.slice(0, 5).map((entry) => {
                const rankColors: Record<number, string> = {
                  1: 'text-yellow-500',
                  2: 'text-slate-400',
                  3: 'text-orange-500'
                }
                
                return (
                  <div key={entry.rank} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className={`w-6 h-6 flex items-center justify-center font-bold text-sm ${rankColors[entry.rank] || 'text-slate-500'}`}>
                      {entry.rank === 1 ? <Crown className="h-5 w-5" /> : `#${entry.rank}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{entry.full_name}</p>
                    </div>
                    <div className="flex items-center gap-1 text-purple-600">
                      <Sparkles className="h-3 w-3" />
                      <span className="font-bold text-sm">{entry.total_points.toLocaleString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
