-- Seed data for service_categories
-- Run this in your Supabase SQL Editor to populate categories

-- Clear existing categories (optional - comment out if you want to keep existing data)
-- TRUNCATE public.service_categories CASCADE;

-- Insert main service categories
INSERT INTO public.service_categories (slug, name, description, is_active) VALUES
  -- Home Services
  ('cleaning', 'Cleaning Services', 'Professional home and office cleaning', true),
  ('plumbing', 'Plumbing', 'Pipe repairs, installations, and maintenance', true),
  ('electrical', 'Electrical Work', 'Electrical repairs, wiring, and installations', true),
  ('carpentry', 'Carpentry', 'Furniture assembly, woodwork, and repairs', true),
  ('painting', 'Painting', 'Interior and exterior painting services', true),
  ('pest-control', 'Pest Control', 'Termite, rodent, and insect control', true),
  ('appliance-repair', 'Appliance Repair', 'Repair and servicing of home appliances', true),
  ('hvac', 'AC & Heating', 'Air conditioning and heating services', true),
  
  -- Beauty & Wellness
  ('salon-at-home', 'Salon at Home', 'Hair, makeup, and beauty services at your doorstep', true),
  ('spa-massage', 'Spa & Massage', 'Relaxing spa and massage therapies', true),
  ('yoga-fitness', 'Yoga & Fitness', 'Personal training and yoga sessions', true),
  ('physiotherapy', 'Physiotherapy', 'Physical therapy and rehabilitation', true),
  
  -- Professional Services
  ('tutoring', 'Tutoring', 'Academic tutoring and coaching', true),
  ('computer-repair', 'Computer Repair', 'Laptop and desktop repairs', true),
  ('photography', 'Photography', 'Professional photography services', true),
  ('event-planning', 'Event Planning', 'Birthday parties, weddings, and events', true),
  ('interior-design', 'Interior Design', 'Home decoration and design consultation', true),
  
  -- Moving & Transport
  ('packers-movers', 'Packers & Movers', 'Relocation and moving services', true),
  ('vehicle-repair', 'Vehicle Repair', 'Car and bike servicing and repairs', true),
  ('driver', 'Driver Services', 'Personal driver and chauffeur services', true),
  
  -- Care Services
  ('elderly-care', 'Elderly Care', 'Nursing and care for senior citizens', true),
  ('childcare', 'Childcare', 'Babysitting and childcare services', true),
  ('pet-care', 'Pet Care', 'Pet grooming, walking, and sitting', true),
  
  -- Specialized
  ('security', 'Security Services', 'Security guards and surveillance', true),
  ('gardening', 'Gardening', 'Lawn care and garden maintenance', true),
  ('laundry', 'Laundry Services', 'Washing, ironing, and dry cleaning', true),
  ('cooking', 'Cook/Chef', 'Personal chef and cooking services', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify insertion
SELECT 
  COUNT(*) as total_categories,
  COUNT(*) FILTER (WHERE is_active = true) as active_categories
FROM public.service_categories;

-- Show all categories
SELECT id, slug, name, is_active FROM public.service_categories ORDER BY name;
