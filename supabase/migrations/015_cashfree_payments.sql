-- Cashfree Payment Integration: Live payments with Cashfree SDK
-- Migration 015: Payment orders, transactions, and webhook handling

-- ============================================================================
-- PAYMENT STATUS ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'pending',
    'processing', 
    'success',
    'failed',
    'cancelled',
    'refund_initiated',
    'refunded',
    'partially_refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'upi',
    'card',
    'netbanking',
    'wallet',
    'emi',
    'paylater',
    'app'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- PAYMENT ORDERS TABLE (Cashfree Orders)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payment_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id VARCHAR(50) UNIQUE NOT NULL, -- Cashfree order_id
  cf_order_id VARCHAR(100), -- Cashfree's internal order ID
  request_id UUID NOT NULL REFERENCES public.service_requests(id),
  customer_id UUID NOT NULL REFERENCES public.profiles(id),
  helper_id UUID REFERENCES public.profiles(id),
  
  -- Amount details (in paise)
  order_amount INTEGER NOT NULL, -- Amount in paise (₹100 = 10000 paise)
  order_currency VARCHAR(3) DEFAULT 'INR',
  
  -- Payment details
  payment_status payment_status NOT NULL DEFAULT 'pending',
  payment_method payment_method,
  payment_time TIMESTAMPTZ,
  
  -- Cashfree response data
  cf_payment_id VARCHAR(100), -- Cashfree payment ID
  bank_reference VARCHAR(100),
  auth_id VARCHAR(100),
  
  -- Customer details
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  
  -- Additional metadata
  order_note TEXT,
  return_url TEXT,
  notify_url TEXT,
  
  -- Failure details
  payment_message TEXT,
  failure_reason TEXT,
  error_code VARCHAR(50),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_order_id 
  ON public.payment_orders(order_id);

CREATE INDEX IF NOT EXISTS idx_payment_orders_request 
  ON public.payment_orders(request_id);

CREATE INDEX IF NOT EXISTS idx_payment_orders_customer 
  ON public.payment_orders(customer_id);

CREATE INDEX IF NOT EXISTS idx_payment_orders_status 
  ON public.payment_orders(payment_status);

DROP TRIGGER IF EXISTS trg_update_payment_orders ON public.payment_orders;
CREATE TRIGGER trg_update_payment_orders
  BEFORE UPDATE ON public.payment_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.payment_orders IS 'Cashfree payment orders';
COMMENT ON COLUMN public.payment_orders.order_amount IS 'Amount in paise (₹100 = 10000 paise)';

