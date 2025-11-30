-- =====================================================
-- HELPARO SERVICES - ROW LEVEL SECURITY POLICIES
-- Complete RLS policies for all tables
-- Generated: November 30, 2025
-- =====================================================

-- =====================================================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helper_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helper_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helper_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helper_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helper_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helper_rating_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helper_trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helper_subscriptions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_insurance ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.request_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_photos ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrows ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.wallet_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.background_check_results ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.seasonal_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_applicable_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_redemptions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_feature_overrides ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_prefs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_configurations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofence_violations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.video_call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_analytics ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.work_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_earnings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.surge_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. PROFILES TABLE POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Public can view basic helper info (for searching)
CREATE POLICY "Public can view helper basic info"
ON public.profiles FOR SELECT
USING (role = 'helper' AND is_verified = true);

-- =====================================================
-- 3. HELPER PROFILES POLICIES
-- =====================================================

-- Helpers can view their own profile
CREATE POLICY "Helpers can view own profile"
ON public.helper_profiles FOR SELECT
USING (auth.uid() = user_id);

-- Helpers can update their own profile
CREATE POLICY "Helpers can update own profile"
ON public.helper_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Helpers can insert their own profile
CREATE POLICY "Helpers can create own profile"
ON public.helper_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Customers can view approved helpers
CREATE POLICY "Customers can view approved helpers"
ON public.helper_profiles FOR SELECT
USING (is_approved = true);

-- Admins can view all helper profiles
CREATE POLICY "Admins can view all helper profiles"
ON public.helper_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admins can update all helper profiles
CREATE POLICY "Admins can update all helper profiles"
ON public.helper_profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 4. HELPER BANK ACCOUNTS POLICIES
-- =====================================================

-- Helpers can view their own bank accounts
CREATE POLICY "Helpers can view own bank accounts"
ON public.helper_bank_accounts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND id = helper_id
  )
);

-- Helpers can insert their own bank accounts
CREATE POLICY "Helpers can create own bank accounts"
ON public.helper_bank_accounts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND id = helper_id
  )
);

-- Helpers can update their own bank accounts
CREATE POLICY "Helpers can update own bank accounts"
ON public.helper_bank_accounts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND id = helper_id
  )
);

-- Admins can view all bank accounts
CREATE POLICY "Admins can view all bank accounts"
ON public.helper_bank_accounts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 5. SERVICE CATEGORIES POLICIES (PUBLIC READ)
-- =====================================================

-- Anyone can view active categories
CREATE POLICY "Anyone can view active categories"
ON public.service_categories FOR SELECT
USING (is_active = true);

-- Admins can manage categories
CREATE POLICY "Admins can manage categories"
ON public.service_categories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 6. SERVICE REQUESTS POLICIES
-- =====================================================

-- Customers can view their own requests
CREATE POLICY "Customers can view own requests"
ON public.service_requests FOR SELECT
USING (auth.uid() = customer_id);

-- Customers can create requests
CREATE POLICY "Customers can create requests"
ON public.service_requests FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Customers can update their own requests
CREATE POLICY "Customers can update own requests"
ON public.service_requests FOR UPDATE
USING (auth.uid() = customer_id);

-- Helpers can view assigned requests
CREATE POLICY "Helpers can view assigned requests"
ON public.service_requests FOR SELECT
USING (auth.uid() = assigned_helper_id);

-- Helpers can view open requests (for bidding)
CREATE POLICY "Helpers can view open requests"
ON public.service_requests FOR SELECT
USING (
  status IN ('open', 'pending') AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'helper'
  )
);

-- Helpers can update assigned requests
CREATE POLICY "Helpers can update assigned requests"
ON public.service_requests FOR UPDATE
USING (auth.uid() = assigned_helper_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all requests"
ON public.service_requests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 7. REQUEST APPLICATIONS POLICIES
-- =====================================================

-- Helpers can view their own applications
CREATE POLICY "Helpers can view own applications"
ON public.request_applications FOR SELECT
USING (auth.uid() = helper_id);

-- Helpers can create applications
CREATE POLICY "Helpers can create applications"
ON public.request_applications FOR INSERT
WITH CHECK (auth.uid() = helper_id);

-- Customers can view applications on their requests
CREATE POLICY "Customers can view request applications"
ON public.request_applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.service_requests
    WHERE id = request_id AND customer_id = auth.uid()
  )
);

-- Customers can update application status
CREATE POLICY "Customers can update applications"
ON public.request_applications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.service_requests
    WHERE id = request_id AND customer_id = auth.uid()
  )
);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
ON public.request_applications FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 8. MESSAGES POLICIES
-- =====================================================

