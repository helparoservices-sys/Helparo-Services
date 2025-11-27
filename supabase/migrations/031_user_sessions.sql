-- User Sessions Tracking
-- Tracks active user sessions across devices for security monitoring

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL, -- Hash of the session/JWT token
  device_name TEXT NOT NULL,
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  location TEXT, -- City, Country
  user_agent TEXT,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  revoked_reason TEXT
);

-- Indexes for performance
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(user_id, revoked, expires_at);
CREATE INDEX idx_user_sessions_last_active ON user_sessions(last_active_at DESC);

-- RLS Policies
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
  ON user_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can revoke their own sessions
CREATE POLICY "Users can revoke own sessions"
  ON user_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can manage all sessions (for admin operations)
CREATE POLICY "Service role can manage all sessions"
  ON user_sessions
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Function to automatically clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_sessions
  SET revoked = true,
      revoked_at = NOW(),
      revoked_reason = 'Session expired'
  WHERE revoked = false
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$;

-- Function to update last_active timestamp
CREATE OR REPLACE FUNCTION update_session_activity(p_session_token TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_sessions
  SET last_active_at = NOW()
  WHERE session_token = p_session_token
    AND revoked = false;
END;
$$;

-- Login Attempts Tracking
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  ip_address TEXT,
  location TEXT,
  user_agent TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_login_attempts_user_id ON login_attempts(user_id);
CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_created_at ON login_attempts(created_at DESC);
CREATE INDEX idx_login_attempts_success ON login_attempts(success, created_at DESC);

-- RLS Policies
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Users can view their own login attempts
CREATE POLICY "Users can view own login attempts"
  ON login_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all login attempts
CREATE POLICY "Admins can view all login attempts"
  ON login_attempts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Function to log login attempts
CREATE OR REPLACE FUNCTION log_login_attempt(
  p_user_id UUID,
  p_email TEXT,
  p_success BOOLEAN,
  p_ip_address TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attempt_id UUID;
BEGIN
  INSERT INTO login_attempts (
    user_id,
    email,
    success,
    ip_address,
    location,
    user_agent,
    failure_reason
  ) VALUES (
    p_user_id,
    p_email,
    p_success,
    p_ip_address,
    p_location,
    p_user_agent,
    p_failure_reason
  )
  RETURNING id INTO v_attempt_id;
  
  RETURN v_attempt_id;
END;
$$;

COMMENT ON TABLE user_sessions IS 'Tracks active user sessions across devices for security monitoring and multi-device logout';
COMMENT ON TABLE login_attempts IS 'Logs all login attempts (successful and failed) for security auditing';
