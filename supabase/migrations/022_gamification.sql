-- Gamification System (Badges, Achievements, Leaderboard, Loyalty Points)
-- Migration 022: Complete gamification for helpers and customers

-- ============================================================================
-- BADGE DEFINITIONS (predefined badge types)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.badge_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('helper', 'customer', 'both')),
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('jobs_completed', 'rating_threshold', 'earnings_milestone', 'referrals', 'consecutive_days', 'specialization_verified')),
  requirement_value INTEGER NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  points_value INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_badge_defs_type ON public.badge_definitions(badge_type);
CREATE INDEX IF NOT EXISTS idx_badge_defs_rarity ON public.badge_definitions(rarity);

ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone view badges" ON public.badge_definitions;
CREATE POLICY "Anyone view badges" ON public.badge_definitions
  FOR SELECT USING (is_active = TRUE);

COMMENT ON TABLE public.badge_definitions IS 'Predefined badge types and unlock requirements';

-- Insert default badges
INSERT INTO public.badge_definitions (name, description, badge_type, requirement_type, requirement_value, rarity, points_value) VALUES
  ('First Job', 'Complete your first service', 'helper', 'jobs_completed', 1, 'common', 10),
  ('Rising Star', 'Complete 10 services', 'helper', 'jobs_completed', 10, 'common', 50),
  ('Pro Helper', 'Complete 50 services', 'helper', 'jobs_completed', 50, 'rare', 200),
  ('Elite Expert', 'Complete 100 services', 'helper', 'jobs_completed', 100, 'epic', 500),
  ('Master of Service', 'Complete 500 services', 'helper', 'jobs_completed', 500, 'legendary', 2000),
  ('5-Star Champion', 'Maintain 5.0 rating with 20+ reviews', 'helper', 'rating_threshold', 5, 'epic', 300),
  ('Money Maker', 'Earn ₹10,000 total', 'helper', 'earnings_milestone', 10000, 'rare', 150),
  ('Top Earner', 'Earn ₹100,000 total', 'helper', 'earnings_milestone', 100000, 'legendary', 1000),
  ('Specialist', 'Verify specialization in a service', 'helper', 'specialization_verified', 1, 'rare', 100),
  ('Early Adopter', 'Join in first month', 'both', 'consecutive_days', 1, 'common', 50),
  ('Referral Master', 'Refer 10 successful users', 'both', 'referrals', 10, 'rare', 250),
  ('Customer VIP', 'Book 20 services', 'customer', 'jobs_completed', 20, 'rare', 150)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- USER BADGES (earned badges)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badge_definitions(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  progress_value INTEGER DEFAULT 0,
  is_displayed BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON public.user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned ON public.user_badges(earned_at DESC);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own badges" ON public.user_badges;
CREATE POLICY "Users view own badges" ON public.user_badges
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone view displayed badges" ON public.user_badges;
CREATE POLICY "Anyone view displayed badges" ON public.user_badges
  FOR SELECT USING (is_displayed = TRUE);

-- ============================================================================
-- ACHIEVEMENTS (milestone tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('performance', 'consistency', 'excellence', 'community', 'special')),
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('helper', 'customer', 'both')),
  unlock_criteria JSONB NOT NULL,
  reward_points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_achievements_type ON public.achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone view achievements" ON public.achievements;
CREATE POLICY "Anyone view achievements" ON public.achievements
  FOR SELECT USING (is_active = TRUE);

