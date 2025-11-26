-- Delete existing data from promocodes, campaigns, and gamification tables
DELETE FROM user_achievements;
DELETE FROM user_badges;
DELETE FROM loyalty_transactions;
DELETE FROM loyalty_points;
DELETE FROM campaign_redemptions;
DELETE FROM campaign_applicable_services;
DELETE FROM promo_code_usages;
DELETE FROM promo_codes;
DELETE FROM seasonal_campaigns;
-- Keep default badges and achievements, delete only custom ones
DELETE FROM badge_definitions WHERE name NOT IN ('First Job', 'Rising Star', 'Pro Helper', 'Elite Expert', 'Master of Service', '5-Star Champion', 'Money Maker', 'Top Earner', 'Specialist', 'Early Adopter', 'Referral Master', 'Customer VIP');
DELETE FROM achievements WHERE name NOT IN ('Perfect Week', 'Weekend Warrior', 'Early Bird', 'Night Owl', 'Speed Demon', 'No Complaints', 'Community Champion', 'Loyal Customer', 'Review Expert');

-- ============================================================================
-- PROMO CODES
-- ============================================================================

-- 1. WELCOME PROMO - New User Sign Up
INSERT INTO promo_codes (code, description, discount_type, discount_value, max_discount_rupees, min_order_amount_rupees, usage_limit_total, usage_limit_per_user, start_date, end_date, is_active, allowed_roles) VALUES
('WELCOME50',
'Welcome bonus for new users - Flat ₹50 off on first booking',
'flat',
50.00,
50.00,
200.00,
1000,
1,
CURRENT_DATE,
CURRENT_DATE + INTERVAL '90 days',
true,
ARRAY['customer']);

-- 2. FIRST BOOKING - Customer First Service
INSERT INTO promo_codes (code, description, discount_type, discount_value, max_discount_rupees, min_order_amount_rupees, usage_limit_total, usage_limit_per_user, start_date, end_date, is_active, allowed_roles) VALUES
('FIRST100',
'First booking special - Get ₹100 off on orders above ₹500',
'flat',
100.00,
100.00,
500.00,
2000,
1,
CURRENT_DATE,
CURRENT_DATE + INTERVAL '180 days',
true,
ARRAY['customer']);

-- 3. PERCENTAGE DISCOUNT - 20% Off
INSERT INTO promo_codes (code, description, discount_type, discount_value, max_discount_rupees, min_order_amount_rupees, usage_limit_total, usage_limit_per_user, start_date, end_date, is_active, allowed_roles) VALUES
('SAVE20',
'Get 20% off on all services - Maximum discount ₹200',
'percent',
20.00,
200.00,
300.00,
5000,
3,
CURRENT_DATE,
CURRENT_DATE + INTERVAL '60 days',
true,
ARRAY['customer', 'helper']);

-- 4. WEEKEND SPECIAL
INSERT INTO promo_codes (code, description, discount_type, discount_value, max_discount_rupees, min_order_amount_rupees, usage_limit_total, usage_limit_per_user, start_date, end_date, is_active, allowed_roles) VALUES
('WEEKEND150',
'Weekend special - ₹150 off on weekend bookings',
'flat',
150.00,
150.00,
600.00,
1500,
2,
CURRENT_DATE,
CURRENT_DATE + INTERVAL '30 days',
true,
ARRAY['customer']);

-- 5. MEGA SALE - 30% Off
INSERT INTO promo_codes (code, description, discount_type, discount_value, max_discount_rupees, min_order_amount_rupees, usage_limit_total, usage_limit_per_user, start_date, end_date, is_active, allowed_roles) VALUES
('MEGA30',
'Mega sale - 30% off on orders above ₹1000',
'percent',
30.00,
500.00,
1000.00,
3000,
2,
CURRENT_DATE,
CURRENT_DATE + INTERVAL '45 days',
true,
ARRAY['customer']);

-- 6. REFERRAL BONUS
INSERT INTO promo_codes (code, description, discount_type, discount_value, max_discount_rupees, min_order_amount_rupees, usage_limit_total, usage_limit_per_user, start_date, end_date, is_active, allowed_roles) VALUES
('REFER200',
'Referral bonus - Get ₹200 off when you refer a friend',
'flat',
200.00,
200.00,
400.00,
10000,
1,
CURRENT_DATE,
CURRENT_DATE + INTERVAL '365 days',
true,
ARRAY['customer', 'helper']);

