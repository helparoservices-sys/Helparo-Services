'use server'
import { createClient } from '@/lib/supabase/server'
import { GamificationPageClient } from '@/components/admin/gamification-page-client'

export default async function AdminGamificationPage() {
  const supabase = await createClient()

  // Fetch badges and achievements in parallel
  const [badgesResult, achievementsResult, userBadgesResult, userAchievementsResult] = await Promise.all([
    supabase
      .from('badge_definitions')
      .select('id, name, description, badge_type, icon_url, criteria, is_active, created_at')
      .order('created_at', { ascending: false }),
    
    supabase
      .from('achievements')
      .select('id, name, description, achievement_type, target_value, points_reward, is_active, created_at')
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
  
  // Transform userBadges to flatten badge_definitions from array to object
  const userBadges = Array.isArray(userBadgesResult.data) 
    ? userBadgesResult.data.map(ub => ({
        badge_id: ub.badge_id,
        earned_at: ub.earned_at,
        badge_definitions: Array.isArray(ub.badge_definitions) && ub.badge_definitions.length > 0
          ? ub.badge_definitions[0]
          : { name: 'Unknown', badge_type: 'both' }
      }))
    : []
  
  // Transform userAchievements to flatten achievements from array to object
  const userAchievements = Array.isArray(userAchievementsResult.data)
    ? userAchievementsResult.data.map(ua => ({
        achievement_id: ua.achievement_id,
        earned_at: ua.earned_at,
        achievements: Array.isArray(ua.achievements) && ua.achievements.length > 0
          ? ua.achievements[0]
          : { name: 'Unknown', achievement_type: 'both' }
      }))
    : []

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
