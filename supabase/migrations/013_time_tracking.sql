-- Time Tracking & Proof of Work: Track job progress with timestamps and photo verification
-- Migration 013: Job time tracking and completion proof

-- ============================================================================
-- ENHANCE SERVICE_REQUESTS WITH TIME TRACKING
-- ============================================================================

-- Add time tracking fields to service_requests
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS job_started_at TIMESTAMPTZ, -- When helper started work
  ADD COLUMN IF NOT EXISTS job_completed_at TIMESTAMPTZ, -- When helper finished
  ADD COLUMN IF NOT EXISTS job_duration_minutes INTEGER, -- Actual time taken (auto-calculated)
  ADD COLUMN IF NOT EXISTS arrival_time TIMESTAMPTZ, -- When helper arrived at location
  ADD COLUMN IF NOT EXISTS requires_proof BOOLEAN DEFAULT TRUE; -- Proof of work mandatory

CREATE INDEX IF NOT EXISTS idx_requests_job_started 
  ON public.service_requests(job_started_at);

CREATE INDEX IF NOT EXISTS idx_requests_job_completed 
  ON public.service_requests(job_completed_at);

COMMENT ON COLUMN public.service_requests.job_started_at IS 'Timestamp when helper started working';
COMMENT ON COLUMN public.service_requests.job_completed_at IS 'Timestamp when helper finished job';
COMMENT ON COLUMN public.service_requests.job_duration_minutes IS 'Actual time taken (calculated from start to complete)';
COMMENT ON COLUMN public.service_requests.arrival_time IS 'When helper arrived at service location';
COMMENT ON COLUMN public.service_requests.requires_proof IS 'Whether photo proof is mandatory';

-- ============================================================================
-- WORK PROOFS TABLE (Photo/video evidence during service)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.work_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  proof_type TEXT NOT NULL CHECK (proof_type IN ('before', 'during', 'after', 'issue', 'completion')),
  media_url TEXT NOT NULL, -- Supabase Storage URL
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  thumbnail_url TEXT,
  caption TEXT,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  metadata JSONB DEFAULT '{}', -- file size, dimensions, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_work_proofs_request 
  ON public.work_proofs(request_id);

CREATE INDEX IF NOT EXISTS idx_work_proofs_uploaded_by 
  ON public.work_proofs(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_work_proofs_type 
  ON public.work_proofs(proof_type);

CREATE INDEX IF NOT EXISTS idx_work_proofs_created 
  ON public.work_proofs(created_at DESC);

ALTER TABLE public.work_proofs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.work_proofs IS 'Photo/video evidence uploaded during and after service';
COMMENT ON COLUMN public.work_proofs.proof_type IS 'before: before starting, during: in progress, after: completed, issue: problem found, completion: final result';

-- ============================================================================
-- RLS POLICIES FOR WORK_PROOFS
-- ============================================================================

-- Helper can upload proofs for their assigned jobs
DROP POLICY IF EXISTS "Helpers upload work proofs" ON public.work_proofs;
CREATE POLICY "Helpers upload work proofs"
  ON public.work_proofs FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.service_requests
      WHERE id = work_proofs.request_id
        AND assigned_helper_id = auth.uid()
        AND status IN ('assigned', 'completed')
    )
  );

-- Customer can view proofs for their requests
DROP POLICY IF EXISTS "Customers view proofs" ON public.work_proofs;
CREATE POLICY "Customers view proofs"
  ON public.work_proofs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.service_requests
      WHERE id = work_proofs.request_id
        AND customer_id = auth.uid()
    )
  );

-- Helper can view proofs they uploaded
DROP POLICY IF EXISTS "Helpers view own proofs" ON public.work_proofs;
CREATE POLICY "Helpers view own proofs"
  ON public.work_proofs FOR SELECT
  USING (uploaded_by = auth.uid());

-- Admins can view all proofs
DROP POLICY IF EXISTS "Admins view all proofs" ON public.work_proofs;
CREATE POLICY "Admins view all proofs"
  ON public.work_proofs FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ============================================================================
-- JOB CHECKPOINTS TABLE (Track progress milestones)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.job_checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  checkpoint_type TEXT NOT NULL CHECK (checkpoint_type IN ('arrived', 'started', 'pause', 'resume', 'issue_reported', 'milestone', 'completed')),
  note TEXT,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_checkpoints_request 
  ON public.job_checkpoints(request_id);

CREATE INDEX IF NOT EXISTS idx_checkpoints_type 
  ON public.job_checkpoints(checkpoint_type);

