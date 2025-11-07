-- Background Checks & Trust/Safety Features
-- Migration 024: Enhanced verification, background checks, insurance, and geofencing

-- ============================================================================
-- ENSURE REQUIRED EXTENSIONS EXIST
-- ============================================================================
-- Enable PostGIS extension for geography functions
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- DROP EXISTING TABLES IF THEY EXIST (for clean migration)
-- ============================================================================
DROP TABLE IF EXISTS public.helper_trust_scores CASCADE;
DROP TABLE IF EXISTS public.geofence_violations CASCADE;
DROP TABLE IF EXISTS public.insurance_claims CASCADE;
DROP TABLE IF EXISTS public.service_insurance CASCADE;
DROP TABLE IF EXISTS public.verification_documents CASCADE;
DROP TABLE IF EXISTS public.background_check_results CASCADE;

-- ============================================================================
-- BACKGROUND CHECK RESULTS TABLE
-- ============================================================================
CREATE TABLE public.background_check_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  helper_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL CHECK (check_type IN ('identity', 'criminal', 'address', 'employment', 'references', 'driving_license')),
  provider TEXT, -- e.g., 'AuthBridge', 'IDfy', 'SpringVerify'
  provider_request_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'verified', 'rejected', 'expired')),
  verification_score INTEGER CHECK (verification_score >= 0 AND verification_score <= 100),
  details JSONB,
  verified_data JSONB,
  rejection_reason TEXT,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_bg_check_helper ON public.background_check_results(helper_id);
CREATE INDEX IF NOT EXISTS idx_bg_check_status ON public.background_check_results(status);
CREATE INDEX IF NOT EXISTS idx_bg_check_type ON public.background_check_results(check_type);
CREATE INDEX IF NOT EXISTS idx_bg_check_expires ON public.background_check_results(expires_at);

DROP TRIGGER IF EXISTS trg_update_bg_check ON public.background_check_results;
CREATE TRIGGER trg_update_bg_check
  BEFORE UPDATE ON public.background_check_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.background_check_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Helpers view own checks" ON public.background_check_results;
CREATE POLICY "Helpers view own checks" ON public.background_check_results
  FOR SELECT USING (helper_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage checks" ON public.background_check_results;
CREATE POLICY "Admins manage checks" ON public.background_check_results
  FOR ALL USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

COMMENT ON TABLE public.background_check_results IS 'Background verification results for helper trust & safety';

-- ============================================================================
-- HELPER VERIFICATION DOCUMENTS
-- ============================================================================
CREATE TABLE public.verification_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  helper_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('aadhar', 'pan', 'driving_license', 'passport', 'voter_id', 'police_verification', 'address_proof')),
  document_number TEXT NOT NULL,
  document_url TEXT NOT NULL,
  back_side_url TEXT,
  selfie_url TEXT, -- for face matching
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  rejection_reason TEXT,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_verif_docs_helper ON public.verification_documents(helper_id);
CREATE INDEX IF NOT EXISTS idx_verif_docs_type ON public.verification_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_verif_docs_status ON public.verification_documents(status);

DROP TRIGGER IF EXISTS trg_update_verif_docs ON public.verification_documents;
CREATE TRIGGER trg_update_verif_docs
  BEFORE UPDATE ON public.verification_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Helpers manage own docs" ON public.verification_documents;
CREATE POLICY "Helpers manage own docs" ON public.verification_documents
  FOR ALL USING (helper_id = auth.uid())
  WITH CHECK (helper_id = auth.uid());

DROP POLICY IF EXISTS "Admins view all docs" ON public.verification_documents;
CREATE POLICY "Admins view all docs" ON public.verification_documents
  FOR SELECT USING (public.is_admin(auth.uid()));

-- ============================================================================
-- SERVICE INSURANCE TABLE
-- ============================================================================
CREATE TABLE public.service_insurance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id),
  helper_id UUID NOT NULL REFERENCES public.profiles(id),
  insurance_type TEXT NOT NULL CHECK (insurance_type IN ('damage_protection', 'theft_protection', 'personal_injury', 'property_damage')),
  coverage_amount DECIMAL(10,2) NOT NULL,
  premium_amount DECIMAL(10,2) NOT NULL,
  policy_number TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'expired', 'cancelled')),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  valid_until TIMESTAMPTZ NOT NULL,
  terms_conditions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_insurance_request ON public.service_insurance(request_id);
