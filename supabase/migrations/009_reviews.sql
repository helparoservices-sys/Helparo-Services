-- Reviews for completed requests and helper aggregates

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT reviews_unique_once_per_pair UNIQUE (request_id, reviewer_id, reviewee_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_request ON public.reviews(request_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS: Only participants of a completed request can insert, and each only once per counterpart
DROP POLICY IF EXISTS "Participants can read own activity" ON public.reviews;
CREATE POLICY "Participants can read own activity"
  ON public.reviews FOR SELECT
  USING (
    reviewer_id = auth.uid() OR reviewee_id = auth.uid() OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Participants insert one review" ON public.reviews;
CREATE POLICY "Participants insert one review"
  ON public.reviews FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.service_requests r
      WHERE r.id = request_id AND r.status = 'completed' AND (
        (r.customer_id = reviewer_id AND r.assigned_helper_id = reviewee_id) OR
        (r.assigned_helper_id = reviewer_id AND r.customer_id = reviewee_id)
      )
    )
  );

-- Aggregates on helper_profiles
ALTER TABLE public.helper_profiles
  ADD COLUMN IF NOT EXISTS rating_sum INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.update_helper_rating(reviewee uuid)
RETURNS VOID AS $$
BEGIN
  UPDATE public.helper_profiles hp
  SET rating_sum = COALESCE((
    SELECT SUM(rating) FROM public.reviews WHERE reviewee_id = reviewee
  ),0),
  rating_count = COALESCE((
    SELECT COUNT(*) FROM public.reviews WHERE reviewee_id = reviewee
  ),0),
  updated_at = timezone('utc'::text, now())
  WHERE hp.user_id = reviewee;
END;$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.on_review_change() RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.update_helper_rating(COALESCE(NEW.reviewee_id, OLD.reviewee_id));
  RETURN NULL;
END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reviews_change_ins ON public.reviews;
CREATE TRIGGER trg_reviews_change_ins
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.on_review_change();

DROP TRIGGER IF EXISTS trg_reviews_change_upd ON public.reviews;
CREATE TRIGGER trg_reviews_change_upd
  AFTER UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.on_review_change();

DROP TRIGGER IF EXISTS trg_reviews_change_del ON public.reviews;
CREATE TRIGGER trg_reviews_change_del
  AFTER DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.on_review_change();
