-- Migration: Allow helpers to view SOS alerts they've acknowledged
-- This adds an RLS policy so helpers can see customer SOS alerts they're responding to

-- Helpers can view SOS alerts they have acknowledged
DROP POLICY IF EXISTS "Helpers view acknowledged sos alerts" ON public.sos_alerts;
CREATE POLICY "Helpers view acknowledged sos alerts"
  ON public.sos_alerts FOR SELECT
  USING (acknowledged_by = auth.uid());

-- Helpers can update SOS alerts they have acknowledged (to mark resolved, etc.)
DROP POLICY IF EXISTS "Helpers update acknowledged sos alerts" ON public.sos_alerts;
CREATE POLICY "Helpers update acknowledged sos alerts"
  ON public.sos_alerts FOR UPDATE
  USING (acknowledged_by = auth.uid())
  WITH CHECK (acknowledged_by = auth.uid());