CREATE INDEX IF NOT EXISTS idx_insurance_customer ON public.service_insurance(customer_id);
CREATE INDEX IF NOT EXISTS idx_insurance_helper ON public.service_insurance(helper_id);
CREATE INDEX IF NOT EXISTS idx_insurance_status ON public.service_insurance(status);

DROP TRIGGER IF EXISTS trg_update_insurance ON public.service_insurance;
CREATE TRIGGER trg_update_insurance
  BEFORE UPDATE ON public.service_insurance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.service_insurance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own insurance" ON public.service_insurance;
CREATE POLICY "Users view own insurance" ON public.service_insurance
  FOR SELECT USING (customer_id = auth.uid() OR helper_id = auth.uid());

-- ============================================================================
-- INSURANCE CLAIMS TABLE
-- ============================================================================
CREATE TABLE public.insurance_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insurance_id UUID NOT NULL REFERENCES public.service_insurance(id),
  claim_type TEXT NOT NULL CHECK (claim_type IN ('damage', 'theft', 'injury', 'other')),
  claim_amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  evidence_urls JSONB, -- array of photo/video URLs
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'paid')),
  admin_notes TEXT,
  approved_amount DECIMAL(10,2),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_claims_insurance ON public.insurance_claims(insurance_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON public.insurance_claims(status);

DROP TRIGGER IF EXISTS trg_update_claims ON public.insurance_claims;
CREATE TRIGGER trg_update_claims
  BEFORE UPDATE ON public.insurance_claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own claims" ON public.insurance_claims;
CREATE POLICY "Users view own claims" ON public.insurance_claims
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.service_insurance
      WHERE id = insurance_claims.insurance_id
        AND (customer_id = auth.uid() OR helper_id = auth.uid())
    )
  );

-- ============================================================================
-- GEOFENCE VIOLATIONS TABLE
-- ============================================================================
CREATE TABLE public.geofence_violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.service_requests(id),
  helper_id UUID NOT NULL REFERENCES public.profiles(id),
  violation_type TEXT NOT NULL CHECK (violation_type IN ('arrival_location_mismatch', 'work_outside_radius', 'false_arrival_claim')),
  expected_location GEOGRAPHY(POINT),
  actual_location GEOGRAPHY(POINT),
  distance_meters DECIMAL(10,2),
  threshold_meters DECIMAL(10,2),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  action_taken TEXT CHECK (action_taken IN ('warning', 'fine', 'suspension', 'none')),
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_geofence_violations_helper ON public.geofence_violations(helper_id);
CREATE INDEX IF NOT EXISTS idx_geofence_violations_request ON public.geofence_violations(request_id);
CREATE INDEX IF NOT EXISTS idx_geofence_violations_severity ON public.geofence_violations(severity);

ALTER TABLE public.geofence_violations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view violations" ON public.geofence_violations;
CREATE POLICY "Admins view violations" ON public.geofence_violations
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Helpers view own violations" ON public.geofence_violations;
CREATE POLICY "Helpers view own violations" ON public.geofence_violations
  FOR SELECT USING (helper_id = auth.uid());