-- Users can view messages in their requests
CREATE POLICY "Users can view request messages"
ON public.messages FOR SELECT
USING (
  auth.uid() = sender_id OR
  EXISTS (
    SELECT 1 FROM public.service_requests
    WHERE id = request_id AND (customer_id = auth.uid() OR assigned_helper_id = auth.uid())
  )
);

-- Users can send messages in their requests
CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.service_requests
    WHERE id = request_id AND (customer_id = auth.uid() OR assigned_helper_id = auth.uid())
  )
);

-- Users can update their own messages
CREATE POLICY "Users can update own messages"
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id);

-- =====================================================
-- 9. REVIEWS POLICIES
-- =====================================================

-- Users can view reviews about them
CREATE POLICY "Users can view reviews about them"
ON public.reviews FOR SELECT
USING (auth.uid() = reviewee_id OR auth.uid() = reviewer_id);

-- Users can create reviews
CREATE POLICY "Users can create reviews"
ON public.reviews FOR INSERT
WITH CHECK (
  auth.uid() = reviewer_id AND
  EXISTS (
    SELECT 1 FROM public.service_requests
    WHERE id = request_id AND (customer_id = auth.uid() OR assigned_helper_id = auth.uid())
  )
);

-- Public can view helper reviews (for ratings)
CREATE POLICY "Public can view helper reviews"
ON public.reviews FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = reviewee_id AND role = 'helper'
  )
);

-- =====================================================
-- 10. PAYMENT ORDERS POLICIES
-- =====================================================

-- Customers can view their own payments
CREATE POLICY "Customers can view own payments"
ON public.payment_orders FOR SELECT
USING (auth.uid() = customer_id);

-- Helpers can view their payments
CREATE POLICY "Helpers can view own payments"
ON public.payment_orders FOR SELECT
USING (auth.uid() = helper_id);

-- Customers can create payment orders
CREATE POLICY "Customers can create payments"
ON public.payment_orders FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- System can update payment orders (via service role)
-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
ON public.payment_orders FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 11. WALLET ACCOUNTS POLICIES
-- =====================================================

-- Users can view their own wallet
CREATE POLICY "Users can view own wallet"
ON public.wallet_accounts FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own wallet (via triggers)
CREATE POLICY "Users can update own wallet"
ON public.wallet_accounts FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all wallets
CREATE POLICY "Admins can view all wallets"
ON public.wallet_accounts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 12. WITHDRAWAL REQUESTS POLICIES
-- =====================================================

-- Helpers can view their own withdrawals
CREATE POLICY "Helpers can view own withdrawals"
ON public.withdrawal_requests FOR SELECT
USING (auth.uid() = helper_id);

-- Helpers can create withdrawal requests
CREATE POLICY "Helpers can create withdrawals"
ON public.withdrawal_requests FOR INSERT
WITH CHECK (auth.uid() = helper_id);

-- Admins can view and manage all withdrawals
CREATE POLICY "Admins can manage all withdrawals"
ON public.withdrawal_requests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 13. VERIFICATION DOCUMENTS POLICIES
-- =====================================================

-- Helpers can view their own documents
CREATE POLICY "Helpers can view own documents"
ON public.verification_documents FOR SELECT
USING (auth.uid() = helper_id);

-- Helpers can insert their own documents
CREATE POLICY "Helpers can upload documents"
ON public.verification_documents FOR INSERT
WITH CHECK (auth.uid() = helper_id);

-- Helpers can update their own documents
CREATE POLICY "Helpers can update own documents"
ON public.verification_documents FOR UPDATE
USING (auth.uid() = helper_id);

-- Admins can view all documents
CREATE POLICY "Admins can view all documents"
ON public.verification_documents FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 14. NOTIFICATIONS POLICIES
-- =====================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert notifications (via service role)
-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
ON public.notifications FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 15. SUPPORT TICKETS POLICIES
-- =====================================================

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
ON public.support_tickets FOR SELECT
USING (auth.uid() = user_id);

-- Users can create tickets
CREATE POLICY "Users can create tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own tickets
CREATE POLICY "Users can update own tickets"
ON public.support_tickets FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all tickets
CREATE POLICY "Admins can manage all tickets"
ON public.support_tickets FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 16. SOS ALERTS POLICIES
-- =====================================================

-- Users can view their own SOS alerts
CREATE POLICY "Users can view own SOS alerts"
ON public.sos_alerts FOR SELECT
USING (auth.uid() = user_id);