CREATE INDEX IF NOT EXISTS idx_checkpoints_created 
  ON public.job_checkpoints(created_at DESC);

ALTER TABLE public.job_checkpoints ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.job_checkpoints IS 'Track job progress with timestamped milestones';

-- ============================================================================
-- RLS POLICIES FOR JOB_CHECKPOINTS
-- ============================================================================

-- Helper can create checkpoints for assigned jobs
DROP POLICY IF EXISTS "Helpers create checkpoints" ON public.job_checkpoints;
CREATE POLICY "Helpers create checkpoints"
  ON public.job_checkpoints FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.service_requests
      WHERE id = job_checkpoints.request_id
        AND assigned_helper_id = auth.uid()
    )
  );

-- Participants can view checkpoints
DROP POLICY IF EXISTS "Participants view checkpoints" ON public.job_checkpoints;
CREATE POLICY "Participants view checkpoints"
  ON public.job_checkpoints FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.service_requests
      WHERE id = job_checkpoints.request_id
        AND (customer_id = auth.uid() OR assigned_helper_id = auth.uid())
    )
  );

-- Admins can view all
DROP POLICY IF EXISTS "Admins view all checkpoints" ON public.job_checkpoints;
CREATE POLICY "Admins view all checkpoints"
  ON public.job_checkpoints FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ============================================================================
