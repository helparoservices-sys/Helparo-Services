-- Migration: Platform Settings Enhancement
-- Add missing fields to commission_settings and create system_settings table

-- 1. Extend commission_settings table
ALTER TABLE commission_settings 
ADD COLUMN IF NOT EXISTS surge_multiplier NUMERIC(3,1) DEFAULT 1.5 CHECK (surge_multiplier >= 1.0 AND surge_multiplier <= 5.0),
ADD COLUMN IF NOT EXISTS service_radius_km INTEGER DEFAULT 10 CHECK (service_radius_km >= 1 AND service_radius_km <= 100),
ADD COLUMN IF NOT EXISTS emergency_radius_km INTEGER DEFAULT 20 CHECK (emergency_radius_km >= 1 AND emergency_radius_km <= 100),
ADD COLUMN IF NOT EXISTS min_withdrawal_amount INTEGER DEFAULT 100 CHECK (min_withdrawal_amount >= 1),
ADD COLUMN IF NOT EXISTS auto_payout_threshold INTEGER DEFAULT 1000 CHECK (auto_payout_threshold >= 100),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Update existing record with default values
UPDATE commission_settings 
SET 
  surge_multiplier = 1.5,
  service_radius_km = 10,
  emergency_radius_km = 20,
  min_withdrawal_amount = 100,
  auto_payout_threshold = 1000,
  updated_at = now()
WHERE surge_multiplier IS NULL;

-- 2. Create system_settings table for flexible key-value configurations
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index on key for fast lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- 3. Insert default gamification settings
INSERT INTO system_settings (key, value, description) 
VALUES (
  'gamification_config',
  '{"enableBadges": true, "enableLoyaltyPoints": true, "showLeaderboard": true}',
  'Gamification feature toggles'
) ON CONFLICT (key) DO NOTHING;

-- 4. Insert default subscription plan settings
INSERT INTO system_settings (key, value, description) 
VALUES (
  'subscription_plans',
  '{"helperPro": {"price": 299, "currency": "INR", "features": ["reduced_commission", "priority_support", "advanced_analytics"]}, "customerPremium": {"price": 199, "currency": "INR", "features": ["priority_booking", "discount_10_percent", "24x7_support"]}}',
  'Subscription plan configurations'
) ON CONFLICT (key) DO NOTHING;

-- 5. Insert default notification settings
INSERT INTO system_settings (key, value, description) 
VALUES (
  'notification_config',
  '{"emailNotifications": true, "smsNotifications": true, "pushNotifications": true, "marketingEmails": false}',
  'Platform notification settings'
) ON CONFLICT (key) DO NOTHING;

-- 6. Enable RLS on system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 7. Create policies for system_settings
CREATE POLICY "Admin can read all system settings"
  ON system_settings FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can manage all system settings"
  ON system_settings FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- 8. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to both tables
DROP TRIGGER IF EXISTS update_commission_settings_updated_at ON commission_settings;
CREATE TRIGGER update_commission_settings_updated_at
  BEFORE UPDATE ON commission_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Comments for documentation
COMMENT ON TABLE commission_settings IS 'Platform commission and operational settings';
COMMENT ON COLUMN commission_settings.surge_multiplier IS 'Price multiplier during peak hours (1.0-5.0)';
COMMENT ON COLUMN commission_settings.service_radius_km IS 'Default service radius in kilometers (1-100)';
COMMENT ON COLUMN commission_settings.emergency_radius_km IS 'Extended radius for emergency services (1-100)';
COMMENT ON COLUMN commission_settings.min_withdrawal_amount IS 'Minimum amount helpers can withdraw';
COMMENT ON COLUMN commission_settings.auto_payout_threshold IS 'Automatic payout when balance reaches this amount';

COMMENT ON TABLE system_settings IS 'Flexible key-value store for system configurations';
COMMENT ON COLUMN system_settings.key IS 'Unique setting identifier';
COMMENT ON COLUMN system_settings.value IS 'JSON configuration value';
COMMENT ON COLUMN system_settings.description IS 'Human-readable description of the setting';