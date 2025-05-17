-- Document storage migration SQL

-- Add document storage columns to change_request table
ALTER TABLE "change_request" 
  ADD COLUMN IF NOT EXISTS "document_data" BYTEA,
  ADD COLUMN IF NOT EXISTS "document_name" character varying,
  ADD COLUMN IF NOT EXISTS "document_mime_type" character varying;

-- Create index for faster document searches
CREATE INDEX IF NOT EXISTS idx_change_request_document_name ON "change_request" ("document_name");

-- Add this to migrations table so TypeORM knows it was applied
-- First get the next available migration ID
INSERT INTO migrations (timestamp, name)
VALUES ('1721736000000', 'AddDocumentBinaryStorage1721736000000'); 