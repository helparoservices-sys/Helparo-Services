-- Migration 027: Fix update_helper_statistics to remove obsolete status 'in_progress'
-- Current valid service_request_status values: draft, open, assigned, completed, cancelled
-- Adjust counts to reflect assigned + completed + cancelled only.

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
  -- Count completed and assigned/cancelled jobs (remove obsolete 'in_progress')
  SELECT 
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status IN ('assigned','completed','cancelled')),
    COUNT(*) FILTER (WHERE status = 'cancelled')
  INTO v_completed, v_assigned, v_cancellations
  FROM public.service_requests
  WHERE assigned_helper_id = p_helper_id;

  v_completion_rate := CASE 
    WHEN v_assigned > 0 THEN (v_completed::DECIMAL / v_assigned::DECIMAL) * 100
    ELSE 0
  END;

  -- Total earnings from job_earnings (net amounts if tracked in rupees NUMERIC else convert from paise)
  SELECT COALESCE(SUM(net_amount_paise)/100.0, 0)
  INTO v_total_earnings
  FROM public.job_earnings
  WHERE helper_id = p_helper_id AND status='confirmed';

  SELECT COALESCE(AVG(job_duration_minutes), 0)::INTEGER
  INTO v_avg_duration
  FROM public.service_requests
  WHERE assigned_helper_id = p_helper_id
    AND job_duration_minutes IS NOT NULL;

  SELECT COUNT(*)
  INTO v_late_arrivals
  FROM public.job_checkpoints jc
  INNER JOIN public.service_requests sr ON sr.id = jc.request_id
  WHERE sr.assigned_helper_id = p_helper_id
    AND jc.checkpoint_type = 'arrived'
    AND sr.preferred_date IS NOT NULL
    AND sr.preferred_time_start IS NOT NULL
    AND jc.created_at > ((sr.preferred_date::TEXT || ' ' || sr.preferred_time_start::TEXT)::TIMESTAMP + INTERVAL '15 minutes');

  v_on_time_pct := CASE 
    WHEN v_completed > 0 THEN ((v_completed - v_late_arrivals)::DECIMAL / v_completed::DECIMAL) * 100
    ELSE 100
  END;

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

COMMENT ON FUNCTION public.update_helper_statistics IS 'Updates helper metrics without obsolete in_progress status';