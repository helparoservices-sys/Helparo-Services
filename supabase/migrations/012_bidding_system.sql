-- Bidding System: Allow helpers to propose custom pricing for service requests
-- Migration 012: Bidding and negotiation system

-- ============================================================================
-- ENHANCE REQUEST_APPLICATIONS WITH BIDDING
-- ============================================================================

-- Add bidding fields to request_applications
ALTER TABLE public.request_applications
  ADD COLUMN IF NOT EXISTS bid_amount DECIMAL(10,2), -- Helper's proposed price
  ADD COLUMN IF NOT EXISTS bid_breakdown JSONB DEFAULT '{}', -- Cost breakdown (labor, materials, etc.)
  ADD COLUMN IF NOT EXISTS bid_valid_until TIMESTAMPTZ, -- Bid expiration
  ADD COLUMN IF NOT EXISTS estimated_duration_hours INTEGER, -- How long job will take
  ADD COLUMN IF NOT EXISTS availability_note TEXT, -- When helper can start
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT, -- Why customer rejected (optional)
  ADD COLUMN IF NOT EXISTS withdrawn_reason TEXT; -- Why helper withdrew (optional)

CREATE INDEX IF NOT EXISTS idx_applications_bid_amount 
  ON public.request_applications(bid_amount);

CREATE INDEX IF NOT EXISTS idx_applications_valid_until 
  ON public.request_applications(bid_valid_until);

COMMENT ON COLUMN public.request_applications.bid_amount IS 'Helper proposed price for the job';
COMMENT ON COLUMN public.request_applications.bid_breakdown IS 'JSON: {labor: 1000, materials: 500, travel: 200, etc}';
COMMENT ON COLUMN public.request_applications.estimated_duration_hours IS 'Expected job completion time';
COMMENT ON COLUMN public.request_applications.availability_note IS 'When helper can start (e.g., "Available immediately", "Can start tomorrow")';

-- ============================================================================
-- BID HISTORY TABLE (Track negotiations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bid_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public.request_applications(id) ON DELETE CASCADE,
  bid_amount DECIMAL(10,2) NOT NULL,
  bid_breakdown JSONB DEFAULT '{}',
  proposed_by UUID NOT NULL REFERENCES public.profiles(id), -- helper or customer
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_bid_history_application 
  ON public.bid_history(application_id);

CREATE INDEX IF NOT EXISTS idx_bid_history_proposed_by 
  ON public.bid_history(proposed_by);

CREATE INDEX IF NOT EXISTS idx_bid_history_created 
  ON public.bid_history(created_at DESC);

ALTER TABLE public.bid_history ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.bid_history IS 'Track all bid proposals and counter-offers';

-- ============================================================================
-- RLS POLICIES FOR BID_HISTORY
-- ============================================================================

-- Participants can view bid history
DROP POLICY IF EXISTS "Participants view bid history" ON public.bid_history;
CREATE POLICY "Participants view bid history"
  ON public.bid_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.request_applications ra
      INNER JOIN public.service_requests sr ON sr.id = ra.request_id
      WHERE ra.id = bid_history.application_id
        AND (sr.customer_id = auth.uid() OR ra.helper_id = auth.uid())
    )
  );

-- Participants can insert bid history
DROP POLICY IF EXISTS "Participants add bids" ON public.bid_history;
CREATE POLICY "Participants add bids"
  ON public.bid_history FOR INSERT
  WITH CHECK (
    proposed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.request_applications ra
      INNER JOIN public.service_requests sr ON sr.id = ra.request_id
      WHERE ra.id = bid_history.application_id
        AND (sr.customer_id = auth.uid() OR ra.helper_id = auth.uid())
    )
  );

-- Admins can view all
DROP POLICY IF EXISTS "Admins view all bid history" ON public.bid_history;
CREATE POLICY "Admins view all bid history"
  ON public.bid_history FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ============================================================================
