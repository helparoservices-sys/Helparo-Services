-- Add audience support for role-specific legal documents

DO $$ BEGIN
  CREATE TYPE legal_document_audience AS ENUM ('all', 'customer', 'helper');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add audience column to legal_documents
ALTER TABLE legal_documents
  ADD COLUMN IF NOT EXISTS audience legal_document_audience NOT NULL DEFAULT 'all';

-- Adjust unique constraint to include audience
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'legal_documents_type_version_uniq'
      AND conrelid = 'legal_documents'::regclass
  ) THEN
    ALTER TABLE legal_documents DROP CONSTRAINT legal_documents_type_version_uniq;
  END IF;
END $$;

ALTER TABLE legal_documents
  ADD CONSTRAINT legal_documents_type_audience_version_uniq UNIQUE (type, audience, version);

-- Keep index useful for lookups
CREATE INDEX IF NOT EXISTS idx_legal_docs_type_audience_version
  ON legal_documents(type, audience, version DESC);

-- Add audience column to acceptances so acceptance is tied to the specific doc shown
ALTER TABLE legal_acceptances
  ADD COLUMN IF NOT EXISTS document_audience legal_document_audience NOT NULL DEFAULT 'all';

-- Adjust acceptance unique constraint to include audience
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'legal_acceptances_user_doc_version_uniq'
      AND conrelid = 'legal_acceptances'::regclass
  ) THEN
    ALTER TABLE legal_acceptances DROP CONSTRAINT legal_acceptances_user_doc_version_uniq;
  END IF;
END $$;

ALTER TABLE legal_acceptances
  ADD CONSTRAINT legal_acceptances_user_doc_audience_version_uniq UNIQUE(user_id, document_type, document_audience, document_version);

CREATE INDEX IF NOT EXISTS idx_legal_acceptances_user_doc
  ON legal_acceptances(user_id, document_type, document_audience, document_version);