-- 7. BUNDLE DISCOUNT
INSERT INTO promo_codes (code, description, discount_type, discount_value, max_discount_rupees, min_order_amount_rupees, usage_limit_total, usage_limit_per_user, start_date, end_date, is_active, allowed_roles) VALUES
('BUNDLE15',
'15% extra off on service bundles',
'percent',
15.00,
300.00,
800.00,
2000,
5,
CURRENT_DATE,
CURRENT_DATE + INTERVAL '90 days',
true,
ARRAY['customer']);

-- 8. FESTIVE OFFER
INSERT INTO promo_codes (code, description, discount_type, discount_value, max_discount_rupees, min_order_amount_rupees, usage_limit_total, usage_limit_per_user, start_date, end_date, is_active, allowed_roles) VALUES
('FESTIVE25',
'Festive season special - 25% off on all services',
'percent',
25.00,
400.00,
700.00,
5000,
3,
CURRENT_DATE,
CURRENT_DATE + INTERVAL '20 days',
true,
ARRAY['customer', 'helper']);

-- 9. HELPER ONBOARDING
INSERT INTO promo_codes (code, description, discount_type, discount_value, max_discount_rupees, min_order_amount_rupees, usage_limit_total, usage_limit_per_user, start_date, end_date, is_active, allowed_roles) VALUES
('HELPER50',
'Welcome bonus for new helpers - ₹50 commission waiver',
'flat',
50.00,
50.00,
0.00,
500,
1,
CURRENT_DATE,
CURRENT_DATE + INTERVAL '180 days',
true,
ARRAY['helper']);

-- 10. LOYALTY REWARD
INSERT INTO promo_codes (code, description, discount_type, discount_value, max_discount_rupees, min_order_amount_rupees, usage_limit_total, usage_limit_per_user, start_date, end_date, is_active, allowed_roles) VALUES
('LOYAL10',
'Loyalty reward - 10% off for regular customers',
'percent',
10.00,
150.00,
250.00,
NULL,
10,
CURRENT_DATE,
CURRENT_DATE + INTERVAL '365 days',
true,
ARRAY['customer']);

-- ============================================================================
-- SEASONAL CAMPAIGNS (replaces marketing_campaigns)
-- ============================================================================

-- 1. NEW YEAR CAMPAIGN
INSERT INTO seasonal_campaigns (name, description, campaign_type, discount_type, discount_value, max_discount_amount, min_order_amount, applicable_to, target_user_segment, start_date, end_date, is_active, max_redemptions_per_user) VALUES
('New Year Mega Sale 2026',
'Celebrate New Year with amazing discounts on all services. Limited time offer!',
'new_year',
'percentage',
35.00,
600.00,
1000.00,
'all_services',
'all',
'2026-01-01'::TIMESTAMPTZ,
'2026-01-15'::TIMESTAMPTZ,
true,
3);

-- 2. SUMMER SPECIAL
INSERT INTO seasonal_campaigns (name, description, campaign_type, discount_type, discount_value, max_discount_amount, min_order_amount, applicable_to, target_user_segment, start_date, end_date, is_active, max_redemptions_per_user) VALUES
('Summer Service Special',
'Beat the heat with cool discounts on AC services, cleaning, and more',
'summer',
'percentage',
25.00,
400.00,
600.00,
'specific_categories',
'all',
CURRENT_TIMESTAMP + INTERVAL '30 days',
CURRENT_TIMESTAMP + INTERVAL '120 days',
true,
5);

-- 3. MONSOON CAMPAIGN
INSERT INTO seasonal_campaigns (name, description, campaign_type, discount_type, discount_value, max_discount_amount, min_order_amount, applicable_to, target_user_segment, start_date, end_date, is_active, max_redemptions_per_user) VALUES
('Monsoon Maintenance Offer',
'Special discounts on home maintenance and repair services during monsoon',
'monsoon',
'percentage',
20.00,
350.00,
500.00,
'specific_categories',
'all',
CURRENT_TIMESTAMP,
CURRENT_TIMESTAMP + INTERVAL '90 days',
true,
3);

-- 4. FLASH SALE
INSERT INTO seasonal_campaigns (name, description, campaign_type, discount_type, discount_value, max_discount_amount, min_order_amount, applicable_to, target_user_segment, start_date, end_date, is_active, max_redemptions_per_user) VALUES
('24-Hour Flash Sale',
'Lightning deals on popular services for 24 hours only',
'flash_sale',
'percentage',
40.00,
500.00,
800.00,
'all_services',
'all',
CURRENT_TIMESTAMP + INTERVAL '7 days',
CURRENT_TIMESTAMP + INTERVAL '8 days',
true,
2);

