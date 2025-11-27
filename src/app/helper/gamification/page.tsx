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
  Users
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

export default function HelperGamificationPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total_points: 0,
    level: 1,
    achievements_count: 0,
    leaderboard_rank: 0
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
      leaderboard_rank: (count || 0) + 1
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Gamification & Rewards
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Earn points, unlock achievements, and climb the leaderboard
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Points</p>
                  <p className="text-3xl font-bold mt-1">{stats.total_points.toLocaleString()}</p>
                </div>
                <Zap className="w-12 h-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Current Level</p>
                  <p className="text-3xl font-bold mt-1">{stats.level}</p>
                </div>
                <Trophy className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">Leaderboard Rank</p>
                  <p className="text-3xl font-bold mt-1">#{stats.leaderboard_rank}</p>
                </div>
                <Crown className="w-12 h-12 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Achievements</p>
                  <p className="text-3xl font-bold mt-1">{stats.achievements_count}</p>
                </div>
                <Award className="w-12 h-12 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Level Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Level Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Level {stats.level}</span>
                <span>{pointsToNextLevel} points to Level {stats.level + 1}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: `${levelProgress}%` }}
                >
                  <span className="text-xs text-white font-medium">{Math.round(levelProgress)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {achievements.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">No achievements yet</p>
                  <p className="text-sm text-slate-500 mt-1">Complete jobs to unlock achievements</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {achievements.slice(0, 5).map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                        <Trophy className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-sm">{achievement.title}</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                              {achievement.description}
                            </p>
                          </div>
                          <Badge className="bg-purple-500 text-white">
                            +{achievement.points} pts
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Top Helpers Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <Crown className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">No leaderboard data</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry) => {
                    const rankColors = ['text-yellow-600', 'text-slate-400', 'text-orange-600']
                    const rankBgColors = ['bg-yellow-50', 'bg-slate-50', 'bg-orange-50']
                    const isTopThree = entry.rank <= 3

                    return (
                      <div
                        key={entry.rank}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          isTopThree ? rankBgColors[entry.rank - 1] : 'bg-slate-50 dark:bg-slate-800'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          isTopThree ? `${rankColors[entry.rank - 1]}` : 'text-slate-600'
                        }`}>
                          {isTopThree && entry.rank === 1 && <Crown className="w-5 h-5" />}
                          {isTopThree && entry.rank !== 1 && <span>#{entry.rank}</span>}
                          {!isTopThree && <span className="text-sm">#{entry.rank}</span>}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{entry.full_name}</p>
                          <p className="text-xs text-slate-500">Level {entry.level}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-600">{entry.total_points.toLocaleString()}</p>
                          <p className="text-xs text-slate-500">points</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