-- Insert default achievements
INSERT INTO public.achievements (name, description, category, achievement_type, unlock_criteria, reward_points) VALUES
  ('Perfect Week', 'Complete 7 jobs in 7 days', 'consistency', 'helper', '{"type": "consecutive_days", "value": 7, "activity": "jobs"}', 100),
  ('Weekend Warrior', 'Complete 5 jobs on weekend', 'performance', 'helper', '{"type": "weekend_jobs", "value": 5}', 75),
  ('Early Bird', 'Complete 10 jobs before 9 AM', 'performance', 'helper', '{"type": "time_based", "value": 10, "before": "09:00"}', 50),
  ('Night Owl', 'Complete 10 jobs after 9 PM', 'performance', 'helper', '{"type": "time_based", "value": 10, "after": "21:00"}', 50),
  ('Speed Demon', 'Complete 5 jobs in under estimated time', 'excellence', 'helper', '{"type": "under_time", "value": 5}', 80),
  ('No Complaints', 'Complete 50 jobs with zero complaints', 'excellence', 'helper', '{"type": "zero_complaints", "value": 50}', 200),
  ('Community Champion', 'Help 3 SOS alerts', 'community', 'helper', '{"type": "sos_responses", "value": 3}', 150),
  ('Loyal Customer', 'Book same helper 5 times', 'consistency', 'customer', '{"type": "repeat_helper", "value": 5}', 100),
  ('Review Expert', 'Write 20 detailed reviews', 'community', 'customer', '{"type": "reviews_written", "value": 20}', 120)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- USER ACHIEVEMENTS (earned achievements)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  progress_data JSONB,
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON public.user_achievements(achievement_id);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view achievements" ON public.user_achievements;
CREATE POLICY "Users view achievements" ON public.user_achievements
  FOR SELECT USING (user_id = auth.uid() OR TRUE);

-- ============================================================================
-- LOYALTY POINTS (customer rewards)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points_earned INTEGER NOT NULL DEFAULT 0,
  points_spent INTEGER NOT NULL DEFAULT 0,
  points_balance INTEGER NOT NULL DEFAULT 0,
  last_earned_at TIMESTAMPTZ,
  last_spent_at TIMESTAMPTZ,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  tier_level TEXT DEFAULT 'bronze' CHECK (tier_level IN ('bronze', 'silver', 'gold', 'platinum')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_points_user ON public.loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_balance ON public.loyalty_points(points_balance DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_tier ON public.loyalty_points(tier_level);

DROP TRIGGER IF EXISTS trg_update_loyalty_points ON public.loyalty_points;
CREATE TRIGGER trg_update_loyalty_points
  BEFORE UPDATE ON public.loyalty_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own points" ON public.loyalty_points;
CREATE POLICY "Users view own points" ON public.loyalty_points
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================================
-- LOYALTY TRANSACTIONS (points history)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'expire', 'refund')),
  points_amount INTEGER NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('booking', 'referral', 'review', 'badge', 'achievement', 'redemption', 'promotion', 'admin_adjustment')),
  source_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_loyalty_trans_user ON public.loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_trans_type ON public.loyalty_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_loyalty_trans_created ON public.loyalty_transactions(created_at DESC);

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own transactions" ON public.loyalty_transactions;
CREATE POLICY "Users view own transactions" ON public.loyalty_transactions
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================================
-- HELPER LEADERBOARD VIEW
-- ============================================================================
CREATE OR REPLACE VIEW public.helper_leaderboard AS
SELECT 
  p.id AS helper_id,
  p.full_name,
  p.avatar_url,
  COALESCE(hs.total_jobs_completed, 0) AS jobs_completed,
  COALESCE(hrs.average_rating, 0) AS average_rating,
  COALESCE(hrs.total_reviews, 0) AS total_reviews,
  COALESCE(hs.total_earnings, 0) AS total_earnings,
  COALESCE(hs.completion_rate, 0) AS completion_rate,
  (SELECT COUNT(*) FROM public.user_badges WHERE user_id = p.id) AS badge_count,
  ROW_NUMBER() OVER (ORDER BY hs.total_jobs_completed DESC, hrs.average_rating DESC) AS rank
FROM public.profiles p
LEFT JOIN public.helper_statistics hs ON hs.helper_id = p.id
LEFT JOIN public.helper_rating_summary hrs ON hrs.helper_id = p.id
WHERE p.role::TEXT = 'helper'
ORDER BY rank;

COMMENT ON VIEW public.helper_leaderboard IS 'Public leaderboard ranking helpers by performance';

