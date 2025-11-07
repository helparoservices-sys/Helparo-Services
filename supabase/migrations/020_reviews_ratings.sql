-- Ratings & Reviews System
-- Migration 020: Comprehensive review system with photos, responses, and moderation

-- ============================================================================
-- ENSURE REQUIRED COLUMNS EXIST
-- ============================================================================
-- Add assigned_helper_id if it doesn't exist (should be from migration 011)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'service_requests' 
    AND column_name = 'assigned_helper_id'
  ) THEN
    ALTER TABLE public.service_requests
      ADD COLUMN assigned_helper_id UUID REFERENCES public.profiles(id);
    
    CREATE INDEX IF NOT EXISTS idx_service_requests_assigned_helper 
      ON public.service_requests(assigned_helper_id);
  END IF;
END $$;

-- ============================================================================
-- REVIEWS & RATINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id),
  helper_id UUID NOT NULL REFERENCES public.profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  is_verified_booking BOOLEAN DEFAULT TRUE,
  is_moderated BOOLEAN DEFAULT FALSE,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  helper_response TEXT,
  helper_responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reviews_helper ON public.reviews(helper_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer ON public.reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_request ON public.reviews(request_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON public.reviews(created_at DESC);

DROP TRIGGER IF EXISTS trg_update_reviews ON public.reviews;
CREATE TRIGGER trg_update_reviews
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.reviews IS 'Customer reviews and ratings for helpers';

-- ============================================================================
-- REVIEW PHOTOS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.review_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_review_photos_review ON public.review_photos(review_id);

ALTER TABLE public.review_photos ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER RATING AGGREGATE (Denormalized for performance)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.helper_rating_summary (
  helper_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  rating_5_count INTEGER DEFAULT 0,
  rating_4_count INTEGER DEFAULT 0,
  rating_3_count INTEGER DEFAULT 0,
  rating_2_count INTEGER DEFAULT 0,
  rating_1_count INTEGER DEFAULT 0,
  avg_quality DECIMAL(3,2) DEFAULT 0,
  avg_timeliness DECIMAL(3,2) DEFAULT 0,
  avg_professionalism DECIMAL(3,2) DEFAULT 0,
  avg_value DECIMAL(3,2) DEFAULT 0,
  last_review_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_helper_rating_summary_avg ON public.helper_rating_summary(average_rating DESC);

ALTER TABLE public.helper_rating_summary ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
-- Anyone can read reviews for helpers
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

-- Customers can create reviews for their completed requests
DROP POLICY IF EXISTS "Customers create reviews" ON public.reviews;
CREATE POLICY "Customers create reviews" ON public.reviews
  FOR INSERT WITH CHECK (
    customer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.service_requests
      WHERE id = reviews.request_id
        AND customer_id = auth.uid()
        AND status::TEXT = 'completed'
    )
  );

-- Helpers can respond to their reviews
DROP POLICY IF EXISTS "Helpers respond to reviews" ON public.reviews;
CREATE POLICY "Helpers respond to reviews" ON public.reviews
  FOR UPDATE USING (reviews.helper_id = auth.uid())
  WITH CHECK (reviews.helper_id = auth.uid());

-- Admins can moderate reviews
DROP POLICY IF EXISTS "Admins moderate reviews" ON public.reviews;
CREATE POLICY "Admins moderate reviews" ON public.reviews
  FOR UPDATE USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Review photos policies
DROP POLICY IF EXISTS "Anyone view review photos" ON public.review_photos;
CREATE POLICY "Anyone view review photos" ON public.review_photos
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Review owner upload photos" ON public.review_photos;
CREATE POLICY "Review owner upload photos" ON public.review_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviews
      WHERE id = review_photos.review_id
        AND customer_id = auth.uid()
    )
  );

