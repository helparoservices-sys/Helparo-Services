-- Fix RLS policies that have infinite recursion by using is_admin() function
-- This migration fixes policies in 999_enable_rls_policies.sql that were causing recursion issues

-- =====================================================
-- 1. PROFILES TABLE - Fix admin policies
-- =====================================================

-- Drop and recreate admin select policy on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Drop and recreate admin update policy on profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 2. HELPER PROFILES TABLE - Fix admin policies
-- =====================================================

-- Drop and recreate admin select policy
DROP POLICY IF EXISTS "Admins can view all helper profiles" ON public.helper_profiles;
CREATE POLICY "Admins can view all helper profiles"
  ON public.helper_profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Drop and recreate admin update policy
DROP POLICY IF EXISTS "Admins can update all helper profiles" ON public.helper_profiles;
CREATE POLICY "Admins can update all helper profiles"
  ON public.helper_profiles FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 3. HELPER BANK ACCOUNTS TABLE - Fix admin policies
-- =====================================================

-- Drop and recreate admin policy (was FOR ALL)
DROP POLICY IF EXISTS "Admins can view all bank accounts" ON public.helper_bank_accounts;
CREATE POLICY "Admins can manage all bank accounts"
  ON public.helper_bank_accounts FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 4. VERIFICATION DOCUMENTS TABLE - Fix admin policies
-- =====================================================

-- Drop and recreate admin policy
DROP POLICY IF EXISTS "Admins can view all documents" ON public.verification_documents;
CREATE POLICY "Admins can manage all documents"
  ON public.verification_documents FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 5. VERIFICATION REVIEWS TABLE - Ensure admin policy uses is_admin()
-- =====================================================

-- Drop and recreate admin policy
DROP POLICY IF EXISTS "Admins manage verification reviews" ON public.verification_reviews;
CREATE POLICY "Admins manage verification reviews"
  ON public.verification_reviews FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 6. NOTIFICATIONS TABLE - Fix admin policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications"
  ON public.notifications FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;
CREATE POLICY "Admins can manage all notifications"
  ON public.notifications FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 7. SERVICE REQUESTS TABLE - Fix admin policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all requests" ON public.service_requests;
CREATE POLICY "Admins can view all requests"
  ON public.service_requests FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update all requests" ON public.service_requests;
CREATE POLICY "Admins can update all requests"
  ON public.service_requests FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 8. SERVICE CATEGORIES TABLE - Fix admin policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage categories" ON public.service_categories;
CREATE POLICY "Admins can manage categories"
  ON public.service_categories FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 9. BOOKINGS TABLE - Fix admin policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
CREATE POLICY "Admins can view all bookings"
  ON public.bookings FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update all bookings" ON public.bookings;
CREATE POLICY "Admins can update all bookings"
  ON public.bookings FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 10. PAYMENTS TABLE - Fix admin policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  USING (public.is_admin(auth.uid()));

-- =====================================================
-- 11. WITHDRAWAL REQUESTS TABLE - Fix admin policies
-- =====================================================

DROP POLICY IF EXISTS "Admins manage all withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Admins manage all withdrawals"
  ON public.withdrawal_requests FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 12. PROMO CODES TABLE - Fix admin policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage promo codes" ON public.promo_codes;
CREATE POLICY "Admins can manage promo codes"
  ON public.promo_codes FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 13. SUPPORT TICKETS TABLE - Fix admin policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
CREATE POLICY "Admins can view all tickets"
  ON public.support_tickets FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update all tickets" ON public.support_tickets;
CREATE POLICY "Admins can update all tickets"
  ON public.support_tickets FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 14. SOS ALERTS TABLE - Fix admin policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all SOS alerts" ON public.sos_alerts;
CREATE POLICY "Admins can view all SOS alerts"
  ON public.sos_alerts FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update all SOS alerts" ON public.sos_alerts;
CREATE POLICY "Admins can update all SOS alerts"
  ON public.sos_alerts FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 15. REFERRAL CODES TABLE - Fix admin policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage all referral codes" ON public.referral_codes;
CREATE POLICY "Admins can manage all referral codes"
  ON public.referral_codes FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 16. SUBSCRIPTIONS TABLE - Fix admin policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins can view all subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins can manage all subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 17. REVIEWS/RATINGS TABLE - Fix admin policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all reviews" ON public.reviews;
CREATE POLICY "Admins can view all reviews"
  ON public.reviews FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update reviews" ON public.reviews;
CREATE POLICY "Admins can update reviews"
  ON public.reviews FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 18. JOB RATINGS TABLE - Fix admin policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all job ratings" ON public.job_ratings;
CREATE POLICY "Admins can view all job ratings"
  ON public.job_ratings FOR SELECT
  USING (public.is_admin(auth.uid()));

-- =====================================================
-- 19. LEGAL DOCUMENTS TABLE - Fix admin policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage legal docs" ON public.legal_documents;
CREATE POLICY "Admins can manage legal docs"
  ON public.legal_documents FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- 20. LEGAL ACCEPTANCES TABLE - Fix admin policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all acceptances" ON public.legal_acceptances;
CREATE POLICY "Admins can view all acceptances"
  ON public.legal_acceptances FOR SELECT
  USING (public.is_admin(auth.uid()));
