-- Allow admins to view helper GPS location history in admin console

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can view helper location history" ON public.helper_location_history;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "Admins can view helper location history"
  ON public.helper_location_history
  FOR SELECT
  USING (public.is_admin(auth.uid()));
