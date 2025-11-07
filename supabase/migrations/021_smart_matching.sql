-- Smart Matching Algorithm with AI Scoring
-- Migration 021: Enhanced helper search with multi-factor scoring

-- ============================================================================
-- HELPER STATISTICS TABLE (for completion rate tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.helper_statistics (
  helper_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_jobs_completed INTEGER DEFAULT 0,
  total_jobs_assigned INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  avg_job_duration_minutes INTEGER DEFAULT 0,
  cancellation_count INTEGER DEFAULT 0,
  late_arrival_count INTEGER DEFAULT 0,
  on_time_percentage DECIMAL(5,2) DEFAULT 100,
  response_time_avg_minutes INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_helper_stats_completion ON public.helper_statistics(completion_rate DESC);
CREATE INDEX IF NOT EXISTS idx_helper_stats_jobs ON public.helper_statistics(total_jobs_completed DESC);

ALTER TABLE public.helper_statistics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone view helper stats" ON public.helper_statistics;
CREATE POLICY "Anyone view helper stats" ON public.helper_statistics
  FOR SELECT USING (true);

COMMENT ON TABLE public.helper_statistics IS 'Performance statistics for helper matching algorithm';

-- ============================================================================
-- HELPER SPECIALIZATIONS (for specialization matching)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.helper_specializations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  helper_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  experience_years INTEGER DEFAULT 0,
  completed_jobs_count INTEGER DEFAULT 0,
  certification_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(helper_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_helper_spec_helper ON public.helper_specializations(helper_id);
CREATE INDEX IF NOT EXISTS idx_helper_spec_category ON public.helper_specializations(category_id);
CREATE INDEX IF NOT EXISTS idx_helper_spec_verified ON public.helper_specializations(is_verified);

ALTER TABLE public.helper_specializations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone view specializations" ON public.helper_specializations;
CREATE POLICY "Anyone view specializations" ON public.helper_specializations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Helpers manage specializations" ON public.helper_specializations;
CREATE POLICY "Helpers manage specializations" ON public.helper_specializations
  FOR ALL USING (helper_id = auth.uid())
  WITH CHECK (helper_id = auth.uid());

-- ============================================================================
-- SMART MATCHING FUNCTION (Multi-factor AI scoring)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.find_best_helpers(
  p_latitude DECIMAL(10,8),
  p_longitude DECIMAL(11,8),
  p_category_id UUID,
  p_max_distance_km DECIMAL DEFAULT 10.0,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  helper_id UUID,
  full_name TEXT,
  phone TEXT,
  profile_photo TEXT,
  distance_km DECIMAL,
  average_rating DECIMAL,
  total_reviews INTEGER,
  completion_rate DECIMAL,
  hourly_rate DECIMAL,
  has_specialization BOOLEAN,
  match_score DECIMAL,
  rank INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH helper_distance AS (
    SELECT 
      p.id,
      p.full_name,
      p.phone,
      p.profile_photo_url,
      (
        6371 * acos(
          LEAST(1.0, GREATEST(-1.0,
            cos(radians(p_latitude)) * cos(radians(p.latitude)) * 
            cos(radians(p.longitude) - radians(p_longitude)) + 
            sin(radians(p_latitude)) * sin(radians(p.latitude))
          ))
        )
      ) AS dist_km
    FROM public.profiles p
    WHERE p.role = 'helper'
      AND p.latitude IS NOT NULL
      AND p.longitude IS NOT NULL
  ),
  helper_pricing AS (
    SELECT 
      hs.helper_id,
      hs.hourly_rate
    FROM public.helper_services hs
    WHERE hs.category_id = p_category_id
  ),
  helper_data AS (
    SELECT 
      hd.id,
      hd.full_name,
      hd.phone,
      hd.profile_photo,
      hd.dist_km,
      COALESCE(hrs.average_rating, 0) AS avg_rating,
      COALESCE(hrs.total_reviews, 0) AS reviews,
      COALESCE(hs.completion_rate, 0) AS comp_rate,
      COALESCE(hp.hourly_rate, 0) AS rate,
      EXISTS (
        SELECT 1 FROM public.helper_specializations hsp
        WHERE hsp.helper_id = hd.id 
          AND hsp.category_id = p_category_id
          AND hsp.is_verified = TRUE
      ) AS has_spec
    FROM helper_distance hd
    LEFT JOIN public.helper_rating_summary hrs ON hrs.helper_id = hd.id
    LEFT JOIN public.helper_statistics hs ON hs.helper_id = hd.id
    LEFT JOIN helper_pricing hp ON hp.helper_id = hd.id
    WHERE hd.dist_km <= p_max_distance_km
  ),
  scored_helpers AS (
    SELECT 
      hdata.*,
      -- Multi-factor scoring algorithm (weights sum to 1.0)
      (
        -- Rating score (30%): normalized 0-1 scale
        (COALESCE(hdata.avg_rating, 0) / 5.0) * 0.30 +
        
        -- Proximity score (25%): inverse distance normalized
        (CASE 
          WHEN hdata.dist_km = 0 THEN 1.0
          ELSE (1.0 - LEAST(hdata.dist_km / p_max_distance_km, 1.0))
        END) * 0.25 +
        
        -- Price competitiveness (25%): favor lower rates (inverse normalized)
        (CASE 
          WHEN hdata.rate = 0 THEN 0.0
          WHEN hdata.rate > 0 THEN 
            (1.0 - LEAST(hdata.rate / 1000.0, 1.0)) * 0.25
          ELSE 0.0
        END) +
        
        -- Specialization match (15%): bonus for verified specialization
        (CASE WHEN hdata.has_spec THEN 1.0 ELSE 0.0 END) * 0.15 +
        
        -- Completion rate (5%): normalized 0-1 scale
        (COALESCE(hdata.comp_rate, 0) / 100.0) * 0.05
      ) AS score
    FROM helper_data hdata
  )
  SELECT 
    sh.id,
    sh.full_name,
    sh.phone,
    sh.profile_photo,
    ROUND(sh.dist_km::NUMERIC, 2),
    ROUND(sh.avg_rating::NUMERIC, 2),
    sh.reviews,
    ROUND(sh.comp_rate::NUMERIC, 2),
    ROUND(sh.rate::NUMERIC, 2),
    sh.has_spec,
    ROUND(sh.score::NUMERIC, 4),
    ROW_NUMBER() OVER (ORDER BY sh.score DESC, sh.avg_rating DESC, sh.dist_km ASC)::INTEGER
  FROM scored_helpers sh
  ORDER BY sh.score DESC, sh.avg_rating DESC, sh.dist_km ASC
  LIMIT p_limit;
END;$$;

COMMENT ON FUNCTION public.find_best_helpers IS 'Smart matching with AI scoring: rating (30%) + proximity (25%) + price (25%) + specialization (15%) + completion rate (5%)';

-- ============================================================================
-- UPDATE HELPER STATISTICS (called after job completion)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_helper_statistics(p_helper_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_completed INTEGER;
  v_assigned INTEGER;
  v_completion_rate DECIMAL(5,2);
  v_total_earnings DECIMAL(10,2);
  v_avg_duration INTEGER;
  v_cancellations INTEGER;
  v_late_arrivals INTEGER;
  v_on_time_pct DECIMAL(5,2);
BEGIN
  -- Count completed and assigned jobs
  SELECT 
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
    COUNT(*) FILTER (WHERE status = 'cancelled')
  INTO v_completed, v_assigned, v_cancellations
  FROM public.service_requests
  WHERE assigned_helper_id = p_helper_id;

  -- Calculate completion rate
  v_completion_rate := CASE 
    WHEN v_assigned > 0 THEN (v_completed::DECIMAL / v_assigned::DECIMAL) * 100
    ELSE 0
  END;

  -- Get total earnings
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_earnings
  FROM public.job_earnings
  WHERE helper_id = p_helper_id;

  -- Average job duration (from service_requests)
  SELECT COALESCE(AVG(job_duration_minutes), 0)::INTEGER
  INTO v_avg_duration
  FROM public.service_requests
  WHERE assigned_helper_id = p_helper_id
    AND job_duration_minutes IS NOT NULL;

  -- Late arrivals (compare arrival checkpoint with preferred time + 15 minutes)
  SELECT COUNT(*)
  INTO v_late_arrivals
  FROM public.job_checkpoints jc
  INNER JOIN public.service_requests sr ON sr.id = jc.request_id
  WHERE sr.assigned_helper_id = p_helper_id
    AND jc.checkpoint_type = 'arrived'
    AND sr.preferred_date IS NOT NULL
    AND sr.preferred_time_start IS NOT NULL
    AND jc.created_at > (
      (sr.preferred_date::TEXT || ' ' || sr.preferred_time_start::TEXT)::TIMESTAMP + INTERVAL '15 minutes'
    );

  -- On-time percentage
  v_on_time_pct := CASE 
    WHEN v_completed > 0 THEN ((v_completed - v_late_arrivals)::DECIMAL / v_completed::DECIMAL) * 100
    ELSE 100
  END;

  -- Insert or update statistics
  INSERT INTO public.helper_statistics (
    helper_id, total_jobs_completed, total_jobs_assigned, completion_rate,
    total_earnings, avg_job_duration_minutes, cancellation_count,
    late_arrival_count, on_time_percentage, last_active_at
  ) VALUES (
    p_helper_id, v_completed, v_assigned, v_completion_rate,
    v_total_earnings, v_avg_duration, v_cancellations,
    v_late_arrivals, v_on_time_pct, timezone('utc'::text, now())
  )
  ON CONFLICT (helper_id) DO UPDATE SET
    total_jobs_completed = EXCLUDED.total_jobs_completed,
    total_jobs_assigned = EXCLUDED.total_jobs_assigned,
    completion_rate = EXCLUDED.completion_rate,
    total_earnings = EXCLUDED.total_earnings,
    avg_job_duration_minutes = EXCLUDED.avg_job_duration_minutes,
    cancellation_count = EXCLUDED.cancellation_count,
    late_arrival_count = EXCLUDED.late_arrival_count,
    on_time_percentage = EXCLUDED.on_time_percentage,
    last_active_at = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now());
END;$$;

COMMENT ON FUNCTION public.update_helper_statistics IS 'Updates helper performance metrics for matching algorithm';

-- ============================================================================
-- TRIGGER: Auto-update stats on job completion
-- ============================================================================
CREATE OR REPLACE FUNCTION public.trigger_update_helper_stats()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM public.update_helper_statistics(NEW.assigned_helper_id);
  END IF;
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_service_request_stats ON public.service_requests;
CREATE TRIGGER trg_service_request_stats
  AFTER UPDATE ON public.service_requests
  FOR EACH ROW
  WHEN (NEW.assigned_helper_id IS NOT NULL)
  EXECUTE FUNCTION trigger_update_helper_stats();

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.find_best_helpers TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_helper_statistics TO service_role;

COMMENT ON MIGRATION IS 'Smart matching algorithm with AI scoring: rating + proximity + price + specialization + completion rate';
