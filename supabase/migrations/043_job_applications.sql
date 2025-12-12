-- Job Applications Table for Careers Page
-- This stores all job applications submitted through the careers page

CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Applicant Details
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  
  -- Job Details
  job_title VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  
  -- Application Details
  resume_url TEXT, -- URL to uploaded resume
  cover_letter TEXT,
  linkedin_url VARCHAR(500),
  portfolio_url VARCHAR(500),
  current_company VARCHAR(255),
  current_role VARCHAR(255),
  experience_years INTEGER,
  expected_salary VARCHAR(100),
  notice_period VARCHAR(100),
  location VARCHAR(255),
  willing_to_relocate BOOLEAN DEFAULT false,
  
  -- Additional Info
  how_did_you_hear VARCHAR(255),
  additional_info TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'shortlisted', 'interview', 'offered', 'hired', 'rejected')),
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_department ON job_applications(department);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON job_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_email ON job_applications(email);

-- Enable RLS
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Allow anyone to insert (public applications)
CREATE POLICY "Anyone can submit job applications"
ON job_applications FOR INSERT
TO public
WITH CHECK (true);

-- Only admins can view applications
CREATE POLICY "Admins can view all job applications"
ON job_applications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Only admins can update applications
CREATE POLICY "Admins can update job applications"
ON job_applications FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Only admins can delete applications
CREATE POLICY "Admins can delete job applications"
ON job_applications FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_application_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_job_application_timestamp();

-- Create storage bucket for resumes (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for resumes bucket
CREATE POLICY "Anyone can upload resumes"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Admins can view resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