-- COUNTER-OFFER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.counter_offer_bid(
  p_application_id UUID,
  p_new_amount DECIMAL(10,2),
  p_breakdown JSONB DEFAULT '{}',
  p_note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id UUID;
  v_customer_id UUID;
  v_helper_id UUID;
  v_current_status TEXT;
  v_history_id UUID;
BEGIN
  -- Get application details
  SELECT ra.request_id, sr.customer_id, ra.helper_id, ra.status
  INTO v_request_id, v_customer_id, v_helper_id, v_current_status
  FROM public.request_applications ra
  INNER JOIN public.service_requests sr ON sr.id = ra.request_id
  WHERE ra.id = p_application_id;

  -- Verify application exists
  IF v_request_id IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  -- Verify caller is participant
  IF auth.uid() != v_customer_id AND auth.uid() != v_helper_id THEN
    RAISE EXCEPTION 'Not authorized to counter-offer on this application';
  END IF;

  -- Verify application is still in applied status
  IF v_current_status != 'applied' THEN
    RAISE EXCEPTION 'Cannot counter-offer on application with status: %', v_current_status;
  END IF;

  -- Update application with new bid
  UPDATE public.request_applications
  SET 
    bid_amount = p_new_amount,
    bid_breakdown = p_breakdown,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_application_id;

  -- Record in bid history
  INSERT INTO public.bid_history (application_id, bid_amount, bid_breakdown, proposed_by, note)
  VALUES (p_application_id, p_new_amount, p_breakdown, auth.uid(), p_note)
  RETURNING id INTO v_history_id;

  RETURN v_history_id;
END;
$$;

COMMENT ON FUNCTION public.counter_offer_bid IS 'Create counter-offer for an application bid';

-- ============================================================================
-- ACCEPT BID FUNCTION (Enhanced accept_application)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.accept_bid(
  p_application_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id UUID;
  v_customer_id UUID;
  v_helper_id UUID;
  v_bid_amount DECIMAL(10,2);
  v_current_status TEXT;
BEGIN
  -- Get application details
  SELECT ra.request_id, sr.customer_id, ra.helper_id, ra.bid_amount, ra.status
  INTO v_request_id, v_customer_id, v_helper_id, v_bid_amount, v_current_status
  FROM public.request_applications ra
  INNER JOIN public.service_requests sr ON sr.id = ra.request_id
  WHERE ra.id = p_application_id;

  -- Verify caller is customer
  IF auth.uid() != v_customer_id THEN
    RAISE EXCEPTION 'Only customer can accept bids';
  END IF;

  -- Verify application is in applied status
  IF v_current_status != 'applied' THEN
    RAISE EXCEPTION 'Application status must be applied, current: %', v_current_status;
  END IF;

  -- Update application status to accepted
  UPDATE public.request_applications
  SET 
    status = 'accepted',
    updated_at = timezone('utc'::text, now())
  WHERE id = p_application_id;

  -- Reject all other applications
  UPDATE public.request_applications
  SET 
    status = 'rejected',
    rejection_reason = 'Another helper was selected',
    updated_at = timezone('utc'::text, now())
  WHERE request_id = v_request_id 
    AND id != p_application_id
    AND status = 'applied';

  -- Update request: assign helper and set estimated price from bid
  UPDATE public.service_requests
  SET 
    assigned_helper_id = v_helper_id,
    assigned_at = timezone('utc'::text, now()),
    estimated_price = v_bid_amount,
    status = 'assigned',
    updated_at = timezone('utc'::text, now())
  WHERE id = v_request_id;

  RETURN v_request_id;
END;
$$;

COMMENT ON FUNCTION public.accept_bid IS 'Customer accepts helper bid and assigns job';

-- ============================================================================
-- REJECT BID FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reject_bid(
  p_application_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id UUID;
  v_customer_id UUID;
BEGIN
  -- Get application details
  SELECT ra.request_id, sr.customer_id
  INTO v_request_id, v_customer_id
  FROM public.request_applications ra
  INNER JOIN public.service_requests sr ON sr.id = ra.request_id
  WHERE ra.id = p_application_id;

  -- Verify caller is customer
  IF auth.uid() != v_customer_id THEN
    RAISE EXCEPTION 'Only customer can reject bids';
  END IF;

  -- Update application status
  UPDATE public.request_applications
  SET 
    status = 'rejected',
    rejection_reason = p_reason,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_application_id;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.reject_bid IS 'Customer rejects helper bid';

-- ============================================================================
-- WITHDRAW BID FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.withdraw_bid(
  p_application_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_helper_id UUID;
BEGIN
  -- Get application helper
  SELECT helper_id
  INTO v_helper_id
  FROM public.request_applications
  WHERE id = p_application_id;

  -- Verify caller is helper
  IF auth.uid() != v_helper_id THEN
    RAISE EXCEPTION 'Only helper can withdraw their own bid';
  END IF;

  -- Update application status
  UPDATE public.request_applications
  SET 
    status = 'withdrawn',
    withdrawn_reason = p_reason,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_application_id;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.withdraw_bid IS 'Helper withdraws their bid';

-- ============================================================================
-- GET BID STATISTICS (For customers to compare bids)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_bid_statistics(
  p_request_id UUID
)
RETURNS TABLE (
  total_bids INTEGER,
  lowest_bid DECIMAL(10,2),
  highest_bid DECIMAL(10,2),
  average_bid DECIMAL(10,2),
  median_bid DECIMAL(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
  v_bid_array DECIMAL[];
  v_median_index INTEGER;
BEGIN
  -- Verify caller is customer
  SELECT customer_id INTO v_customer_id
  FROM public.service_requests
  WHERE id = p_request_id;

  IF auth.uid() != v_customer_id AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized to view bid statistics';
  END IF;

  -- Calculate statistics
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER AS total_bids,
    MIN(bid_amount) AS lowest_bid,
    MAX(bid_amount) AS highest_bid,
    ROUND(AVG(bid_amount), 2) AS average_bid,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY bid_amount) AS median_bid
  FROM public.request_applications
  WHERE request_id = p_request_id
    AND status = 'applied'
    AND bid_amount IS NOT NULL;
END;
$$;

COMMENT ON FUNCTION public.get_bid_statistics IS 'Get bid comparison statistics for a request';

-- ============================================================================
-- UPDATE EXISTING accept_application TO USE accept_bid
-- ============================================================================

-- Drop old function and replace with wrapper
DROP FUNCTION IF EXISTS public.accept_application(UUID, UUID);

CREATE OR REPLACE FUNCTION public.accept_application(
  p_request_id UUID,
  p_application_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simply call the new accept_bid function
  RETURN public.accept_bid(p_application_id);
END;
$$;

COMMENT ON FUNCTION public.accept_application IS 'Legacy wrapper for accept_bid function';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.counter_offer_bid TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_bid TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_bid TO authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_bid TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_bid_statistics TO authenticated;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Example bid breakdowns for reference:
-- {
--   "labor": 1000,
--   "materials": 500,
--   "travel": 200,
--   "equipment": 150,
--   "taxes": 165,
--   "total": 2015
-- }

COMMENT ON MIGRATION IS 'Bidding system with counter-offers, bid history, and comparison statistics';
