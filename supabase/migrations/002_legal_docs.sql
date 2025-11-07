-- Legal Documents and Acceptances

-- Enum for document type
DO $$ BEGIN
  CREATE TYPE legal_document_type AS ENUM ('terms', 'privacy');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Legal documents table
CREATE TABLE IF NOT EXISTS legal_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type legal_document_type NOT NULL,
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  content_md TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT legal_documents_type_version_uniq UNIQUE (type, version)
);

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION update_legal_docs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_legal_docs_updated_at ON legal_documents;
CREATE TRIGGER trg_update_legal_docs_updated_at
  BEFORE UPDATE ON legal_documents
  FOR EACH ROW EXECUTE FUNCTION update_legal_docs_updated_at();

-- Acceptances table
CREATE TABLE IF NOT EXISTS legal_acceptances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type legal_document_type NOT NULL,
  document_version INTEGER NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  ip INET,
  user_agent TEXT,
  CONSTRAINT legal_acceptances_user_doc_version_uniq UNIQUE(user_id, document_type, document_version)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_legal_docs_type_version ON legal_documents(type, version DESC);
CREATE INDEX IF NOT EXISTS idx_legal_acceptances_user ON legal_acceptances(user_id);

-- Enable RLS
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_acceptances ENABLE ROW LEVEL SECURITY;

-- Policies for legal_documents
-- Anyone can read active documents
DROP POLICY IF EXISTS "Public can read active legal docs" ON legal_documents;
CREATE POLICY "Public can read active legal docs"
  ON legal_documents FOR SELECT
  USING (is_active = TRUE);

-- Admins can insert/update/delete
DROP POLICY IF EXISTS "Admins can manage legal docs" ON legal_documents;
CREATE POLICY "Admins can manage legal docs"
  ON legal_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for legal_acceptances
-- Users can insert their own acceptance
DROP POLICY IF EXISTS "Users can insert own acceptance" ON legal_acceptances;
CREATE POLICY "Users can insert own acceptance"
  ON legal_acceptances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own acceptances
DROP POLICY IF EXISTS "Users can view own acceptances" ON legal_acceptances;
CREATE POLICY "Users can view own acceptances"
  ON legal_acceptances FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all acceptances
DROP POLICY IF EXISTS "Admins can view all acceptances" ON legal_acceptances;
CREATE POLICY "Admins can view all acceptances"
  ON legal_acceptances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seed default documents (idempotent)
INSERT INTO legal_documents (type, version, title, content_md)
SELECT 'terms', 1, 'Helparo Terms & Conditions v1',
$$# Terms & Conditions (v1)

Welcome to Helparo. By using our platform, you agree to these terms.

- You must be 18+ and provide accurate information.
- Helpers are independent contractors, not employees of Helparo.
- Payments are handled via our payment partner; platform fee may apply.
- Please read our Privacy Policy for data practices.
- In case of emergency, contact local authorities immediately.

This is an initial baseline. Updated versions may be published over time.
$$
WHERE NOT EXISTS (
  SELECT 1 FROM legal_documents WHERE type='terms' AND version=1
);

INSERT INTO legal_documents (type, version, title, content_md)
SELECT 'privacy', 1, 'Helparo Privacy Policy v1',
$$# Privacy Policy (v1)

We respect your privacy. This policy explains what data we collect and why.

- We collect account details and usage data to provide services.
- We do not sell personal data.
- We use third-party processors (e.g., authentication, payments) with safeguards.
- You can access and correct your data via your profile.

This is an initial baseline. Updated versions may be published over time.
$$
WHERE NOT EXISTS (
  SELECT 1 FROM legal_documents WHERE type='privacy' AND version=1
);
