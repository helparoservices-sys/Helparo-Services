-- Fix missing foreign key relationship between service_requests and service_categories
-- This allows PostgREST to do joins on these tables

-- Add foreign key constraint for category_id
ALTER TABLE public.service_requests
ADD CONSTRAINT service_requests_category_id_fkey 
FOREIGN KEY (category_id) 
REFERENCES public.service_categories(id) 
ON DELETE RESTRICT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_service_requests_category_id 
ON public.service_requests(category_id);

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_service_requests_status 
ON public.service_requests(status);

-- Create composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_service_requests_status_created 
ON public.service_requests(status, created_at DESC);
