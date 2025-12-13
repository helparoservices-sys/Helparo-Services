-- Migration 055: Fix helper rating calculation from job_ratings table
-- This fixes the bug where ratings submitted by customers were not reflecting for helpers

-- Drop old function if exists (the one that reads from reviews table)
DROP FUNCTION IF EXISTS public.update_helper_rating(UUID);

-- Create new function that updates helper rating from job_ratings table
-- Note: helper_uuid parameter is helper_profiles.id, not profiles.id
CREATE OR REPLACE FUNCTION public.update_helper_rating(helper_uuid UUID)
RETURNS VOID AS $$
DECLARE
  v_rating_sum INTEGER;
  v_rating_count INTEGER;
  v_avg_rating DECIMAL(3, 2);
  v_user_id UUID;
BEGIN
  -- Get the user_id from helper_profiles (needed for helper_rating_summary FK)
  SELECT user_id INTO v_user_id
  FROM public.helper_profiles
  WHERE id = helper_uuid;

  -- If no helper profile found, exit
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Helper profile not found for id: %', helper_uuid;
    RETURN;
  END IF;

  -- Calculate rating sum and count from job_ratings table
  SELECT 
    COALESCE(SUM(rating), 0),
    COALESCE(COUNT(*), 0)
  INTO v_rating_sum, v_rating_count
  FROM public.job_ratings 
  WHERE helper_id = helper_uuid;

  -- Calculate average rating
  IF v_rating_count > 0 THEN
    v_avg_rating := v_rating_sum::DECIMAL / v_rating_count;
  ELSE
    v_avg_rating := 0;
  END IF;

  -- Update helper_profiles with new rating
  UPDATE public.helper_profiles
  SET 
    rating_sum = v_rating_sum,
    rating_count = v_rating_count,
    updated_at = timezone('utc'::text, now())
  WHERE id = helper_uuid;

  -- Also update helper_rating_summary (uses user_id as the FK, not helper_profiles.id)
  INSERT INTO public.helper_rating_summary (
    helper_id,
    total_reviews,
    average_rating,
    avg_quality,
    avg_timeliness,
    avg_professionalism,
    avg_value,
    rating_5_count,
    rating_4_count,
    rating_3_count,
    rating_2_count,
    rating_1_count,
    last_review_at,
    updated_at
  )
  SELECT 
    v_user_id,  -- Use user_id for FK to profiles table
    COUNT(*),
    AVG(rating),
    AVG(quality_rating),
    AVG(punctuality_rating),  -- maps to timeliness
    AVG(behaviour_rating),    -- maps to professionalism
    AVG(quality_rating),      -- maps to value
    COUNT(*) FILTER (WHERE rating = 5),
    COUNT(*) FILTER (WHERE rating = 4),
    COUNT(*) FILTER (WHERE rating = 3),
    COUNT(*) FILTER (WHERE rating = 2),
    COUNT(*) FILTER (WHERE rating = 1),
    MAX(created_at),
    NOW()
  FROM public.job_ratings
  WHERE helper_id = helper_uuid
  ON CONFLICT (helper_id) DO UPDATE SET
    total_reviews = EXCLUDED.total_reviews,
    average_rating = EXCLUDED.average_rating,
    avg_quality = EXCLUDED.avg_quality,
    avg_timeliness = EXCLUDED.avg_timeliness,
    avg_professionalism = EXCLUDED.avg_professionalism,
    avg_value = EXCLUDED.avg_value,
    rating_5_count = EXCLUDED.rating_5_count,
    rating_4_count = EXCLUDED.rating_4_count,
    rating_3_count = EXCLUDED.rating_3_count,
    rating_2_count = EXCLUDED.rating_2_count,
    rating_1_count = EXCLUDED.rating_1_count,
    last_review_at = EXCLUDED.last_review_at,
    updated_at = EXCLUDED.updated_at;

  RAISE NOTICE 'Updated helper % (user_id: %) rating: sum=%, count=%, avg=%', helper_uuid, v_user_id, v_rating_sum, v_rating_count, v_avg_rating;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_helper_rating(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_helper_rating(UUID) TO service_role;

-- Create trigger to auto-update helper rating when job_ratings changes
CREATE OR REPLACE FUNCTION public.on_job_rating_change() 
RETURNS TRIGGER AS $$
BEGIN
  -- Update helper rating for the affected helper
  IF TG_OP = 'DELETE' THEN
    PERFORM public.update_helper_rating(OLD.helper_id);
  ELSE
    PERFORM public.update_helper_rating(NEW.helper_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for job_ratings table
DROP TRIGGER IF EXISTS trg_job_rating_insert ON public.job_ratings;
CREATE TRIGGER trg_job_rating_insert
  AFTER INSERT ON public.job_ratings
  FOR EACH ROW EXECUTE FUNCTION public.on_job_rating_change();

DROP TRIGGER IF EXISTS trg_job_rating_update ON public.job_ratings;
CREATE TRIGGER trg_job_rating_update
  AFTER UPDATE ON public.job_ratings
  FOR EACH ROW EXECUTE FUNCTION public.on_job_rating_change();

DROP TRIGGER IF EXISTS trg_job_rating_delete ON public.job_ratings;
CREATE TRIGGER trg_job_rating_delete
  AFTER DELETE ON public.job_ratings
  FOR EACH ROW EXECUTE FUNCTION public.on_job_rating_change();

-- Recalculate all existing helper ratings from job_ratings
DO $$
DECLARE
  helper_rec RECORD;
BEGIN
  FOR helper_rec IN SELECT DISTINCT helper_id FROM public.job_ratings LOOP
    PERFORM public.update_helper_rating(helper_rec.helper_id);
  END LOOP;
END $$;

COMMENT ON FUNCTION public.update_helper_rating IS 'Updates helper rating aggregates from job_ratings table';