-- ============================================================================
-- FUNCTIONS
-- ============================================================================
-- Award loyalty points
CREATE OR REPLACE FUNCTION public.award_loyalty_points(
  p_user_id UUID,
  p_points INTEGER,
  p_source_type TEXT,
  p_source_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_new_balance INTEGER;
  v_lifetime INTEGER;
  v_new_tier TEXT;
BEGIN
  -- Insert transaction
  INSERT INTO public.loyalty_transactions (
    user_id, transaction_type, points_amount, source_type, source_id, description
  ) VALUES (
    p_user_id, 'earn', p_points, p_source_type, p_source_id, p_description
  );

  -- Update loyalty points
  INSERT INTO public.loyalty_points (user_id, points_earned, points_balance, lifetime_points, last_earned_at)
  VALUES (p_user_id, p_points, p_points, p_points, timezone('utc'::text, now()))
  ON CONFLICT (user_id) DO UPDATE SET
    points_earned = loyalty_points.points_earned + p_points,
    points_balance = loyalty_points.points_balance + p_points,
    lifetime_points = loyalty_points.lifetime_points + p_points,
    last_earned_at = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now())
  RETURNING points_balance, lifetime_points INTO v_new_balance, v_lifetime;

  -- Update tier based on lifetime points
  v_new_tier := CASE
    WHEN v_lifetime >= 10000 THEN 'platinum'
    WHEN v_lifetime >= 5000 THEN 'gold'
    WHEN v_lifetime >= 2000 THEN 'silver'
    ELSE 'bronze'
  END;

  UPDATE public.loyalty_points
  SET tier_level = v_new_tier
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;$$;

-- Redeem loyalty points
CREATE OR REPLACE FUNCTION public.redeem_loyalty_points(
  p_user_id UUID,
  p_points INTEGER,
  p_description TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  -- Check balance
  SELECT points_balance INTO v_balance FROM public.loyalty_points WHERE user_id = p_user_id;

  IF v_balance IS NULL OR v_balance < p_points THEN
    RAISE EXCEPTION 'Insufficient points balance';
  END IF;

  -- Insert transaction
  INSERT INTO public.loyalty_transactions (
    user_id, transaction_type, points_amount, source_type, description
  ) VALUES (
    p_user_id, 'spend', p_points, 'redemption', p_description
  );

  -- Update points
  UPDATE public.loyalty_points
  SET points_spent = points_spent + p_points,
      points_balance = points_balance - p_points,
      last_spent_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now())
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;$$;

-- Check and award badge
CREATE OR REPLACE FUNCTION public.check_and_award_badge(
  p_user_id UUID,
  p_badge_name TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_badge_id UUID;
  v_points INTEGER;
BEGIN
  -- Get badge details
  SELECT id, points_value INTO v_badge_id, v_points
  FROM public.badge_definitions
  WHERE name = p_badge_name AND is_active = TRUE;

  IF v_badge_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Award badge if not already earned
  INSERT INTO public.user_badges (user_id, badge_id)
  VALUES (p_user_id, v_badge_id)
  ON CONFLICT (user_id, badge_id) DO NOTHING;

  IF FOUND THEN
    -- Award loyalty points for badge
    PERFORM public.award_loyalty_points(
      p_user_id, v_points, 'badge', v_badge_id, 'Earned badge: ' || p_badge_name
    );
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;$$;

-- Get user gamification summary
CREATE OR REPLACE FUNCTION public.get_user_gamification_summary(p_user_id UUID)
RETURNS TABLE (
  badges_earned INTEGER,
  achievements_earned INTEGER,
  loyalty_points INTEGER,
  loyalty_tier TEXT,
  leaderboard_rank INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM public.user_badges WHERE user_id = p_user_id),
    (SELECT COUNT(*)::INTEGER FROM public.user_achievements WHERE user_id = p_user_id),
    COALESCE((SELECT points_balance FROM public.loyalty_points WHERE user_id = p_user_id), 0),
    COALESCE((SELECT tier_level FROM public.loyalty_points WHERE user_id = p_user_id), 'bronze'),
    COALESCE((SELECT rank::INTEGER FROM public.helper_leaderboard WHERE helper_id = p_user_id), 0);
END;$$;

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT SELECT ON public.helper_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_loyalty_points TO service_role;
GRANT EXECUTE ON FUNCTION public.redeem_loyalty_points TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_award_badge TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_gamification_summary TO authenticated;

COMMENT ON MIGRATION IS 'Complete gamification system: badges, achievements, leaderboard, loyalty points with tiers';