-- ============================================================================
-- PAYMENT WEBHOOKS TABLE (Cashfree Webhook Logs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payment_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id VARCHAR(50) REFERENCES public.payment_orders(order_id),
  event_type VARCHAR(100) NOT NULL,
  event_time TIMESTAMPTZ NOT NULL,
  
  -- Raw webhook data
  webhook_data JSONB NOT NULL,
  
  -- Verification
  signature VARCHAR(500),
  signature_verified BOOLEAN DEFAULT FALSE,
  
  -- Processing
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payment_webhooks_order 
  ON public.payment_webhooks(order_id);

CREATE INDEX IF NOT EXISTS idx_payment_webhooks_event 
  ON public.payment_webhooks(event_type);

CREATE INDEX IF NOT EXISTS idx_payment_webhooks_processed 
  ON public.payment_webhooks(processed);

ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.payment_webhooks IS 'Cashfree webhook event logs';

-- ============================================================================
-- REFUND REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.refund_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  refund_id VARCHAR(50) UNIQUE NOT NULL, -- Our refund ID
  cf_refund_id VARCHAR(100), -- Cashfree refund ID
  order_id VARCHAR(50) NOT NULL REFERENCES public.payment_orders(order_id),
  
  -- Refund details
  refund_amount INTEGER NOT NULL, -- Amount in paise
  refund_reason TEXT NOT NULL,
  refund_note TEXT,
  refund_status payment_status NOT NULL DEFAULT 'pending',
  
  -- Cashfree response
  refund_arn VARCHAR(100), -- Acquirer Reference Number
  refund_processed_at TIMESTAMPTZ,
  
  -- Metadata
  requested_by UUID NOT NULL REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_refund_requests_order 
  ON public.refund_requests(order_id);

CREATE INDEX IF NOT EXISTS idx_refund_requests_status 
  ON public.refund_requests(refund_status);

DROP TRIGGER IF EXISTS trg_update_refund_requests ON public.refund_requests;
CREATE TRIGGER trg_update_refund_requests
  BEFORE UPDATE ON public.refund_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.refund_requests IS 'Payment refund requests';

-- ============================================================================
-- RLS POLICIES FOR PAYMENT_ORDERS
-- ============================================================================

-- Customers view own orders
DROP POLICY IF EXISTS "Customers view own orders" ON public.payment_orders;
CREATE POLICY "Customers view own orders"
  ON public.payment_orders FOR SELECT
  USING (customer_id = auth.uid());

-- Helpers view orders where they are assigned
DROP POLICY IF EXISTS "Helpers view assigned orders" ON public.payment_orders;
CREATE POLICY "Helpers view assigned orders"
  ON public.payment_orders FOR SELECT
  USING (helper_id = auth.uid());

-- Admins view all orders
DROP POLICY IF EXISTS "Admins view all orders" ON public.payment_orders;
CREATE POLICY "Admins view all orders"
  ON public.payment_orders FOR SELECT
  USING (public.is_admin(auth.uid()));

-- System can insert/update orders (via service role)
DROP POLICY IF EXISTS "System manage orders" ON public.payment_orders;
CREATE POLICY "System manage orders"
  ON public.payment_orders FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- RLS POLICIES FOR REFUND_REQUESTS
-- ============================================================================

-- Users view own refund requests
DROP POLICY IF EXISTS "Users view own refunds" ON public.refund_requests;
CREATE POLICY "Users view own refunds"
  ON public.refund_requests FOR SELECT
  USING (requested_by = auth.uid());

-- Users create refund requests
DROP POLICY IF EXISTS "Users request refunds" ON public.refund_requests;
CREATE POLICY "Users request refunds"
  ON public.refund_requests FOR INSERT
  WITH CHECK (requested_by = auth.uid());

-- Admins view all refund requests
DROP POLICY IF EXISTS "Admins view all refunds" ON public.refund_requests;
CREATE POLICY "Admins view all refunds"
  ON public.refund_requests FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Admins update refund requests
DROP POLICY IF EXISTS "Admins update refunds" ON public.refund_requests;
CREATE POLICY "Admins update refunds"
  ON public.refund_requests FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================================
-- RLS POLICIES FOR PAYMENT_WEBHOOKS (Admin only)
-- ============================================================================

DROP POLICY IF EXISTS "Admins view webhooks" ON public.payment_webhooks;
CREATE POLICY "Admins view webhooks"
  ON public.payment_webhooks FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ============================================================================
-- CREATE PAYMENT ORDER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_payment_order(
  p_request_id UUID,
  p_amount_rupees DECIMAL(10,2),
  p_customer_name VARCHAR(255),
  p_customer_email VARCHAR(255),
  p_customer_phone VARCHAR(20),
  p_order_note TEXT DEFAULT NULL
)
RETURNS TABLE (
  order_id VARCHAR(50),
  order_amount INTEGER,
  payment_order_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id VARCHAR(50);
  v_order_amount INTEGER;
  v_customer_id UUID;
  v_helper_id UUID;
  v_order_uuid UUID;
BEGIN
  -- Verify caller is customer
  SELECT customer_id, assigned_helper_id
  INTO v_customer_id, v_helper_id
  FROM public.service_requests
  WHERE id = p_request_id;

  IF v_customer_id != auth.uid() THEN
    RAISE EXCEPTION 'Only request customer can create payment order';
  END IF;

  -- Generate unique order ID (format: ORD_timestamp_random)
  v_order_id := 'ORD_' || EXTRACT(EPOCH FROM now())::BIGINT || '_' || substr(md5(random()::text), 1, 8);
  
  -- Convert rupees to paise
  v_order_amount := (p_amount_rupees * 100)::INTEGER;

  -- Create payment order
  INSERT INTO public.payment_orders (
    order_id,
    request_id,
    customer_id,
    helper_id,
    order_amount,
    customer_name,
    customer_email,
    customer_phone,
    order_note
  )
  VALUES (
    v_order_id,
    p_request_id,
    v_customer_id,
    v_helper_id,
    v_order_amount,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_order_note
  )
  RETURNING id INTO v_order_uuid;

  RETURN QUERY
  SELECT v_order_id, v_order_amount, v_order_uuid;
END;
$$;

COMMENT ON FUNCTION public.create_payment_order IS 'Create Cashfree payment order';

-- ============================================================================
-- UPDATE PAYMENT STATUS FUNCTION (Called by webhook)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_payment_status(
  p_order_id VARCHAR(50),
  p_cf_order_id VARCHAR(100),
  p_cf_payment_id VARCHAR(100),
  p_payment_status TEXT,
  p_payment_method TEXT DEFAULT NULL,
  p_payment_time TIMESTAMPTZ DEFAULT NULL,
  p_bank_reference VARCHAR(100) DEFAULT NULL,
  p_auth_id VARCHAR(100) DEFAULT NULL,
  p_payment_message TEXT DEFAULT NULL,
  p_failure_reason TEXT DEFAULT NULL,
  p_error_code VARCHAR(50) DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status payment_status;
  v_method payment_method;
  v_request_id UUID;
BEGIN
  -- Convert text status to enum
  v_status := p_payment_status::payment_status;
  
  -- Convert payment method if provided
  IF p_payment_method IS NOT NULL THEN
    v_method := p_payment_method::payment_method;
  END IF;

  -- Update payment order
  UPDATE public.payment_orders
  SET 
    cf_order_id = p_cf_order_id,
    cf_payment_id = p_cf_payment_id,
    payment_status = v_status,
    payment_method = v_method,
    payment_time = COALESCE(p_payment_time, payment_time),
    bank_reference = COALESCE(p_bank_reference, bank_reference),
    auth_id = COALESCE(p_auth_id, auth_id),
    payment_message = COALESCE(p_payment_message, payment_message),
    failure_reason = p_failure_reason,
    error_code = p_error_code,
    updated_at = timezone('utc'::text, now())
  WHERE order_id = p_order_id
  RETURNING request_id INTO v_request_id;

  -- If payment successful, update service request
  IF v_status = 'success' AND v_request_id IS NOT NULL THEN
    UPDATE public.service_requests
    SET 
      payment_status = 'paid',
      updated_at = timezone('utc'::text, now())
    WHERE id = v_request_id;
  END IF;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.update_payment_status IS 'Update payment status from Cashfree webhook';

-- ============================================================================
-- LOG WEBHOOK FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_payment_webhook(
  p_order_id VARCHAR(50),
  p_event_type VARCHAR(100),
  p_event_time TIMESTAMPTZ,
  p_webhook_data JSONB,
  p_signature VARCHAR(500) DEFAULT NULL,
  p_signature_verified BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_webhook_id UUID;
BEGIN
  INSERT INTO public.payment_webhooks (
    order_id,
    event_type,
    event_time,
    webhook_data,
    signature,
    signature_verified
  )
  VALUES (
    p_order_id,
    p_event_type,
    p_event_time,
    p_webhook_data,
    p_signature,
    p_signature_verified
  )
  RETURNING id INTO v_webhook_id;

  RETURN v_webhook_id;
END;
$$;

COMMENT ON FUNCTION public.log_payment_webhook IS 'Log Cashfree webhook event';

-- ============================================================================
-- CREATE REFUND REQUEST FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_refund_request(
  p_order_id VARCHAR(50),
  p_refund_amount_rupees DECIMAL(10,2),
  p_refund_reason TEXT,
  p_refund_note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_refund_id VARCHAR(50);
  v_refund_amount INTEGER;
  v_order_amount INTEGER;
  v_customer_id UUID;
  v_refund_uuid UUID;
BEGIN
  -- Get order details
  SELECT customer_id, order_amount
  INTO v_customer_id, v_order_amount
  FROM public.payment_orders
  WHERE order_id = p_order_id;

  -- Verify caller is customer or admin
  IF auth.uid() != v_customer_id AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only customer or admin can request refund';
  END IF;

  -- Convert rupees to paise
  v_refund_amount := (p_refund_amount_rupees * 100)::INTEGER;

  -- Validate refund amount
  IF v_refund_amount > v_order_amount THEN
    RAISE EXCEPTION 'Refund amount cannot exceed order amount';
  END IF;

  -- Generate refund ID
  v_refund_id := 'RFD_' || EXTRACT(EPOCH FROM now())::BIGINT || '_' || substr(md5(random()::text), 1, 8);

  -- Create refund request
  INSERT INTO public.refund_requests (
    refund_id,
    order_id,
    refund_amount,
    refund_reason,
    refund_note,
    requested_by
  )
  VALUES (
    v_refund_id,
    p_order_id,
    v_refund_amount,
    p_refund_reason,
    p_refund_note,
    auth.uid()
  )
  RETURNING id INTO v_refund_uuid;

  RETURN v_refund_uuid;
END;
$$;

COMMENT ON FUNCTION public.create_refund_request IS 'Create refund request for payment';

-- ============================================================================
-- UPDATE REFUND STATUS FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_refund_status(
  p_refund_id VARCHAR(50),
  p_cf_refund_id VARCHAR(100),
  p_refund_status TEXT,
  p_refund_arn VARCHAR(100) DEFAULT NULL,
  p_processed_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status payment_status;
  v_order_id VARCHAR(50);
BEGIN
  -- Convert status
  v_status := p_refund_status::payment_status;

  -- Update refund request
  UPDATE public.refund_requests
  SET 
    cf_refund_id = p_cf_refund_id,
    refund_status = v_status,
    refund_arn = COALESCE(p_refund_arn, refund_arn),
    refund_processed_at = COALESCE(p_processed_at, refund_processed_at),
    updated_at = timezone('utc'::text, now())
  WHERE refund_id = p_refund_id
  RETURNING order_id INTO v_order_id;

  -- Update payment order status if refunded
  IF v_status = 'refunded' THEN
    UPDATE public.payment_orders
    SET 
      payment_status = 'refunded',
      updated_at = timezone('utc'::text, now())
    WHERE order_id = v_order_id;
  ELSIF v_status = 'partially_refunded' THEN
    UPDATE public.payment_orders
    SET 
      payment_status = 'partially_refunded',
      updated_at = timezone('utc'::text, now())
    WHERE order_id = v_order_id;
  END IF;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.update_refund_status IS 'Update refund status from Cashfree';

-- ============================================================================
-- GET PAYMENT SUMMARY FOR REQUEST
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_payment_summary(
  p_request_id UUID
)
RETURNS TABLE (
  order_id VARCHAR(50),
  order_amount_rupees DECIMAL(10,2),
  payment_status payment_status,
  payment_method payment_method,
  payment_time TIMESTAMPTZ,
  refund_amount_rupees DECIMAL(10,2),
  refund_status payment_status
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    po.order_id,
    (po.order_amount / 100.0)::DECIMAL(10,2) AS order_amount_rupees,
    po.payment_status,
    po.payment_method,
    po.payment_time,
    COALESCE((rr.refund_amount / 100.0)::DECIMAL(10,2), 0) AS refund_amount_rupees,
    rr.refund_status
  FROM public.payment_orders po
  LEFT JOIN public.refund_requests rr ON rr.order_id = po.order_id
  WHERE po.request_id = p_request_id
  ORDER BY po.created_at DESC
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.get_payment_summary IS 'Get payment summary for service request';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.create_payment_order TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_payment_status TO service_role;
GRANT EXECUTE ON FUNCTION public.log_payment_webhook TO service_role;
GRANT EXECUTE ON FUNCTION public.create_refund_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_refund_status TO service_role;
GRANT EXECUTE ON FUNCTION public.get_payment_summary TO authenticated;

COMMENT ON MIGRATION IS 'Cashfree payment integration with orders, webhooks, and refunds';
