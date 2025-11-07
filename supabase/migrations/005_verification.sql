-- Verification schema, policies, and tightened helper access

-- Enums
DO $$ BEGIN
  CREATE TYPE verification_doc_type AS ENUM ('id_front','id_back','selfie','certificate','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE verification_decision AS ENUM ('approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Documents table
CREATE TABLE IF NOT EXISTS public.verification_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doc_type verification_doc_type NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_verification_documents_user ON public.verification_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_documents_type ON public.verification_documents(doc_type);

-- Reviews table
CREATE TABLE IF NOT EXISTS public.verification_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  helper_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  decision verification_decision NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_verification_reviews_helper ON public.verification_reviews(helper_user_id);
CREATE INDEX IF NOT EXISTS idx_verification_reviews_admin ON public.verification_reviews(admin_user_id);

-- Enable RLS
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_reviews ENABLE ROW LEVEL SECURITY;

-- Policies for verification_documents
DROP POLICY IF EXISTS "Users manage own verification docs" ON public.verification_documents;
CREATE POLICY "Users manage own verification docs"
  ON public.verification_documents FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins view all verification docs" ON public.verification_documents;
CREATE POLICY "Admins view all verification docs"
  ON public.verification_documents FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Policies for verification_reviews
DROP POLICY IF EXISTS "Admins manage verification reviews" ON public.verification_reviews;
CREATE POLICY "Admins manage verification reviews"
  ON public.verification_reviews FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Tighten helper access to open requests: must be approved
DO $$ BEGIN
  DROP POLICY IF EXISTS "Helpers can view open requests" ON public.service_requests;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "Helpers can view open requests"
  ON public.service_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid() AND pr.role = 'helper'
    )
    AND EXISTS (
      SELECT 1 FROM public.helper_profiles hp
      WHERE hp.user_id = auth.uid() AND hp.is_approved = TRUE AND hp.verification_status = 'approved'
    )
    AND status = 'open'
  );

-- Storage bucket for KYC docs
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc', 'kyc', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for bucket 'kyc'
-- Owners can upload/select/delete their own files under path auth.uid()/...
DROP POLICY IF EXISTS "KYC owners read" ON storage.objects;
CREATE POLICY "KYC owners read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kyc' AND split_part(name, '/', 1) = auth.uid()::text
  );

DROP POLICY IF EXISTS "KYC owners write" ON storage.objects;
CREATE POLICY "KYC owners write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'kyc' AND split_part(name, '/', 1) = auth.uid()::text
  );

DROP POLICY IF EXISTS "KYC owners delete" ON storage.objects;
CREATE POLICY "KYC owners delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'kyc' AND split_part(name, '/', 1) = auth.uid()::text
  );

-- Admins can read all in kyc
DROP POLICY IF EXISTS "KYC admins read all" ON storage.objects;
CREATE POLICY "KYC admins read all"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kyc' AND public.is_admin(auth.uid())
  );