-- Helper rating summary is public
DROP POLICY IF EXISTS "Anyone view ratings" ON public.helper_rating_summary;
CREATE POLICY "Anyone view ratings" ON public.helper_rating_summary
  FOR SELECT USING (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================
-- Submit review
CREATE OR REPLACE FUNCTION public.submit_review(
  p_request_id UUID,
  p_rating INTEGER,
  p_review_text TEXT DEFAULT NULL,
  p_quality INTEGER DEFAULT NULL,
  p_timeliness INTEGER DEFAULT NULL,
  p_professionalism INTEGER DEFAULT NULL,
  p_value_rating INTEGER DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_helper_id UUID;
  v_customer_id UUID;
  v_review_id UUID;
  v_request_status service_request_status;
BEGIN
  -- Get request details
  SELECT assigned_helper_id, customer_id, status::service_request_status
  INTO v_helper_id, v_customer_id, v_request_status
  FROM public.service_requests
  WHERE id = p_request_id;

  IF v_helper_id IS NULL THEN
    RAISE EXCEPTION 'Request has no assigned helper';
  END IF;

  IF auth.uid() != v_customer_id THEN
    RAISE EXCEPTION 'Only customer can review this service';
  END IF;

  IF v_request_status::TEXT != 'completed' THEN
    RAISE EXCEPTION 'Can only review completed services';
  END IF;

  -- Check if already reviewed
  IF EXISTS (SELECT 1 FROM public.reviews WHERE request_id = p_request_id) THEN
    RAISE EXCEPTION 'Request already reviewed';
  END IF;

  -- Insert review
  INSERT INTO public.reviews (
    request_id, customer_id, helper_id, rating, review_text,
    quality_rating, timeliness_rating, professionalism_rating, value_rating
  ) VALUES (
    p_request_id, v_customer_id, v_helper_id, p_rating, p_review_text,
    p_quality, p_timeliness, p_professionalism, p_value_rating
  ) RETURNING id INTO v_review_id;

  -- Update helper rating summary
  PERFORM public.update_helper_rating_summary(v_helper_id);

  RETURN v_review_id;
END;$$;

COMMENT ON FUNCTION public.submit_review IS 'Customer submits review for completed service';

-- Update helper rating summary
CREATE OR REPLACE FUNCTION public.update_helper_rating_summary(p_helper_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total INTEGER;
  v_avg DECIMAL(3,2);
  v_r5 INTEGER;
  v_r4 INTEGER;
  v_r3 INTEGER;
  v_r2 INTEGER;
  v_r1 INTEGER;
  v_qual DECIMAL(3,2);
  v_time DECIMAL(3,2);
  v_prof DECIMAL(3,2);
  v_val DECIMAL(3,2);
  v_last TIMESTAMPTZ;
BEGIN
  SELECT 
    COUNT(*),
    ROUND(AVG(rating), 2),
    COUNT(*) FILTER (WHERE rating = 5),
    COUNT(*) FILTER (WHERE rating = 4),
    COUNT(*) FILTER (WHERE rating = 3),
    COUNT(*) FILTER (WHERE rating = 2),
    COUNT(*) FILTER (WHERE rating = 1),
    ROUND(AVG(quality_rating), 2),
    ROUND(AVG(timeliness_rating), 2),
    ROUND(AVG(professionalism_rating), 2),
    ROUND(AVG(value_rating), 2),
    MAX(created_at)
  INTO v_total, v_avg, v_r5, v_r4, v_r3, v_r2, v_r1, v_qual, v_time, v_prof, v_val, v_last
  FROM public.reviews
  WHERE helper_id = p_helper_id AND is_moderated = FALSE;

  INSERT INTO public.helper_rating_summary (
    helper_id, total_reviews, average_rating,
    rating_5_count, rating_4_count, rating_3_count, rating_2_count, rating_1_count,
    avg_quality, avg_timeliness, avg_professionalism, avg_value, last_review_at
  ) VALUES (
    p_helper_id, v_total, v_avg, v_r5, v_r4, v_r3, v_r2, v_r1, v_qual, v_time, v_prof, v_val, v_last
  )
  ON CONFLICT (helper_id) DO UPDATE SET
    total_reviews = EXCLUDED.total_reviews,
    average_rating = EXCLUDED.average_rating,
    rating_5_count = EXCLUDED.rating_5_count,
    rating_4_count = EXCLUDED.rating_4_count,
    rating_3_count = EXCLUDED.rating_3_count,
    rating_2_count = EXCLUDED.rating_2_count,
    rating_1_count = EXCLUDED.rating_1_count,
    avg_quality = EXCLUDED.avg_quality,
    avg_timeliness = EXCLUDED.avg_timeliness,
    avg_professionalism = EXCLUDED.avg_professionalism,
    avg_value = EXCLUDED.avg_value,
    last_review_at = EXCLUDED.last_review_at,
    updated_at = timezone('utc'::text, now());
END;$$;

-- Helper responds to review
CREATE OR REPLACE FUNCTION public.respond_to_review(
  p_review_id UUID,
  p_response TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_helper_id UUID;
BEGIN
  SELECT helper_id INTO v_helper_id FROM public.reviews WHERE id = p_review_id;

  IF auth.uid() != v_helper_id THEN
    RAISE EXCEPTION 'Only helper can respond to this review';
  END IF;

  UPDATE public.reviews
  SET helper_response = p_response,
      helper_responded_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_review_id;

  RETURN FOUND;
END;$$;

-- Get helper reviews
CREATE OR REPLACE FUNCTION public.get_helper_reviews(
  p_helper_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  review_id UUID,
  rating INTEGER,
  review_text TEXT,
  customer_name TEXT,
  created_at TIMESTAMPTZ,
  helper_response TEXT,
  photo_count INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.rating,
    r.review_text,
    p.full_name,
    r.created_at,
    r.helper_response,
    (SELECT COUNT(*)::INTEGER FROM public.review_photos WHERE review_id = r.id)
  FROM public.reviews r
  INNER JOIN public.profiles p ON p.id = r.customer_id
  WHERE r.helper_id = p_helper_id
    AND r.is_moderated = FALSE
  ORDER BY r.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;$$;

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.submit_review TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_review TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_helper_reviews TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_helper_rating_summary TO service_role;

COMMENT ON MIGRATION IS 'Comprehensive reviews & ratings system with photos, responses, and moderation';