-- Users can create SOS alerts
CREATE POLICY "Users can create SOS alerts"
ON public.sos_alerts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view and manage all SOS alerts
CREATE POLICY "Admins can manage all SOS alerts"
ON public.sos_alerts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 17. LOYALTY POINTS POLICIES
-- =====================================================

-- Users can view their own loyalty points
CREATE POLICY "Users can view own loyalty points"
ON public.loyalty_points FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage loyalty points
CREATE POLICY "Admins can manage loyalty points"
ON public.loyalty_points FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 18. PROMO CODES POLICIES
-- =====================================================

-- Anyone can view active promo codes
CREATE POLICY "Users can view active promo codes"
ON public.promo_codes FOR SELECT
USING (is_active = true AND CURRENT_DATE BETWEEN start_date AND end_date);

-- Admins can manage promo codes
CREATE POLICY "Admins can manage promo codes"
ON public.promo_codes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 19. SUBSCRIPTION PLANS POLICIES (PUBLIC READ)
-- =====================================================

-- Anyone can view active subscription plans
CREATE POLICY "Anyone can view active plans"
ON public.subscription_plans FOR SELECT
USING (is_active = true);

-- Admins can manage subscription plans
CREATE POLICY "Admins can manage plans"
ON public.subscription_plans FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 20. CUSTOMER/HELPER SUBSCRIPTIONS POLICIES
-- =====================================================

-- Users can view their own subscriptions
CREATE POLICY "Customers can view own subscriptions"
ON public.customer_subscriptions FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Helpers can view own subscriptions"
ON public.helper_subscriptions FOR SELECT
USING (auth.uid() = helper_id);

-- Users can create their own subscriptions
CREATE POLICY "Customers can create subscriptions"
ON public.customer_subscriptions FOR INSERT
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Helpers can create subscriptions"
ON public.helper_subscriptions FOR INSERT
WITH CHECK (auth.uid() = helper_id);

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage customer subscriptions"
ON public.customer_subscriptions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage helper subscriptions"
ON public.helper_subscriptions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 21. SERVICE AREAS POLICIES (PUBLIC READ)
-- =====================================================

-- Anyone can view active service areas
CREATE POLICY "Anyone can view active service areas"
ON public.service_areas FOR SELECT
USING (is_active = true);

-- Admins can manage service areas
CREATE POLICY "Admins can manage service areas"
ON public.service_areas FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 22. READ-ONLY STATISTICS TABLES POLICIES
-- =====================================================

-- Helpers can view their own statistics
CREATE POLICY "Helpers can view own statistics"
ON public.helper_statistics FOR SELECT
USING (auth.uid() = helper_id);

CREATE POLICY "Helpers can view own ratings"
ON public.helper_rating_summary FOR SELECT
USING (auth.uid() = helper_id);

CREATE POLICY "Helpers can view own trust score"
ON public.helper_trust_scores FOR SELECT
USING (auth.uid() = helper_id);

-- Public can view helper statistics (for searching)
CREATE POLICY "Public can view helper statistics"
ON public.helper_statistics FOR SELECT
USING (true);

CREATE POLICY "Public can view helper ratings"
ON public.helper_rating_summary FOR SELECT
USING (true);

CREATE POLICY "Public can view helper trust scores"
ON public.helper_trust_scores FOR SELECT
USING (true);

-- =====================================================
-- 23. ADMIN-ONLY TABLES POLICIES
-- =====================================================

-- Only admins can access system settings
CREATE POLICY "Only admins can access system settings"
ON public.system_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can access commission settings"
ON public.commission_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can access surge pricing"
ON public.surge_pricing_rules FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 24. REFERRALS POLICIES
-- =====================================================

-- Users can view their own referrals
CREATE POLICY "Users can view own referrals"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

-- Users can create referrals
CREATE POLICY "Users can create referrals"
ON public.referrals FOR INSERT
WITH CHECK (auth.uid() = referrer_id);

-- =====================================================
-- 25. VIDEO CALLS POLICIES
-- =====================================================

-- Users can view their own video call sessions
CREATE POLICY "Users can view own video sessions"
ON public.video_call_sessions FOR SELECT
USING (
  auth.uid() = customer_id OR 
  auth.uid() = helper_id
);

-- Users can create video call sessions
CREATE POLICY "Users can create video sessions"
ON public.video_call_sessions FOR INSERT
WITH CHECK (
  auth.uid() = customer_id OR 
  auth.uid() = helper_id
);

-- Users can update their own sessions
CREATE POLICY "Users can update own video sessions"
ON public.video_call_sessions FOR UPDATE
USING (
  auth.uid() = customer_id OR 
  auth.uid() = helper_id
);

-- =====================================================
-- 26. REMAINING TABLES - BASIC POLICIES
-- =====================================================

