-- Fix infinite recursion in RLS by introducing SECURITY DEFINER helper and updating policies

-- Helper function: check if current user is admin (bypasses RLS using SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uid AND p.role = 'admin'
  );
$$;

-- PROFILES: replace admin policies to use is_admin()
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Optional: allow admins to update all profiles
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- HELPER_PROFILES: replace admin policies to use is_admin()
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can view all helper profiles" ON public.helper_profiles;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "Admins can view all helper profiles"
  ON public.helper_profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can update all helper profiles" ON public.helper_profiles;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "Admins can update all helper profiles"
  ON public.helper_profiles FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- LEGAL_DOCUMENTS: replace admin manage policy to use is_admin()
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can manage legal docs" ON public.legal_documents;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "Admins can manage legal docs"
  ON public.legal_documents FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- LEGAL_ACCEPTANCES: replace admin view policy to use is_admin()
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can view all acceptances" ON public.legal_acceptances;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "Admins can view all acceptances"
  ON public.legal_acceptances FOR SELECT
  USING (public.is_admin(auth.uid()));
