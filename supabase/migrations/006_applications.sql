-- Applications & assignment for service requests

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('applied','withdrawn','rejected','accepted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add assignment fields to service_requests
ALTER TABLE public.service_requests
ADD COLUMN IF NOT EXISTS assigned_helper_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS application_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_service_requests_assigned ON public.service_requests(assigned_helper_id);

-- Applications table
CREATE TABLE IF NOT EXISTS public.request_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  helper_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'applied',
  cover_note TEXT,
  proposed_rate DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT request_applications_unique UNIQUE(request_id, helper_id)
);

CREATE INDEX IF NOT EXISTS idx_request_applications_request ON public.request_applications(request_id);
CREATE INDEX IF NOT EXISTS idx_request_applications_helper ON public.request_applications(helper_id);
CREATE INDEX IF NOT EXISTS idx_request_applications_status ON public.request_applications(status);

-- Update timestamp trigger reuse
DROP TRIGGER IF EXISTS trg_update_request_applications ON public.request_applications;
CREATE TRIGGER trg_update_request_applications
  BEFORE UPDATE ON public.request_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.request_applications ENABLE ROW LEVEL SECURITY;

-- Helpers manage their own applications
DROP POLICY IF EXISTS "Helpers manage own applications" ON public.request_applications;
CREATE POLICY "Helpers manage own applications"
  ON public.request_applications FOR ALL
  USING (helper_id = auth.uid())
  WITH CHECK (helper_id = auth.uid());

-- Customers view applications to their requests
DROP POLICY IF EXISTS "Customers view apps to own requests" ON public.request_applications;
CREATE POLICY "Customers view apps to own requests"
  ON public.request_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.service_requests r
      WHERE r.id = request_id AND r.customer_id = auth.uid()
    )
  );

-- Admins view all
DROP POLICY IF EXISTS "Admins view all applications" ON public.request_applications;
CREATE POLICY "Admins view all applications"
  ON public.request_applications FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Maintain application_count via triggers
CREATE OR REPLACE FUNCTION public.recalc_application_count(req_id uuid)
RETURNS VOID AS $$
BEGIN
  UPDATE public.service_requests r
    SET application_count = (
      SELECT COUNT(*) FROM public.request_applications a WHERE a.request_id = req_id AND a.status = 'applied'
    ),
    updated_at = timezone('utc'::text, now())
  WHERE r.id = req_id;
END;$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.on_application_change() RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.recalc_application_count(COALESCE(NEW.request_id, OLD.request_id));
  RETURN NULL;
END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_applications_recalc_ins ON public.request_applications;
CREATE TRIGGER trg_applications_recalc_ins
  AFTER INSERT ON public.request_applications
  FOR EACH ROW EXECUTE FUNCTION public.on_application_change();

DROP TRIGGER IF EXISTS trg_applications_recalc_upd ON public.request_applications;
CREATE TRIGGER trg_applications_recalc_upd
  AFTER UPDATE ON public.request_applications
  FOR EACH ROW EXECUTE FUNCTION public.on_application_change();

DROP TRIGGER IF EXISTS trg_applications_recalc_del ON public.request_applications;
CREATE TRIGGER trg_applications_recalc_del
  AFTER DELETE ON public.request_applications
  FOR EACH ROW EXECUTE FUNCTION public.on_application_change();