-- Helper Services
CREATE POLICY "Helpers can manage own services"
ON public.helper_services FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND id = helper_id
  )
);

CREATE POLICY "Public can view helper services"
ON public.helper_services FOR SELECT
USING (is_available = true);

-- Bid History
CREATE POLICY "Users can view bid history on their applications"
ON public.bid_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.request_applications
    WHERE id = application_id AND helper_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.request_applications ra
    JOIN public.service_requests sr ON ra.request_id = sr.id
    WHERE ra.id = application_id AND sr.customer_id = auth.uid()
  )
);

-- Work Proofs
CREATE POLICY "Helpers can manage own work proofs"
ON public.work_proofs FOR ALL
USING (auth.uid() = uploaded_by);

CREATE POLICY "Customers can view work proofs on their requests"
ON public.work_proofs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.service_requests
    WHERE id = request_id AND customer_id = auth.uid()
  )
);

-- Job Earnings
CREATE POLICY "Helpers can view own earnings"
ON public.job_earnings FOR SELECT
USING (auth.uid() = helper_id);

-- Device Tokens
CREATE POLICY "Users can manage own device tokens"
ON public.device_tokens FOR ALL
USING (auth.uid() = user_id);

-- User Sessions
CREATE POLICY "Users can view own sessions"
ON public.user_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can revoke own sessions"
ON public.user_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- Legal Documents (Public Read)
CREATE POLICY "Anyone can view active legal documents"
ON public.legal_documents FOR SELECT
USING (is_active = true);

-- Legal Acceptances
CREATE POLICY "Users can view own legal acceptances"
ON public.legal_acceptances FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create legal acceptances"
ON public.legal_acceptances FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Typing Indicators
CREATE POLICY "Users can manage typing in their requests"
ON public.typing_indicators FOR ALL
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.service_requests
    WHERE id = request_id AND (customer_id = auth.uid() OR assigned_helper_id = auth.uid())
  )
);

-- User Notification Preferences
CREATE POLICY "Users can manage own notification prefs"
ON public.user_notification_prefs FOR ALL
USING (auth.uid() = user_id);

-- Bundle Purchases
CREATE POLICY "Customers can view own bundle purchases"
ON public.bundle_purchases FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create bundle purchases"
ON public.bundle_purchases FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Campaigns (Public Read)
CREATE POLICY "Anyone can view active campaigns"
ON public.seasonal_campaigns FOR SELECT
USING (is_active = true AND CURRENT_TIMESTAMP BETWEEN start_date AND end_date);

-- Service Bundles (Public Read)
CREATE POLICY "Anyone can view active bundles"
ON public.service_bundles FOR SELECT
USING (is_active = true);

-- Badge Definitions (Public Read)
CREATE POLICY "Anyone can view active badges"
ON public.badge_definitions FOR SELECT
USING (is_active = true);

-- Achievements (Public Read)
CREATE POLICY "Anyone can view active achievements"
ON public.achievements FOR SELECT
USING (is_active = true);

-- User Badges
CREATE POLICY "Users can view own badges"
ON public.user_badges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Public can view displayed badges"
ON public.user_badges FOR SELECT
USING (is_displayed = true);

-- User Achievements
CREATE POLICY "Users can view own achievements"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

-- =====================================================
-- 27. PAYMENT WEBHOOKS (SERVICE ROLE ONLY)
-- =====================================================

-- Payment webhooks should only be accessed by service role
-- No public policies - handled by backend

-- =====================================================
-- 28. ESCROWS (SYSTEM MANAGED)
-- =====================================================

-- Customers can view escrows for their requests
CREATE POLICY "Customers can view own escrows"
ON public.escrows FOR SELECT
USING (auth.uid() = customer_id);

-- Helpers can view escrows for their jobs
CREATE POLICY "Helpers can view assigned escrows"
ON public.escrows FOR SELECT
USING (auth.uid() = helper_id);

-- =====================================================
-- 29. LEDGER ENTRIES (READ-ONLY FOR USERS)
-- =====================================================

-- Users can view their own ledger entries
CREATE POLICY "Users can view own ledger entries"
ON public.ledger_entries FOR SELECT
USING (auth.uid() = account_user_id);

-- =====================================================
-- 30. BACKGROUND CHECK RESULTS
-- =====================================================

-- Helpers can view their own background checks
CREATE POLICY "Helpers can view own background checks"
ON public.background_check_results FOR SELECT
USING (auth.uid() = helper_id);

-- Admins can manage all background checks
CREATE POLICY "Admins can manage background checks"
ON public.background_check_results FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- END OF RLS POLICIES
-- =====================================================

-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
