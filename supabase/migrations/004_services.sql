-- Services schema: categories, helper_services, service_requests with RLS

-- Enums
DO $$ BEGIN
  CREATE TYPE service_request_status AS ENUM ('draft', 'open', 'assigned', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Categories
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_service_categories_parent ON public.service_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_service_categories_active ON public.service_categories(is_active);

-- Keep updated_at fresh
DROP TRIGGER IF EXISTS trg_update_service_categories ON public.service_categories;
CREATE TRIGGER trg_update_service_categories
  BEFORE UPDATE ON public.service_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper services (mapping helper -> category)
CREATE TABLE IF NOT EXISTS public.helper_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  helper_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  hourly_rate DECIMAL(10,2) NOT NULL,
  experience_years INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT helper_services_unique UNIQUE(helper_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_helper_services_helper ON public.helper_services(helper_id);
CREATE INDEX IF NOT EXISTS idx_helper_services_category ON public.helper_services(category_id);

DROP TRIGGER IF EXISTS trg_update_helper_services ON public.helper_services;
CREATE TRIGGER trg_update_helper_services
  BEFORE UPDATE ON public.helper_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Service requests
CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  city TEXT,
  country TEXT,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  status service_request_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_service_requests_customer ON public.service_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_category ON public.service_requests(category_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);

DROP TRIGGER IF EXISTS trg_update_service_requests ON public.service_requests;
CREATE TRIGGER trg_update_service_requests
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helper_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Policies
-- service_categories: public read active; admin manage
DROP POLICY IF EXISTS "Public can read active categories" ON public.service_categories;
CREATE POLICY "Public can read active categories"
  ON public.service_categories FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.service_categories;
CREATE POLICY "Admins can manage categories"
  ON public.service_categories FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- helper_services: helper own; admin manage
DROP POLICY IF EXISTS "Helpers manage own services" ON public.helper_services;
CREATE POLICY "Helpers manage own services"
  ON public.helper_services FOR ALL
  USING (helper_id = auth.uid())
  WITH CHECK (helper_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage all helper services" ON public.helper_services;
CREATE POLICY "Admins manage all helper services"
  ON public.helper_services FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- service_requests: customers manage own; helpers can view open (read-only); admin view all
DROP POLICY IF EXISTS "Customers manage own requests" ON public.service_requests;
CREATE POLICY "Customers manage own requests"
  ON public.service_requests FOR ALL
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Helpers can view open requests" ON public.service_requests;
CREATE POLICY "Helpers can view open requests"
  ON public.service_requests FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'helper')
    AND status = 'open'
  );

DROP POLICY IF EXISTS "Admins can view all requests" ON public.service_requests;
CREATE POLICY "Admins can view all requests"
  ON public.service_requests FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Seed some categories
INSERT INTO public.service_categories (slug, name, description)
SELECT * FROM (VALUES
  ('plumbing', 'Plumbing', 'Pipes, leaks, faucets, drains'),
  ('electrical', 'Electrical', 'Wiring, fixtures, troubleshooting'),
  ('cleaning', 'Cleaning', 'Home and office cleaning'),
  ('moving', 'Moving', 'Packing, loading, transportation'),
  ('appliance-repair', 'Appliance Repair', 'Fix refrigerators, washers, ovens')
) AS t(slug, name, description)
ON CONFLICT (slug) DO NOTHING;
