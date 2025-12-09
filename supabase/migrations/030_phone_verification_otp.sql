-- ============================================
-- PHONE VERIFICATION OTP SYSTEM
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing table if needed for fresh start
DROP TABLE IF EXISTS public.phone_verifications CASCADE;
DROP TABLE IF EXISTS public.otp_rate_limits CASCADE;

-- ============================================
-- Add phone_verified columns to profiles table
-- ============================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- Table 1: phone_verifications - Store OTPs
-- ============================================
CREATE TABLE public.phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  country_code VARCHAR(5) NOT NULL DEFAULT '+91',
  otp_code VARCHAR(6) NOT NULL,
  otp_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_phone_verifications_phone ON public.phone_verifications(phone);
CREATE INDEX idx_phone_verifications_user ON public.phone_verifications(user_id);
CREATE INDEX idx_phone_verifications_expires ON public.phone_verifications(otp_expires_at);

-- ============================================
-- Table 2: otp_rate_limits - Prevent abuse
-- ============================================
CREATE TABLE public.otp_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier VARCHAR(50) NOT NULL,
  identifier_type VARCHAR(10) NOT NULL DEFAULT 'phone',
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_rate_limit UNIQUE (identifier, identifier_type)
);

-- Index for rate limit checks
CREATE INDEX idx_otp_rate_limits_identifier ON public.otp_rate_limits(identifier, identifier_type);

-- ============================================
-- Enable RLS
-- ============================================
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for phone_verifications
-- ============================================
-- Users can only see their own verifications
CREATE POLICY "Users can view own verifications"
  ON public.phone_verifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own verifications
CREATE POLICY "Users can insert own verifications"
  ON public.phone_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own verifications
CREATE POLICY "Users can update own verifications"
  ON public.phone_verifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can do everything (for API routes)
CREATE POLICY "Service role full access verifications"
  ON public.phone_verifications FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- RLS Policies for otp_rate_limits
-- ============================================
-- Only service role can access rate limits
CREATE POLICY "Service role full access rate_limits"
  ON public.otp_rate_limits FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- Function: Check if phone already exists
-- ============================================
CREATE OR REPLACE FUNCTION public.check_phone_exists(
  p_phone VARCHAR,
  p_exclude_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_exclude_user_id IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE phone = p_phone AND id != p_exclude_user_id
    );
  ELSE
    RETURN EXISTS (
      SELECT 1 FROM public.profiles WHERE phone = p_phone
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function: Check rate limit
-- Returns: 'allowed', 'rate_limited', or 'blocked'
-- ============================================
CREATE OR REPLACE FUNCTION public.check_otp_rate_limit(
  p_identifier VARCHAR,
  p_identifier_type VARCHAR DEFAULT 'phone',
  p_max_requests INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15,
  p_block_minutes INTEGER DEFAULT 60
)
RETURNS TABLE(
  status VARCHAR,
  remaining_requests INTEGER,
  reset_at TIMESTAMP WITH TIME ZONE,
  blocked_until TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_rate_limit RECORD;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Get existing rate limit record
  SELECT * INTO v_rate_limit
  FROM public.otp_rate_limits
  WHERE identifier = p_identifier AND identifier_type = p_identifier_type;
  
  -- Check if blocked
  IF v_rate_limit IS NOT NULL AND v_rate_limit.blocked_until IS NOT NULL AND v_rate_limit.blocked_until > v_now THEN
    RETURN QUERY SELECT 
      'blocked'::VARCHAR,
      0,
      v_rate_limit.window_start + (p_window_minutes || ' minutes')::INTERVAL,
      v_rate_limit.blocked_until;
    RETURN;
  END IF;
  
  -- Check if window expired (reset counter)
  IF v_rate_limit IS NOT NULL AND v_rate_limit.window_start + (p_window_minutes || ' minutes')::INTERVAL < v_now THEN
    UPDATE public.otp_rate_limits
    SET request_count = 1, window_start = v_now, blocked_until = NULL
    WHERE identifier = p_identifier AND identifier_type = p_identifier_type;
    
    RETURN QUERY SELECT 
      'allowed'::VARCHAR,
      p_max_requests - 1,
      v_now + (p_window_minutes || ' minutes')::INTERVAL,
      NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;
  
  -- Check if rate limited
  IF v_rate_limit IS NOT NULL AND v_rate_limit.request_count >= p_max_requests THEN
    -- Block the user
    UPDATE public.otp_rate_limits
    SET blocked_until = v_now + (p_block_minutes || ' minutes')::INTERVAL
    WHERE identifier = p_identifier AND identifier_type = p_identifier_type;
    
    RETURN QUERY SELECT 
      'rate_limited'::VARCHAR,
      0,
      v_rate_limit.window_start + (p_window_minutes || ' minutes')::INTERVAL,
      v_now + (p_block_minutes || ' minutes')::INTERVAL;
    RETURN;
  END IF;
  
  -- Insert or update counter
  IF v_rate_limit IS NULL THEN
    INSERT INTO public.otp_rate_limits (identifier, identifier_type, request_count, window_start)
    VALUES (p_identifier, p_identifier_type, 1, v_now);
    
    RETURN QUERY SELECT 
      'allowed'::VARCHAR,
      p_max_requests - 1,
      v_now + (p_window_minutes || ' minutes')::INTERVAL,
      NULL::TIMESTAMP WITH TIME ZONE;
  ELSE
    UPDATE public.otp_rate_limits
    SET request_count = request_count + 1
    WHERE identifier = p_identifier AND identifier_type = p_identifier_type;
    
    RETURN QUERY SELECT 
      'allowed'::VARCHAR,
      p_max_requests - v_rate_limit.request_count - 1,
      v_rate_limit.window_start + (p_window_minutes || ' minutes')::INTERVAL,
      NULL::TIMESTAMP WITH TIME ZONE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function: Clean up expired OTPs (run periodically)
-- ============================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.phone_verifications
  WHERE otp_expires_at < NOW() - INTERVAL '1 hour'
    AND verified_at IS NULL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Grant permissions
-- ============================================
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.phone_verifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_phone_exists TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_otp_rate_limit TO authenticated, anon;

-- ============================================
-- Verify setup
-- ============================================
SELECT 'phone_verifications table created' AS status
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'phone_verifications');

SELECT 'otp_rate_limits table created' AS status
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'otp_rate_limits');
