-- Assignment #4: Version History & Document Timeline
-- Run this in Supabase Dashboard → SQL Editor

-- Tabel untuk menyimpan semua versi dokumen
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  label TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(document_id, version_number)
);

-- Index untuk query yang sering dipakai
CREATE INDEX IF NOT EXISTS document_versions_document_id_idx
  ON document_versions(document_id, version_number DESC);

-- RLS
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- Pemilik dokumen bisa lihat semua versi
CREATE POLICY "Owner can view versions"
  ON document_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_versions.document_id
        AND documents.user_id = auth.uid()
    )
  );

-- User dengan shared edit juga bisa lihat versi
CREATE POLICY "Shared edit users can view versions"
  ON document_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM document_shares
      WHERE document_shares.document_id = document_versions.document_id
        AND document_shares.permission = 'edit'
        AND (document_shares.expires_at IS NULL OR document_shares.expires_at > now())
    )
  );

-- Insert: pemilik atau shared-edit
CREATE POLICY "Owner or shared-edit can insert versions"
  ON document_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_versions.document_id
        AND documents.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM document_shares
      WHERE document_shares.document_id = document_versions.document_id
        AND document_shares.permission = 'edit'
        AND (document_shares.expires_at IS NULL OR document_shares.expires_at > now())
    )
  );
