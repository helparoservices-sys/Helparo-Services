-- Migration: Helper Earnings Tracking
-- This adds tables for tracking helper earnings and customer ratings

-- Create helper_earnings table for tracking individual job earnings
CREATE TABLE IF NOT EXISTS helper_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  helper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_id UUID REFERENCES service_requests(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'collected', 'credited', 'failed')),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  credited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_helper_earnings_helper_id ON helper_earnings(helper_id);
CREATE INDEX IF NOT EXISTS idx_helper_earnings_earned_at ON helper_earnings(earned_at);
CREATE INDEX IF NOT EXISTS idx_helper_earnings_status ON helper_earnings(status);

-- Create customer_ratings table for helpers to rate customers
CREATE TABLE IF NOT EXISTS customer_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  helper_id UUID NOT NULL REFERENCES helper_profiles(id) ON DELETE CASCADE,
  request_id UUID REFERENCES service_requests(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customer_ratings_customer_id ON customer_ratings(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_ratings_helper_id ON customer_ratings(helper_id);

-- Add RLS policies for helper_earnings
ALTER TABLE helper_earnings ENABLE ROW LEVEL SECURITY;

-- Helpers can view their own earnings
CREATE POLICY "Helpers can view own earnings"
  ON helper_earnings FOR SELECT
  USING (helper_id = auth.uid());

-- Helpers can insert their own earnings
CREATE POLICY "Helpers can insert own earnings"
  ON helper_earnings FOR INSERT
  WITH CHECK (helper_id = auth.uid());

-- Add RLS policies for customer_ratings
ALTER TABLE customer_ratings ENABLE ROW LEVEL SECURITY;

-- Helpers can view and create ratings they gave
CREATE POLICY "Helpers can manage own ratings"
  ON customer_ratings FOR ALL
  USING (helper_id IN (SELECT id FROM helper_profiles WHERE user_id = auth.uid()));

-- Customers can view ratings about them
CREATE POLICY "Customers can view own ratings"
  ON customer_ratings FOR SELECT
  USING (customer_id = auth.uid());

-- Function to get helper's today earnings
CREATE OR REPLACE FUNCTION get_helper_today_earnings(p_helper_id UUID)
RETURNS TABLE (
  total_earnings DECIMAL,
  jobs_count INTEGER,
  cash_collected DECIMAL,
  upi_pending DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(amount), 0) as total_earnings,
    COUNT(*)::INTEGER as jobs_count,
    COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END), 0) as cash_collected,
    COALESCE(SUM(CASE WHEN payment_method != 'cash' AND status = 'pending' THEN amount ELSE 0 END), 0) as upi_pending
  FROM helper_earnings
  WHERE helper_id = p_helper_id
    AND earned_at >= CURRENT_DATE
    AND earned_at < CURRENT_DATE + INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_helper_today_earnings(UUID) TO authenticated;

COMMENT ON TABLE helper_earnings IS 'Tracks individual job earnings for helpers';
COMMENT ON TABLE customer_ratings IS 'Ratings given by helpers for customers';
