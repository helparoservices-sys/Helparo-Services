'use server'
import { createClient } from '@/lib/supabase/server'
import { GamificationPageClient } from '@/components/admin/gamification-page-client'

export default async function AdminGamificationPage() {
  const supabase = await createClient()

  // Fetch badges and achievements in parallel
  const [badgesResult, achievementsResult, userBadgesResult, userAchievementsResult] = await Promise.all([
    supabase
      .from('badge_definitions')
      .select('*')
      .order('created_at', { ascending: false }),
    
    supabase
      .from('achievements')
      .select('*')
      .order('created_at', { ascending: false }),
    
    supabase
      .from('user_badges')
      .select(`
        badge_id,
        earned_at,
        badge_definitions!inner (
          name,
          badge_type
        )
      `)
      .order('earned_at', { ascending: false })
      .limit(20),
    
    supabase
      .from('user_achievements')
      .select(`
        achievement_id,
        earned_at,
        achievements!inner (
          name,
          achievement_type
        )
      `)
      .order('earned_at', { ascending: false })
      .limit(20)
  ])

  // Process data with Array.isArray checks
  const badges = Array.isArray(badgesResult.data) ? badgesResult.data : []
  const achievements = Array.isArray(achievementsResult.data) ? achievementsResult.data : []
  const userBadges = Array.isArray(userBadgesResult.data) ? userBadgesResult.data : []
  const userAchievements = Array.isArray(userAchievementsResult.data) ? userAchievementsResult.data : []

  // Calculate statistics
  const stats = {
    totalBadges: badges.length,
    activeBadges: badges.filter(b => b.is_active).length,
    totalAchievements: achievements.length,
    activeAchievements: achievements.filter(a => a.is_active).length,
    badgesEarned: userBadges.length,
    achievementsEarned: userAchievements.length
  }

  return (
    <GamificationPageClient 
      badges={badges}
      achievements={achievements}
      recentBadges={userBadges}
      recentAchievements={userAchievements}
      stats={stats}
    />
  )
}