-- 5. FESTIVAL SPECIAL
INSERT INTO seasonal_campaigns (name, description, campaign_type, discount_type, discount_value, max_discount_amount, min_order_amount, applicable_to, target_user_segment, start_date, end_date, is_active, max_redemptions_per_user) VALUES
('Diwali Festival Bonanza',
'Celebrate festivals with special cleaning and decoration services',
'festival',
'percentage',
30.00,
450.00,
700.00,
'specific_categories',
'all',
CURRENT_TIMESTAMP + INTERVAL '60 days',
CURRENT_TIMESTAMP + INTERVAL '75 days',
true,
4);

-- 6. WINTER CAMPAIGN
INSERT INTO seasonal_campaigns (name, description, campaign_type, discount_value, max_discount_amount, min_order_amount, applicable_to, target_user_segment, start_date, end_date, is_active, max_redemptions_per_user, discount_type) VALUES
('Winter Wonderland Services',
'Special winter home services at discounted rates',
'winter',
300.00,
300.00,
1200.00,
'all_services',
'premium_users',
CURRENT_TIMESTAMP + INTERVAL '150 days',
CURRENT_TIMESTAMP + INTERVAL '240 days',
true,
3,
'flat');

-- 7. NEW USER ACQUISITION
INSERT INTO seasonal_campaigns (name, description, campaign_type, discount_type, discount_value, max_discount_amount, min_order_amount, applicable_to, target_user_segment, start_date, end_date, is_active, max_redemptions_per_user) VALUES
('Welcome New Users',
'Special first-time user discount campaign',
'special_event',
'percentage',
35.00,
250.00,
400.00,
'all_services',
'new_users',
CURRENT_TIMESTAMP,
CURRENT_TIMESTAMP + INTERVAL '180 days',
true,
1);

-- 8. INACTIVE USER WIN-BACK
INSERT INTO seasonal_campaigns (name, description, campaign_type, discount_type, discount_value, max_discount_amount, min_order_amount, applicable_to, target_user_segment, start_date, end_date, is_active, max_redemptions_per_user) VALUES
('We Miss You - Come Back Offer',
'Special offers for customers who haven''t booked in 60 days',
'special_event',
'percentage',
30.00,
350.00,
500.00,
'all_services',
'inactive_users',
CURRENT_TIMESTAMP,
CURRENT_TIMESTAMP + INTERVAL '60 days',
true,
2);

-- ============================================================================
-- ADDITIONAL ACHIEVEMENTS (adds to existing defaults)
-- ============================================================================