-- ============================================================================
-- HELPER TRUST SCORE (composite safety score)
-- ============================================================================
CREATE TABLE public.helper_trust_scores (
  helper_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  overall_score INTEGER DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
  background_check_score INTEGER DEFAULT 0,
  document_verification_score INTEGER DEFAULT 0,
  behavior_score INTEGER DEFAULT 100,
  customer_feedback_score INTEGER DEFAULT 0,
  geofence_compliance_score INTEGER DEFAULT 100,
  total_violations INTEGER DEFAULT 0,
  active_warnings INTEGER DEFAULT 0,
  suspension_count INTEGER DEFAULT 0,
  last_violation_at TIMESTAMPTZ,
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_trust_scores_overall ON public.helper_trust_scores(overall_score DESC);

DROP TRIGGER IF EXISTS trg_update_trust_scores ON public.helper_trust_scores;
CREATE TRIGGER trg_update_trust_scores
  BEFORE UPDATE ON public.helper_trust_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.helper_trust_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone view trust scores" ON public.helper_trust_scores;
CREATE POLICY "Anyone view trust scores" ON public.helper_trust_scores
  FOR SELECT USING (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================
-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.validate_job_location CASCADE;
DROP FUNCTION IF EXISTS public.recalculate_helper_trust_score CASCADE;
DROP FUNCTION IF EXISTS public.submit_background_check CASCADE;

-- Validate job location (geofencing)
CREATE FUNCTION public.validate_job_location(
  p_request_id UUID,
  p_helper_id UUID,
  p_latitude DECIMAL(10,8),
  p_longitude DECIMAL(11,8),
  p_threshold_meters DECIMAL DEFAULT 100.0
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_expected_lat DECIMAL(10,8);
  v_expected_lng DECIMAL(11,8);
  v_distance DECIMAL(10,2);
BEGIN
  -- Get expected location from service request
  SELECT latitude, longitude
  INTO v_expected_lat, v_expected_lng
  FROM public.service_requests
  WHERE id = p_request_id;

  IF v_expected_lat IS NULL OR v_expected_lng IS NULL THEN
    RAISE EXCEPTION 'Service request location not found';
  END IF;

  -- Calculate distance using Haversine formula
  v_distance := (
    6371000 * acos(
      LEAST(1.0, GREATEST(-1.0,
        cos(radians(v_expected_lat)) * cos(radians(p_latitude)) * 
        cos(radians(p_longitude) - radians(v_expected_lng)) + 
        sin(radians(v_expected_lat)) * sin(radians(p_latitude))
      ))
    )
  );

  -- Log violation if outside threshold
  IF v_distance > p_threshold_meters THEN
    INSERT INTO public.geofence_violations (
      request_id, helper_id, violation_type,
      expected_location, actual_location,
      distance_meters, threshold_meters, severity
    ) VALUES (
      p_request_id, p_helper_id, 'arrival_location_mismatch',
      ST_GeomFromText('POINT(' || v_expected_lng || ' ' || v_expected_lat || ')', 4326)::geography,
      ST_GeomFromText('POINT(' || p_longitude || ' ' || p_latitude || ')', 4326)::geography,
      v_distance, p_threshold_meters,
      CASE
        WHEN v_distance > p_threshold_meters * 5 THEN 'critical'
        WHEN v_distance > p_threshold_meters * 2 THEN 'high'
        WHEN v_distance > p_threshold_meters * 1.5 THEN 'medium'
        ELSE 'low'
      END
    );

    -- Update trust score
    PERFORM public.recalculate_helper_trust_score(p_helper_id);

    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;$$;

COMMENT ON FUNCTION public.validate_job_location IS 'Validates helper location against service request location with geofencing';

-- Calculate helper trust score
CREATE FUNCTION public.recalculate_helper_trust_score(p_helper_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_bg_score INTEGER := 0;
  v_doc_score INTEGER := 0;
  v_behavior_score INTEGER := 100;
  v_feedback_score INTEGER := 0;
  v_geofence_score INTEGER := 100;
  v_total_violations INTEGER := 0;
  v_active_warnings INTEGER := 0;
  v_overall_score INTEGER;
BEGIN
  -- Background check score (0-100)
  SELECT 
    CASE 
      WHEN COUNT(*) FILTER (WHERE status = 'verified') = 0 THEN 0
      ELSE (COUNT(*) FILTER (WHERE status = 'verified')::DECIMAL / COUNT(*)::DECIMAL * 100)::INTEGER
    END
  INTO v_bg_score
  FROM public.background_check_results
  WHERE helper_id = p_helper_id;

  -- Document verification score (0-100)
  SELECT 
    CASE 
      WHEN COUNT(*) FILTER (WHERE status = 'approved') = 0 THEN 0
      ELSE (COUNT(*) FILTER (WHERE status = 'approved')::DECIMAL / COUNT(*)::DECIMAL * 100)::INTEGER
    END
  INTO v_doc_score
  FROM public.verification_documents
  WHERE helper_id = p_helper_id;

  -- Customer feedback score (average rating * 20)
  SELECT COALESCE((average_rating * 20)::INTEGER, 0)
  INTO v_feedback_score
  FROM public.helper_rating_summary
  WHERE helper_id = p_helper_id;

  -- Geofence compliance score (deduct 10 per violation, max 100)
  SELECT COUNT(*) INTO v_total_violations
  FROM public.geofence_violations
  WHERE helper_id = p_helper_id;

  v_geofence_score := GREATEST(100 - (v_total_violations * 10), 0);

  -- Behavior score (deduct for cancellations, late arrivals)
  SELECT 
    100 - 
    (COALESCE(cancellation_count, 0) * 5) - 
    (COALESCE(late_arrival_count, 0) * 3)
  INTO v_behavior_score
  FROM public.helper_statistics
  WHERE helper_id = p_helper_id;

  v_behavior_score := GREATEST(v_behavior_score, 0);

  -- Count active warnings (violations in last 30 days)
  SELECT COUNT(*) INTO v_active_warnings
  FROM public.geofence_violations
  WHERE helper_id = p_helper_id
    AND created_at > timezone('utc'::text, now()) - INTERVAL '30 days'
    AND resolved_at IS NULL;

  -- Overall score (weighted average)
  v_overall_score := (
    v_bg_score * 0.25 +
    v_doc_score * 0.20 +
    v_behavior_score * 0.20 +
    v_feedback_score * 0.20 +
    v_geofence_score * 0.15
  )::INTEGER;

  -- Insert or update trust score
  INSERT INTO public.helper_trust_scores (
    helper_id, overall_score, background_check_score, document_verification_score,
    behavior_score, customer_feedback_score, geofence_compliance_score,
    total_violations, active_warnings, last_calculated_at
  ) VALUES (
    p_helper_id, v_overall_score, v_bg_score, v_doc_score,
    v_behavior_score, v_feedback_score, v_geofence_score,
    v_total_violations, v_active_warnings, timezone('utc'::text, now())
  )
  ON CONFLICT (helper_id) DO UPDATE SET
    overall_score = EXCLUDED.overall_score,
    background_check_score = EXCLUDED.background_check_score,
    document_verification_score = EXCLUDED.document_verification_score,
    behavior_score = EXCLUDED.behavior_score,
    customer_feedback_score = EXCLUDED.customer_feedback_score,
    geofence_compliance_score = EXCLUDED.geofence_compliance_score,
    total_violations = EXCLUDED.total_violations,
    active_warnings = EXCLUDED.active_warnings,
    last_calculated_at = EXCLUDED.last_calculated_at,
    updated_at = timezone('utc'::text, now());

  RETURN v_overall_score;
END;$$;

COMMENT ON FUNCTION public.recalculate_helper_trust_score IS 'Calculates composite trust score from background checks, documents, behavior, feedback, and geofence compliance';

-- Submit background check request (placeholder for API integration)
CREATE FUNCTION public.submit_background_check(
  p_helper_id UUID,
  p_check_type TEXT,
  p_provider TEXT DEFAULT 'AuthBridge'
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_check_id UUID;
BEGIN
  IF auth.uid() != p_helper_id AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.background_check_results (
    helper_id, check_type, provider, status
  ) VALUES (
    p_helper_id, p_check_type, p_provider, 'pending'
  ) RETURNING id INTO v_check_id;

  -- TODO: Integrate with actual background check API
  -- This would call AuthBridge/IDfy API and update status asynchronously

  RETURN v_check_id;
END;$$;

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.validate_job_location TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_helper_trust_score TO service_role;
GRANT EXECUTE ON FUNCTION public.submit_background_check TO authenticated;

COMMENT ON MIGRATION IS 'Trust & Safety: Background checks, document verification, insurance, geofencing, and helper trust scores';


