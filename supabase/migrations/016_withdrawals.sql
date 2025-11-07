-- Withdrawal & Earnings System
-- Migration 016: Helper earnings tracking, withdrawals, bank accounts, payouts

-- ============================================================================
-- ENUMS
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE withdrawal_status AS ENUM (
    'requested',        -- helper submitted
    'pending_review',   -- queued for admin review
    'approved',         -- approved by admin
    'processing',       -- payout API call initiated
    'paid',             -- funds settled to helper
    'failed',           -- payout failed
    'cancelled'         -- withdrawn/cancelled by helper or admin
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE bank_account_status AS ENUM (
    'pending_verification',
    'verified',
    'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE earning_status AS ENUM (
    'pending',      -- recorded but job not fully confirmed
    'confirmed',    -- ready for withdrawal (funds released)
    'reversed'      -- reversed due to dispute/refund
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE earning_source AS ENUM (
    'service_completion',
    'bonus',
    'adjustment'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- HELPER BANK ACCOUNTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.helper_bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  helper_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_holder_name TEXT NOT NULL,
  account_number TEXT,              -- Ideally encrypted / tokenized
  ifsc_code VARCHAR(20),
  bank_name TEXT,
  branch_name TEXT,
  upi_id VARCHAR(100),              -- Alternative payout route
  is_primary BOOLEAN DEFAULT FALSE,
  status bank_account_status NOT NULL DEFAULT 'pending_verification',
  rejected_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_helper_bank_accounts_helper
  ON public.helper_bank_accounts(helper_id);

DROP TRIGGER IF EXISTS trg_update_helper_bank_accounts ON public.helper_bank_accounts;
CREATE TRIGGER trg_update_helper_bank_accounts
  BEFORE UPDATE ON public.helper_bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.helper_bank_accounts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- JOB EARNINGS (Per completed job, pre-commission + net)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.job_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  helper_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  gross_amount_paise INTEGER NOT NULL,      -- total amount before commission/refunds
  commission_paise INTEGER NOT NULL,        -- platform commission retained
  net_amount_paise INTEGER NOT NULL,        -- amount added to helper available balance
  source earning_source NOT NULL DEFAULT 'service_completion',
  status earning_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_job_earnings_helper
  ON public.job_earnings(helper_id);

CREATE INDEX IF NOT EXISTS idx_job_earnings_request
  ON public.job_earnings(request_id);

ALTER TABLE public.job_earnings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- WITHDRAWAL REQUESTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  helper_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_paise INTEGER NOT NULL,
  status withdrawal_status NOT NULL DEFAULT 'requested',
  bank_account_id UUID REFERENCES public.helper_bank_accounts(id),
  payout_mode TEXT CHECK (payout_mode IN ('bank_transfer','upi')),
  target_identifier TEXT,                 -- account number masked or UPI id
  requested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  failed_reason TEXT,
  notes TEXT,
  payout_reference TEXT,                  -- Cashfree payout ID / reference
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_helper
  ON public.withdrawal_requests(helper_id);

CREATE INDEX IF NOT EXISTS idx_withdrawal_status
  ON public.withdrawal_requests(status);

DROP TRIGGER IF EXISTS trg_update_withdrawal_requests ON public.withdrawal_requests;
CREATE TRIGGER trg_update_withdrawal_requests
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PAYOUT TRANSACTIONS (integration with Cashfree Payouts API)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payout_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  withdrawal_id UUID NOT NULL REFERENCES public.withdrawal_requests(id) ON DELETE CASCADE,
  helper_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cashfree_payout_id TEXT,            -- ID returned by Cashfree
  status TEXT CHECK (status IN ('initiated','success','failed')) NOT NULL DEFAULT 'initiated',
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ,
  failure_reason TEXT,
  raw_response JSONB,                 -- store trimmed Cashfree API response
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payout_tx_withdrawal
  ON public.payout_transactions(withdrawal_id);

ALTER TABLE public.payout_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
-- Helper can manage own bank accounts
DROP POLICY IF EXISTS "Helpers insert bank accounts" ON public.helper_bank_accounts;
CREATE POLICY "Helpers insert bank accounts" ON public.helper_bank_accounts
  FOR INSERT WITH CHECK (helper_id = auth.uid());

DROP POLICY IF EXISTS "Helpers view own bank accounts" ON public.helper_bank_accounts;
CREATE POLICY "Helpers view own bank accounts" ON public.helper_bank_accounts
  FOR SELECT USING (helper_id = auth.uid());

DROP POLICY IF EXISTS "Helpers update own pending bank accounts" ON public.helper_bank_accounts;
CREATE POLICY "Helpers update own pending bank accounts" ON public.helper_bank_accounts
  FOR UPDATE USING (helper_id = auth.uid() AND status = 'pending_verification');

-- Admin bank account visibility & updates
DROP POLICY IF EXISTS "Admins view all bank accounts" ON public.helper_bank_accounts;
CREATE POLICY "Admins view all bank accounts" ON public.helper_bank_accounts
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update bank accounts" ON public.helper_bank_accounts;
CREATE POLICY "Admins update bank accounts" ON public.helper_bank_accounts
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- Job earnings visibility: helper & admins
DROP POLICY IF EXISTS "Helpers view own earnings" ON public.job_earnings;
CREATE POLICY "Helpers view own earnings" ON public.job_earnings
  FOR SELECT USING (helper_id = auth.uid());

DROP POLICY IF EXISTS "Admins view all earnings" ON public.job_earnings;
CREATE POLICY "Admins view all earnings" ON public.job_earnings
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Withdrawal requests policies
DROP POLICY IF EXISTS "Helpers request withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Helpers request withdrawals" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (helper_id = auth.uid());

DROP POLICY IF EXISTS "Helpers view own withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Helpers view own withdrawals" ON public.withdrawal_requests
  FOR SELECT USING (helper_id = auth.uid());

DROP POLICY IF EXISTS "Helpers cancel own requested withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Helpers cancel own requested withdrawals" ON public.withdrawal_requests
  FOR UPDATE USING (helper_id = auth.uid() AND status IN ('requested','pending_review'));

DROP POLICY IF EXISTS "Admins view all withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Admins view all withdrawals" ON public.withdrawal_requests
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Admins update withdrawals" ON public.withdrawal_requests
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- Payout transactions visibility
DROP POLICY IF EXISTS "Helpers view own payouts" ON public.payout_transactions;
CREATE POLICY "Helpers view own payouts" ON public.payout_transactions
  FOR SELECT USING (helper_id = auth.uid());

DROP POLICY IF EXISTS "Admins view all payouts" ON public.payout_transactions;
CREATE POLICY "Admins view all payouts" ON public.payout_transactions
  FOR SELECT USING (public.is_admin(auth.uid()));

-- ============================================================================
-- FUNCTIONS
-- ============================================================================
-- Record job earning (called when job completed & escrow released)
CREATE OR REPLACE FUNCTION public.record_job_earning(
  p_request_id UUID,
  p_gross_rupees DECIMAL(10,2),
  p_commission_percent DECIMAL(5,2) DEFAULT NULL,
  p_source earning_source DEFAULT 'service_completion',
  p_notes TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_helper_id UUID;
  v_commission_percent DECIMAL(5,2);
  v_gross_paise INTEGER;
  v_commission_paise INTEGER;
  v_net_paise INTEGER;
  v_earning_id UUID;
BEGIN
  -- Identify helper from service request
  SELECT assigned_helper_id INTO v_helper_id
  FROM public.service_requests
  WHERE id = p_request_id;

  IF v_helper_id IS NULL THEN
    RAISE EXCEPTION 'Service request has no assigned helper';
  END IF;

  -- Determine commission percent (fallback to settings function if not provided)
  v_commission_percent := COALESCE(p_commission_percent, public.get_commission_percent());

  v_gross_paise := (p_gross_rupees * 100)::INTEGER;
  v_commission_paise := ROUND(v_gross_paise * (v_commission_percent / 100.0))::INTEGER;
  v_net_paise := v_gross_paise - v_commission_paise;

  INSERT INTO public.job_earnings (
    request_id, helper_id, gross_amount_paise, commission_paise, net_amount_paise, source, status, notes
  ) VALUES (
    p_request_id, v_helper_id, v_gross_paise, v_commission_paise, v_net_paise, p_source, 'confirmed', p_notes
  ) RETURNING id INTO v_earning_id;

  -- Update wallet available_balance (credit net)
  UPDATE public.wallet_accounts
  SET available_balance = available_balance + v_net_paise,
      updated_at = timezone('utc'::text, now())
  WHERE user_id = v_helper_id;

  RETURN v_earning_id;
END;$$;

COMMENT ON FUNCTION public.record_job_earning IS 'Record earning for completed service request and credit helper wallet';

-- Helper requests withdrawal
CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_amount_rupees DECIMAL(10,2),
  p_payout_mode TEXT,              -- 'bank_transfer' or 'upi'
  p_bank_account_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_helper_id UUID := auth.uid();
  v_amount_paise INTEGER;
  v_available INTEGER;
  v_withdrawal_id UUID;
  v_target_identifier TEXT;
BEGIN
  IF p_payout_mode NOT IN ('bank_transfer','upi') THEN
    RAISE EXCEPTION 'Invalid payout mode';
  END IF;

  v_amount_paise := (p_amount_rupees * 100)::INTEGER;

  -- Fetch available balance
  SELECT available_balance INTO v_available
  FROM public.wallet_accounts WHERE user_id = v_helper_id FOR UPDATE;

  IF v_available IS NULL THEN
    RAISE EXCEPTION 'Wallet account not found';
  END IF;

  IF v_amount_paise <= 0 THEN
    RAISE EXCEPTION 'Withdrawal amount must be positive';
  END IF;

  IF v_amount_paise > v_available THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Determine target identifier
  IF p_payout_mode = 'bank_transfer' THEN
    SELECT account_number INTO v_target_identifier
    FROM public.helper_bank_accounts
    WHERE id = p_bank_account_id AND helper_id = v_helper_id AND status = 'verified';

    IF v_target_identifier IS NULL THEN
      RAISE EXCEPTION 'Verified bank account required';
    END IF;
  ELSE
    SELECT upi_id INTO v_target_identifier
    FROM public.helper_bank_accounts
    WHERE helper_id = v_helper_id AND status = 'verified' AND upi_id IS NOT NULL
    ORDER BY is_primary DESC
    LIMIT 1;

    IF v_target_identifier IS NULL THEN
      RAISE EXCEPTION 'Verified UPI ID required';
    END IF;
  END IF;

  -- Create withdrawal request
  INSERT INTO public.withdrawal_requests (
    helper_id, amount_paise, status, bank_account_id, payout_mode, target_identifier, notes
  ) VALUES (
    v_helper_id, v_amount_paise, 'requested', p_bank_account_id, p_payout_mode, v_target_identifier, p_notes
  ) RETURNING id INTO v_withdrawal_id;

  -- Lock funds: deduct from available (move to processing hold logically)
  UPDATE public.wallet_accounts
  SET available_balance = available_balance - v_amount_paise,
      updated_at = timezone('utc'::text, now())
  WHERE user_id = v_helper_id;

  RETURN v_withdrawal_id;
END;$$;

COMMENT ON FUNCTION public.request_withdrawal IS 'Helper initiates withdrawal; balance debited immediately';

-- Admin approves withdrawal
CREATE OR REPLACE FUNCTION public.approve_withdrawal(
  p_withdrawal_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_helper_id UUID;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  UPDATE public.withdrawal_requests
  SET status = 'approved',
      approved_by = auth.uid(),
      approved_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_withdrawal_id AND status IN ('requested','pending_review');

  RETURN FOUND;
END;$$;

COMMENT ON FUNCTION public.approve_withdrawal IS 'Admin approves withdrawal request';

-- Mark withdrawal processing (after Cashfree payout API call initiated)
CREATE OR REPLACE FUNCTION public.mark_withdrawal_processing(
  p_withdrawal_id UUID,
  p_payout_reference TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  UPDATE public.withdrawal_requests
  SET status = 'processing',
      payout_reference = p_payout_reference,
      processed_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_withdrawal_id AND status = 'approved';

  RETURN FOUND;
END;$$;

COMMENT ON FUNCTION public.mark_withdrawal_processing IS 'Admin marks withdrawal as processing with external payout reference';

-- Update withdrawal final status from webhook or admin action
CREATE OR REPLACE FUNCTION public.update_withdrawal_status(
  p_withdrawal_id UUID,
  p_new_status withdrawal_status,
  p_failure_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_amount INTEGER;
  v_helper_id UUID;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  SELECT amount_paise, helper_id INTO v_amount, v_helper_id
  FROM public.withdrawal_requests
  WHERE id = p_withdrawal_id;

  IF v_amount IS NULL THEN
    RAISE EXCEPTION 'Withdrawal not found';
  END IF;

  UPDATE public.withdrawal_requests
  SET status = p_new_status,
      failed_reason = CASE WHEN p_new_status = 'failed' THEN p_failure_reason ELSE failed_reason END,
      paid_at = CASE WHEN p_new_status = 'paid' THEN timezone('utc'::text, now()) ELSE paid_at END,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_withdrawal_id;

  -- If failed or cancelled, refund amount back to helper wallet
  IF p_new_status IN ('failed','cancelled') THEN
    UPDATE public.wallet_accounts
    SET available_balance = available_balance + v_amount,
        updated_at = timezone('utc'::text, now())
    WHERE user_id = v_helper_id;
  END IF;

  RETURN FOUND;
END;$$;

COMMENT ON FUNCTION public.update_withdrawal_status IS 'Finalize withdrawal outcome; refund on fail/cancel';

-- Financial summary for helper
CREATE OR REPLACE FUNCTION public.get_helper_financial_summary(
  p_helper_id UUID DEFAULT auth.uid()
) RETURNS TABLE (
  total_gross_rupees DECIMAL(12,2),
  total_commission_rupees DECIMAL(12,2),
  total_net_rupees DECIMAL(12,2),
  available_balance_rupees DECIMAL(12,2),
  pending_withdrawals_rupees DECIMAL(12,2)
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_available INTEGER;
BEGIN
  SELECT available_balance INTO v_available
  FROM public.wallet_accounts WHERE user_id = p_helper_id;

  RETURN QUERY
  SELECT 
    COALESCE(SUM(gross_amount_paise)/100.0,0)::DECIMAL(12,2) AS total_gross_rupees,
    COALESCE(SUM(commission_paise)/100.0,0)::DECIMAL(12,2) AS total_commission_rupees,
    COALESCE(SUM(net_amount_paise)/100.0,0)::DECIMAL(12,2) AS total_net_rupees,
    COALESCE(v_available/100.0,0)::DECIMAL(12,2) AS available_balance_rupees,
    (
      SELECT COALESCE(SUM(amount_paise)/100.0,0) FROM public.withdrawal_requests
      WHERE helper_id = p_helper_id AND status IN ('requested','approved','processing')
    )::DECIMAL(12,2) AS pending_withdrawals_rupees
  FROM public.job_earnings
  WHERE helper_id = p_helper_id AND status = 'confirmed';
END;$$;

COMMENT ON FUNCTION public.get_helper_financial_summary IS 'Aggregated financial summary for helper earnings and balance';

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.record_job_earning TO service_role;
GRANT EXECUTE ON FUNCTION public.request_withdrawal TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_withdrawal TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_withdrawal_processing TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_withdrawal_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_helper_financial_summary TO authenticated;

COMMENT ON MIGRATION IS 'Helper withdrawals & earnings tracking integrated with wallet system and Cashfree payouts.';