-- Customer Achievements
INSERT INTO achievements (name, description, category, achievement_type, unlock_criteria, reward_points, is_active) VALUES
('First Booking',
'Complete your first service booking',
'performance',
'customer',
'{"bookings_completed": 1}'::jsonb,
100,
true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO achievements (name, description, category, achievement_type, unlock_criteria, reward_points, is_active) VALUES
('Regular Customer',
'Complete 10 service bookings',
'consistency',
'customer',
'{"bookings_completed": 10}'::jsonb,
500,
true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO achievements (name, description, category, achievement_type, unlock_criteria, reward_points, is_active) VALUES
('Loyal Patron',
'Complete 50 service bookings',
'excellence',
'customer',
'{"bookings_completed": 50}'::jsonb,
2000,
true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO achievements (name, description, category, achievement_type, unlock_criteria, reward_points, is_active) VALUES
('Review Master',
'Leave 25 helpful reviews',
'community',
'customer',
'{"reviews_given": 25}'::jsonb,
750,
true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO achievements (name, description, category, achievement_type, unlock_criteria, reward_points, is_active) VALUES
('Big Spender',
'Spend ₹50,000 on services',
'special',
'customer',
'{"total_spent": 50000}'::jsonb,
3000,
true)
ON CONFLICT (name) DO NOTHING;

-- Helper Achievements
INSERT INTO achievements (name, description, category, achievement_type, unlock_criteria, reward_points, is_active) VALUES
('First Job Completed',
'Successfully complete your first job',
'performance',
'helper',
'{"jobs_completed": 1}'::jsonb,
150,
true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO achievements (name, description, category, achievement_type, unlock_criteria, reward_points, is_active) VALUES
('Rising Star Helper',
'Complete 25 jobs with 4+ star rating',
'performance',
'helper',
'{"jobs_completed": 25, "min_avg_rating": 4.0}'::jsonb,
800,
true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO achievements (name, description, category, achievement_type, unlock_criteria, reward_points, is_active) VALUES
('Top Performer',
'Complete 100 jobs',
'excellence',
'helper',
'{"jobs_completed": 100}'::jsonb,
2500,
true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO achievements (name, description, category, achievement_type, unlock_criteria, reward_points, is_active) VALUES
('Perfect Record',
'Maintain 5-star rating for 20 consecutive jobs',
'excellence',
'helper',
'{"consecutive_5star_jobs": 20}'::jsonb,
5000,
true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO achievements (name, description, category, achievement_type, unlock_criteria, reward_points, is_active) VALUES
('Early Bird Helper',
'Complete 30 jobs before 10 AM',
'consistency',
'helper',
'{"early_morning_jobs": 30}'::jsonb,
1000,
true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO achievements (name, description, category, achievement_type, unlock_criteria, reward_points, is_active) VALUES
('Weekend Warrior Pro',
'Complete 50 weekend jobs',
'consistency',
'helper',
'{"weekend_jobs": 50}'::jsonb,
1200,
true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO achievements (name, description, category, achievement_type, unlock_criteria, reward_points, is_active) VALUES
('Community Hero Helper',
'Help 100 different customers',
'community',
'helper',
'{"unique_customers": 100}'::jsonb,
3000,
true)
ON CONFLICT (name) DO NOTHING;

-- Universal Achievements
INSERT INTO achievements (name, description, category, achievement_type, unlock_criteria, reward_points, is_active) VALUES
('Referral Champion',
'Successfully refer 10 users to the platform',
'community',
'both',
'{"referrals_completed": 10}'::jsonb,
2000,
true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO achievements (name, description, category, achievement_type, unlock_criteria, reward_points, is_active) VALUES
('Social Butterfly',
'Share 20 service experiences on social media',
'community',
'both',
'{"social_shares": 20}'::jsonb,
600,
true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO achievements (name, description, category, achievement_type, unlock_criteria, reward_points, is_active) VALUES
('Platform VIP',
'Use platform for 365 consecutive days',
'special',
'both',
'{"consecutive_days": 365}'::jsonb,
10000,
true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- ADDITIONAL BADGE DEFINITIONS (adds to existing defaults)
-- ============================================================================

-- Customer Badges
INSERT INTO badge_definitions (name, description, icon_url, badge_type, requirement_type, requirement_value, rarity, points_value, is_active) VALUES
('Bronze Member',
'Complete 5 bookings',
'/badges/bronze-member.svg',
'customer',
'jobs_completed',
5,
'common',
50,
true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO badge_definitions (name, description, icon_url, badge_type, requirement_type, requirement_value, rarity, points_value, is_active) VALUES
('Silver Member',
'Complete 20 bookings',
'/badges/silver-member.svg',
'customer',
'jobs_completed',
20,
'rare',
200,
true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO badge_definitions (name, description, icon_url, badge_type, requirement_type, requirement_value, rarity, points_value, is_active) VALUES
('Gold Member',
'Complete 50 bookings',
'/badges/gold-member.svg',
'customer',
'jobs_completed',
50,
'epic',
500,
true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO badge_definitions (name, description, icon_url, badge_type, requirement_type, requirement_value, rarity, points_value, is_active) VALUES
('Platinum Member',
'Complete 100 bookings',
'/badges/platinum-member.svg',
'customer',
'jobs_completed',
100,
'legendary',
1500,
true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO badge_definitions (name, description, icon_url, badge_type, requirement_type, requirement_value, rarity, points_value, is_active) VALUES
('Super Reviewer',
'Maintain 100 helpful reviews',
'/badges/super-reviewer.svg',
'customer',
'rating_threshold',
100,
'epic',
800,
true)
ON CONFLICT (name) DO NOTHING;

-- Helper Badges
INSERT INTO badge_definitions (name, description, icon_url, badge_type, requirement_type, requirement_value, rarity, points_value, is_active) VALUES
('Rookie Helper',
'Complete 10 jobs',
'/badges/rookie-helper.svg',
'helper',
'jobs_completed',
10,
'common',
100,
true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO badge_definitions (name, description, icon_url, badge_type, requirement_type, requirement_value, rarity, points_value, is_active) VALUES
('Pro Helper Badge',
'Complete 50 jobs',
'/badges/pro-helper-badge.svg',
'helper',
'jobs_completed',
50,
'rare',
400,
true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO badge_definitions (name, description, icon_url, badge_type, requirement_type, requirement_value, rarity, points_value, is_active) VALUES
('Elite Helper',
'Complete 150 jobs',
'/badges/elite-helper.svg',
'helper',
'jobs_completed',
150,
'epic',
1000,
true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO badge_definitions (name, description, icon_url, badge_type, requirement_type, requirement_value, rarity, points_value, is_active) VALUES
('Master Helper',
'Complete 300 jobs',
'/badges/master-helper.svg',
'helper',
'jobs_completed',
300,
'legendary',
3000,
true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO badge_definitions (name, description, icon_url, badge_type, requirement_type, requirement_value, rarity, points_value, is_active) VALUES
('5-Star Specialist',
'Maintain 4.8+ average rating',
'/badges/5star-specialist.svg',
'helper',
'rating_threshold',
48,
'epic',
1200,
true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO badge_definitions (name, description, icon_url, badge_type, requirement_type, requirement_value, rarity, points_value, is_active) VALUES
('Top Earner Badge',
'Earn ₹100,000 total',
'/badges/top-earner-badge.svg',
'helper',
'earnings_milestone',
100000,
'legendary',
2500,
true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO badge_definitions (name, description, icon_url, badge_type, requirement_type, requirement_value, rarity, points_value, is_active) VALUES
('Certified Specialist',
'Complete verification and specialization',
'/badges/certified-specialist.svg',
'helper',
'specialization_verified',
1,
'rare',
600,
true)
ON CONFLICT (name) DO NOTHING;

-- Universal Badges
INSERT INTO badge_definitions (name, description, icon_url, badge_type, requirement_type, requirement_value, rarity, points_value, is_active) VALUES
('Referral King',
'Successfully refer 15 users',
'/badges/referral-king.svg',
'both',
'referrals',
15,
'epic',
1000,
true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO badge_definitions (name, description, icon_url, badge_type, requirement_type, requirement_value, rarity, points_value, is_active) VALUES
('Daily Streak Master',
'Use platform for 30 consecutive days',
'/badges/streak-master.svg',
'both',
'consecutive_days',
30,
'rare',
500,
true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO badge_definitions (name, description, icon_url, badge_type, requirement_type, requirement_value, rarity, points_value, is_active) VALUES
('Community Champion Badge',
'Active for 365 days',
'/badges/community-champion-badge.svg',
'both',
'consecutive_days',
365,
'legendary',
5000,
true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- 
-- PROMO CODES (10 total):
--   - WELCOME50: ₹50 off for new users (90 days validity)
--   - FIRST100: ₹100 off on first booking min ₹500 (180 days)
--   - SAVE20: 20% off max ₹200 (60 days, up to 3 uses)
--   - WEEKEND150: ₹150 weekend special (30 days, 2 uses)
--   - MEGA30: 30% off on ₹1000+ orders (45 days, 2 uses)
--   - REFER200: ₹200 referral bonus (365 days, 1 use)
--   - BUNDLE15: 15% extra on bundles (90 days, 5 uses)
--   - FESTIVE25: 25% festive offer (20 days, 3 uses)
--   - HELPER50: ₹50 for new helpers (180 days)
--   - LOYAL10: 10% loyalty reward (365 days, 10 uses)
--
-- SEASONAL CAMPAIGNS (8 total):
--   - New Year Mega Sale 2026 (35% off, Jan 1-15)
--   - Summer Service Special (25% off, 90 days)
--   - Monsoon Maintenance Offer (20% off, 90 days)
--   - 24-Hour Flash Sale (40% off, 1 day)
--   - Diwali Festival Bonanza (30% off, 15 days)
--   - Winter Wonderland Services (₹300 flat, 90 days)
--   - Welcome New Users (35% off, new users only)
--   - We Miss You - Come Back Offer (30% off, inactive users)
--
-- ACHIEVEMENTS (15 additional):
--   Customer: First Booking (100pts), Regular Customer (500pts), Loyal Patron (2000pts), Review Master (750pts), Big Spender (3000pts)
--   Helper: First Job (150pts), Rising Star (800pts), Top Performer (2500pts), Perfect Record (5000pts), Early Bird (1000pts), Weekend Warrior (1200pts), Community Hero (3000pts)
--   Universal: Referral Champion (2000pts), Social Butterfly (600pts), Platform VIP (10000pts)
--
-- BADGE DEFINITIONS (15 additional):
--   Customer: Bronze/Silver/Gold/Platinum Member, Super Reviewer
--   Helper: Rookie/Pro/Elite/Master Helper, 5-Star Specialist, Top Earner, Certified Specialist
--   Universal: Referral King, Daily Streak Master, Community Champion
--
-- Point Values Range: 50 - 10,000 points
-- Rarity Levels: Common, Rare, Epic, Legendary
-- Uses ON CONFLICT DO NOTHING to prevent duplicates with existing default data
