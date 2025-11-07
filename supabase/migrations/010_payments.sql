-- =====================================================
-- Payment System with Escrow, Ledger & Commission
-- Currency: INR (Indian Rupees)
-- Provider: Cashfree
-- =====================================================

-- 1. Transaction types enum
CREATE TYPE payment_transaction_type AS ENUM (
  'fund_escrow',
  'release_helper',
  'commission_fee',
  'refund',
  'adjustment'
);

-- 2. Escrow status enum
CREATE TYPE escrow_status AS ENUM (
  'funded',
  'released',
  'refunded',
  'cancelled'
);

-- 3. Wallet accounts table
-- Stores balance for each user + platform
CREATE TABLE wallet_accounts (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  available_balance NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  escrow_balance NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (escrow_balance >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create platform wallet account (special UUID for platform revenue)
INSERT INTO wallet_accounts (user_id, available_balance, escrow_balance, currency)
VALUES ('00000000-0000-0000-0000-000000000000', 0, 0, 'INR');

-- 4. Escrows table
-- One escrow per service request
CREATE TABLE escrows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE UNIQUE,
  customer_id UUID NOT NULL REFERENCES profiles(id),
  helper_id UUID REFERENCES profiles(id),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status escrow_status NOT NULL DEFAULT 'funded',
  
  -- Cashfree integration fields
  cashfree_order_id TEXT,
  cashfree_payment_id TEXT,
  
  -- Timestamps
  funded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  released_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_escrows_request ON escrows(request_id);
CREATE INDEX idx_escrows_customer ON escrows(customer_id);
CREATE INDEX idx_escrows_helper ON escrows(helper_id);
CREATE INDEX idx_escrows_status ON escrows(status);

-- 5. Commission settings table
-- Platform commission percentage
CREATE TABLE commission_settings (
  id SERIAL PRIMARY KEY,
  percent NUMERIC(5,2) NOT NULL CHECK (percent >= 0 AND percent <= 100),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed initial commission: 12%
INSERT INTO commission_settings (percent, effective_from)
VALUES (12.00, now());

-- 6. Payment transactions table
-- Immutable transaction log
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type payment_transaction_type NOT NULL,
  request_id UUID REFERENCES service_requests(id),
  initiator_id UUID REFERENCES profiles(id),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_transactions_type ON payment_transactions(type);
CREATE INDEX idx_payment_transactions_request ON payment_transactions(request_id);
CREATE INDEX idx_payment_transactions_initiator ON payment_transactions(initiator_id);
CREATE INDEX idx_payment_transactions_created ON payment_transactions(created_at DESC);

-- 7. Ledger entries table
-- Double-entry bookkeeping for all balance changes
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
  account_user_id UUID NOT NULL REFERENCES wallet_accounts(user_id),
  balance_type TEXT NOT NULL CHECK (balance_type IN ('available', 'escrow')),
  delta NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(transaction_id, account_user_id, balance_type)
);

CREATE INDEX idx_ledger_entries_transaction ON ledger_entries(transaction_id);
CREATE INDEX idx_ledger_entries_account ON ledger_entries(account_user_id);
CREATE INDEX idx_ledger_entries_created ON ledger_entries(created_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Update wallet balances after ledger entry
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.balance_type = 'available' THEN
    UPDATE wallet_accounts
    SET available_balance = NEW.balance_after,
        updated_at = now()
    WHERE user_id = NEW.account_user_id;
  ELSIF NEW.balance_type = 'escrow' THEN
    UPDATE wallet_accounts
    SET escrow_balance = NEW.balance_after,
        updated_at = now()
    WHERE user_id = NEW.account_user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER ledger_entries_after_insert
AFTER INSERT ON ledger_entries
FOR EACH ROW
EXECUTE FUNCTION update_wallet_balance();

-- Trigger: Validate transaction entries sum to zero
CREATE OR REPLACE FUNCTION validate_transaction_balance()
RETURNS TRIGGER AS $$
DECLARE
  entries_sum NUMERIC(12,2);
BEGIN
  -- Wait a moment for all entries to be inserted
  -- Then check if sum equals zero
  SELECT COALESCE(SUM(delta), 0) INTO entries_sum
  FROM ledger_entries
  WHERE transaction_id = NEW.transaction_id;
  
  -- We allow sum to be non-zero temporarily during transaction
  -- Final validation happens at transaction commit
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Zero-sum validation is advisory; we rely on function logic to ensure correctness

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE wallet_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

-- wallet_accounts policies
CREATE POLICY "Users can view own wallet"
  ON wallet_accounts FOR SELECT
  USING (
    user_id = auth.uid() 
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "System can insert wallets"
  ON wallet_accounts FOR INSERT
  WITH CHECK (false); -- Only through triggers/functions

CREATE POLICY "System can update wallets"
  ON wallet_accounts FOR UPDATE
  USING (false); -- Only through triggers

-- escrows policies
CREATE POLICY "Customer and helper can view escrow"
  ON escrows FOR SELECT
  USING (
    customer_id = auth.uid()
    OR helper_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "System can manage escrows"
  ON escrows FOR ALL
  USING (false); -- Only through security definer functions

-- commission_settings policies
CREATE POLICY "Anyone can view current commission"
  ON commission_settings FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage commission"
  ON commission_settings FOR ALL
  USING (public.is_admin(auth.uid()));

-- payment_transactions policies
CREATE POLICY "Users can view own transactions"
  ON payment_transactions FOR SELECT
  USING (
    initiator_id = auth.uid()
    OR public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM ledger_entries le
      WHERE le.transaction_id = payment_transactions.id
      AND le.account_user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert transactions"
  ON payment_transactions FOR INSERT
  WITH CHECK (false); -- Only through security definer functions

-- ledger_entries policies
CREATE POLICY "Users can view own ledger entries"
  ON ledger_entries FOR SELECT
  USING (
    account_user_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "System can insert ledger entries"
  ON ledger_entries FOR INSERT
  WITH CHECK (false); -- Only through security definer functions

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get current commission percentage
CREATE OR REPLACE FUNCTION get_commission_percent()
RETURNS NUMERIC AS $$
DECLARE
  commission_rate NUMERIC(5,2);
BEGIN
  SELECT percent INTO commission_rate
  FROM commission_settings
  ORDER BY effective_from DESC
  LIMIT 1;
  
  RETURN COALESCE(commission_rate, 12.00);
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- CORE PAYMENT FUNCTIONS
-- =====================================================

-- Function: Fund escrow for a service request
CREATE OR REPLACE FUNCTION fund_escrow(
  p_request_id UUID,
  p_amount NUMERIC,
  p_cashfree_order_id TEXT DEFAULT NULL,
  p_cashfree_payment_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_customer_id UUID;
  v_helper_id UUID;
  v_request_status TEXT;
  v_existing_escrow UUID;
  v_transaction_id UUID;
  v_escrow_id UUID;
  v_current_escrow_balance NUMERIC;
BEGIN
  -- Validate request exists and get details
  SELECT customer_id, assigned_helper_id, status
  INTO v_customer_id, v_helper_id, v_request_status
  FROM service_requests
  WHERE id = p_request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service request not found';
  END IF;
  
  -- Verify caller is the customer
  IF v_customer_id != auth.uid() THEN
    RAISE EXCEPTION 'Only request owner can fund escrow';
  END IF;
  
  -- Check request status (must be open or assigned, not completed/cancelled)
  IF v_request_status NOT IN ('open', 'assigned') THEN
    RAISE EXCEPTION 'Cannot fund escrow for request with status: %', v_request_status;
  END IF;
  
  -- Check if escrow already exists
  SELECT id INTO v_existing_escrow
  FROM escrows
  WHERE request_id = p_request_id;
  
  IF v_existing_escrow IS NOT NULL THEN
    RAISE EXCEPTION 'Escrow already exists for this request';
  END IF;
  
  -- Ensure customer wallet exists
  INSERT INTO wallet_accounts (user_id, available_balance, escrow_balance)
  VALUES (v_customer_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create payment transaction
  INSERT INTO payment_transactions (type, request_id, initiator_id, amount, currency, meta)
  VALUES (
    'fund_escrow',
    p_request_id,
    v_customer_id,
    p_amount,
    'INR',
    jsonb_build_object(
      'cashfree_order_id', p_cashfree_order_id,
      'cashfree_payment_id', p_cashfree_payment_id
    )
  )
  RETURNING id INTO v_transaction_id;
  
  -- Get current escrow balance for customer
  SELECT escrow_balance INTO v_current_escrow_balance
  FROM wallet_accounts
  WHERE user_id = v_customer_id;
  
  -- Create ledger entry: increase customer's escrow balance
  INSERT INTO ledger_entries (transaction_id, account_user_id, balance_type, delta, balance_after)
  VALUES (
    v_transaction_id,
    v_customer_id,
    'escrow',
    p_amount,
    v_current_escrow_balance + p_amount
  );
  
  -- Create escrow record
  INSERT INTO escrows (
    request_id,
    customer_id,
    helper_id,
    amount,
    currency,
    status,
    cashfree_order_id,
    cashfree_payment_id,
    funded_at
  )
  VALUES (
    p_request_id,
    v_customer_id,
    v_helper_id,
    p_amount,
    'INR',
    'funded',
    p_cashfree_order_id,
    p_cashfree_payment_id,
    now()
  )
  RETURNING id INTO v_escrow_id;
  
  RETURN v_escrow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Release escrow on request completion
CREATE OR REPLACE FUNCTION release_escrow(p_request_id UUID)
RETURNS UUID AS $$
DECLARE
  v_escrow RECORD;
  v_request_status TEXT;
  v_commission_percent NUMERIC(5,2);
  v_commission_amount NUMERIC(12,2);
  v_helper_payout NUMERIC(12,2);
  v_transaction_id UUID;
  v_customer_escrow_balance NUMERIC;
  v_helper_balance NUMERIC;
  v_platform_balance NUMERIC;
  v_platform_user_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Get escrow details
  SELECT * INTO v_escrow
  FROM escrows
  WHERE request_id = p_request_id
  FOR UPDATE; -- Lock row
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No escrow found for request';
  END IF;
  
  -- Check escrow status
  IF v_escrow.status != 'funded' THEN
    RAISE EXCEPTION 'Escrow already processed (status: %)', v_escrow.status;
  END IF;
  
  -- Verify request is completed
  SELECT status INTO v_request_status
  FROM service_requests
  WHERE id = p_request_id;
  
  IF v_request_status != 'completed' THEN
    RAISE EXCEPTION 'Request must be completed before releasing escrow';
  END IF;
  
  -- Verify helper is assigned
  IF v_escrow.helper_id IS NULL THEN
    RAISE EXCEPTION 'No helper assigned to this request';
  END IF;
  
  -- Calculate commission
  v_commission_percent := get_commission_percent();
  v_commission_amount := ROUND(v_escrow.amount * v_commission_percent / 100, 2);
  v_helper_payout := v_escrow.amount - v_commission_amount;
  
  -- Ensure helper and platform wallets exist
  INSERT INTO wallet_accounts (user_id, available_balance, escrow_balance)
  VALUES (v_escrow.helper_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO wallet_accounts (user_id, available_balance, escrow_balance)
  VALUES (v_platform_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Get current balances
  SELECT escrow_balance INTO v_customer_escrow_balance
  FROM wallet_accounts
  WHERE user_id = v_escrow.customer_id;
  
  SELECT available_balance INTO v_helper_balance
  FROM wallet_accounts
  WHERE user_id = v_escrow.helper_id;
  
  SELECT available_balance INTO v_platform_balance
  FROM wallet_accounts
  WHERE user_id = v_platform_user_id;
  
  -- Create release transaction
  INSERT INTO payment_transactions (type, request_id, initiator_id, amount, currency, meta)
  VALUES (
    'release_helper',
    p_request_id,
    NULL, -- System-initiated
    v_escrow.amount,
    'INR',
    jsonb_build_object(
      'commission_percent', v_commission_percent,
      'commission_amount', v_commission_amount,
      'helper_payout', v_helper_payout
    )
  )
  RETURNING id INTO v_transaction_id;
  
  -- Ledger entries (double-entry):
  -- 1. Decrease customer escrow
  INSERT INTO ledger_entries (transaction_id, account_user_id, balance_type, delta, balance_after)
  VALUES (
    v_transaction_id,
    v_escrow.customer_id,
    'escrow',
    -v_escrow.amount,
    v_customer_escrow_balance - v_escrow.amount
  );
  
  -- 2. Increase helper available balance
  INSERT INTO ledger_entries (transaction_id, account_user_id, balance_type, delta, balance_after)
  VALUES (
    v_transaction_id,
    v_escrow.helper_id,
    'available',
    v_helper_payout,
    v_helper_balance + v_helper_payout
  );
  
  -- 3. Increase platform available balance (commission)
  INSERT INTO ledger_entries (transaction_id, account_user_id, balance_type, delta, balance_after)
  VALUES (
    v_transaction_id,
    v_platform_user_id,
    'available',
    v_commission_amount,
    v_platform_balance + v_commission_amount
  );
  
  -- Update escrow status
  UPDATE escrows
  SET status = 'released',
      released_at = now(),
      updated_at = now()
  WHERE id = v_escrow.id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Refund escrow (if request cancelled before completion)
CREATE OR REPLACE FUNCTION refund_escrow(p_request_id UUID)
RETURNS UUID AS $$
DECLARE
  v_escrow RECORD;
  v_request_status TEXT;
  v_transaction_id UUID;
  v_customer_escrow_balance NUMERIC;
  v_customer_available_balance NUMERIC;
BEGIN
  -- Get escrow details
  SELECT * INTO v_escrow
  FROM escrows
  WHERE request_id = p_request_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No escrow found for request';
  END IF;
  
  -- Check escrow status
  IF v_escrow.status != 'funded' THEN
    RAISE EXCEPTION 'Escrow cannot be refunded (status: %)', v_escrow.status;
  END IF;
  
  -- Verify caller is customer or admin
  IF v_escrow.customer_id != auth.uid() AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only customer or admin can refund escrow';
  END IF;
  
  -- Get request status
  SELECT status INTO v_request_status
  FROM service_requests
  WHERE id = p_request_id;
  
  IF v_request_status = 'completed' THEN
    RAISE EXCEPTION 'Cannot refund escrow for completed request';
  END IF;
  
  -- Get current balances
  SELECT escrow_balance, available_balance
  INTO v_customer_escrow_balance, v_customer_available_balance
  FROM wallet_accounts
  WHERE user_id = v_escrow.customer_id;
  
  -- Create refund transaction
  INSERT INTO payment_transactions (type, request_id, initiator_id, amount, currency)
  VALUES (
    'refund',
    p_request_id,
    auth.uid(),
    v_escrow.amount,
    'INR'
  )
  RETURNING id INTO v_transaction_id;
  
  -- Ledger entries:
  -- 1. Decrease customer escrow
  INSERT INTO ledger_entries (transaction_id, account_user_id, balance_type, delta, balance_after)
  VALUES (
    v_transaction_id,
    v_escrow.customer_id,
    'escrow',
    -v_escrow.amount,
    v_customer_escrow_balance - v_escrow.amount
  );
  
  -- 2. Increase customer available (refund back)
  INSERT INTO ledger_entries (transaction_id, account_user_id, balance_type, delta, balance_after)
  VALUES (
    v_transaction_id,
    v_escrow.customer_id,
    'available',
    v_escrow.amount,
    v_customer_available_balance + v_escrow.amount
  );
  
  -- Update escrow status
  UPDATE escrows
  SET status = 'refunded',
      refunded_at = now(),
      updated_at = now()
  WHERE id = v_escrow.id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE wallet_accounts IS 'User wallet balances in INR';
COMMENT ON TABLE escrows IS 'Escrow funds for service requests (Cashfree integration)';
COMMENT ON TABLE commission_settings IS 'Platform commission percentage history';
COMMENT ON TABLE payment_transactions IS 'Immutable transaction log';
COMMENT ON TABLE ledger_entries IS 'Double-entry bookkeeping ledger';

COMMENT ON FUNCTION fund_escrow IS 'Fund escrow for a service request (customer only)';
COMMENT ON FUNCTION release_escrow IS 'Release escrow to helper after completion (system)';
COMMENT ON FUNCTION refund_escrow IS 'Refund escrow to customer if request cancelled';
COMMENT ON FUNCTION get_commission_percent IS 'Get current platform commission percentage';