-- START JOB FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.start_job(
  p_request_id UUID,
  p_location_lat DECIMAL(10,8) DEFAULT NULL,
  p_location_lng DECIMAL(11,8) DEFAULT NULL,
  p_note TEXT DEFAULT NULL
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_helper_id UUID;
  v_job_started_at TIMESTAMPTZ;
BEGIN
  -- Get assigned helper
  SELECT assigned_helper_id
  INTO v_helper_id
  FROM public.service_requests
  WHERE id = p_request_id;

  -- Verify caller is assigned helper
  IF auth.uid() != v_helper_id THEN
    RAISE EXCEPTION 'Only assigned helper can start the job';
  END IF;

  -- Check if already started
  SELECT job_started_at INTO v_job_started_at
  FROM public.service_requests
  WHERE id = p_request_id;

  IF v_job_started_at IS NOT NULL THEN
    RAISE EXCEPTION 'Job already started at %', v_job_started_at;
  END IF;

  -- Update request with start time
  v_job_started_at := timezone('utc'::text, now());
  
  UPDATE public.service_requests
  SET 
    job_started_at = v_job_started_at,
    updated_at = v_job_started_at
  WHERE id = p_request_id;

  -- Create checkpoint
  INSERT INTO public.job_checkpoints (request_id, checkpoint_type, note, location_lat, location_lng, created_by)
  VALUES (p_request_id, 'started', p_note, p_location_lat, p_location_lng, auth.uid());

  RETURN v_job_started_at;
END;
$$;

COMMENT ON FUNCTION public.start_job IS 'Helper marks job as started and begins timer';

-- ============================================================================
-- COMPLETE JOB FUNCTION (With auto-calculation of duration)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.complete_job(
  p_request_id UUID,
  p_location_lat DECIMAL(10,8) DEFAULT NULL,
  p_location_lng DECIMAL(11,8) DEFAULT NULL,
  p_note TEXT DEFAULT NULL,
  p_requires_proof BOOLEAN DEFAULT TRUE
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_helper_id UUID;
  v_job_started_at TIMESTAMPTZ;
  v_job_completed_at TIMESTAMPTZ;
  v_duration_minutes INTEGER;
  v_proof_count INTEGER;
BEGIN
  -- Get request details
  SELECT assigned_helper_id, job_started_at
  INTO v_helper_id, v_job_started_at
  FROM public.service_requests
  WHERE id = p_request_id;

  -- Verify caller is assigned helper
  IF auth.uid() != v_helper_id THEN
    RAISE EXCEPTION 'Only assigned helper can complete the job';
  END IF;

  -- Check if job was started
  IF v_job_started_at IS NULL THEN
    RAISE EXCEPTION 'Job must be started before it can be completed';
  END IF;

  -- Check if proof is required and uploaded
  IF p_requires_proof THEN
    SELECT COUNT(*) INTO v_proof_count
    FROM public.work_proofs
    WHERE request_id = p_request_id
      AND proof_type IN ('after', 'completion');
    
    IF v_proof_count = 0 THEN
      RAISE EXCEPTION 'At least one completion proof photo is required';
    END IF;
  END IF;

  -- Calculate completion time and duration
  v_job_completed_at := timezone('utc'::text, now());
  v_duration_minutes := EXTRACT(EPOCH FROM (v_job_completed_at - v_job_started_at)) / 60;

  -- Update request
  UPDATE public.service_requests
  SET 
    job_completed_at = v_job_completed_at,
    job_duration_minutes = v_duration_minutes,
    status = 'completed',
    updated_at = v_job_completed_at
  WHERE id = p_request_id;

  -- Create checkpoint
  INSERT INTO public.job_checkpoints (request_id, checkpoint_type, note, location_lat, location_lng, created_by)
  VALUES (p_request_id, 'completed', p_note, p_location_lat, p_location_lng, auth.uid());

  RETURN v_job_completed_at;
END;
$$;

COMMENT ON FUNCTION public.complete_job IS 'Helper marks job as completed with duration calculation';

-- ============================================================================
-- RECORD ARRIVAL FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.record_arrival(
  p_request_id UUID,
  p_location_lat DECIMAL(10,8) DEFAULT NULL,
  p_location_lng DECIMAL(11,8) DEFAULT NULL,
  p_note TEXT DEFAULT NULL
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_helper_id UUID;
  v_arrival_time TIMESTAMPTZ;
BEGIN
  -- Get assigned helper
  SELECT assigned_helper_id
  INTO v_helper_id
  FROM public.service_requests
  WHERE id = p_request_id;

  -- Verify caller is assigned helper
  IF auth.uid() != v_helper_id THEN
    RAISE EXCEPTION 'Only assigned helper can record arrival';
  END IF;

  -- Record arrival time
  v_arrival_time := timezone('utc'::text, now());
  
  UPDATE public.service_requests
  SET 
    arrival_time = v_arrival_time,
    updated_at = v_arrival_time
  WHERE id = p_request_id;

  -- Create checkpoint
  INSERT INTO public.job_checkpoints (request_id, checkpoint_type, note, location_lat, location_lng, created_by)
  VALUES (p_request_id, 'arrived', p_note, p_location_lat, p_location_lng, auth.uid());

  RETURN v_arrival_time;
END;
$$;

COMMENT ON FUNCTION public.record_arrival IS 'Helper records arrival at service location';

-- ============================================================================
-- GET JOB TIMELINE (All checkpoints in order)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_job_timeline(
  p_request_id UUID
)
RETURNS TABLE (
  checkpoint_type TEXT,
  note TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ,
  time_since_start INTEGER,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
  v_helper_id UUID;
  v_job_started_at TIMESTAMPTZ;
BEGIN
  -- Get request details
  SELECT sr.customer_id, sr.assigned_helper_id, sr.job_started_at
  INTO v_customer_id, v_helper_id, v_job_started_at
  FROM public.service_requests sr
  WHERE sr.id = p_request_id;

  -- Verify caller is participant
  IF auth.uid() != v_customer_id AND auth.uid() != v_helper_id AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized to view job timeline';
  END IF;

  -- Return timeline
  RETURN QUERY
  SELECT 
    jc.checkpoint_type,
    jc.note,
    p.full_name AS created_by_name,
    jc.created_at,
    CASE 
      WHEN v_job_started_at IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (jc.created_at - v_job_started_at))::INTEGER / 60
      ELSE NULL
    END AS time_since_start,
    jc.location_lat,
    jc.location_lng
  FROM public.job_checkpoints jc
  INNER JOIN public.profiles p ON p.id = jc.created_by
  WHERE jc.request_id = p_request_id
  ORDER BY jc.created_at ASC;
END;
$$;

COMMENT ON FUNCTION public.get_job_timeline IS 'Get chronological timeline of all job checkpoints';

-- ============================================================================
-- AUTO-CALCULATE DURATION ON COMPLETION (Trigger)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_job_duration()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Auto-calculate duration when job is completed
  IF NEW.job_completed_at IS NOT NULL AND OLD.job_completed_at IS NULL AND NEW.job_started_at IS NOT NULL THEN
    NEW.job_duration_minutes := EXTRACT(EPOCH FROM (NEW.job_completed_at - NEW.job_started_at)) / 60;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_job_duration ON public.service_requests;
CREATE TRIGGER trg_update_job_duration
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_job_duration();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.start_job TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_job TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_arrival TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_job_timeline TO authenticated;

COMMENT ON MIGRATION IS 'Time tracking and proof of work with photo verification and job timeline';
