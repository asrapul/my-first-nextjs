-- =============================================
-- Assignment #2 Database Migrations
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================

-- ─────────────────────────────────────────────
-- PHASE 1: Add title column + indexes
-- ─────────────────────────────────────────────

-- Add title column if it doesn't exist
ALTER TABLE documents ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Untitled';

-- Add created_at column if it doesn't exist  
ALTER TABLE documents ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Add indexes for faster queries per user
CREATE INDEX IF NOT EXISTS documents_user_id_idx ON documents(user_id);
CREATE INDEX IF NOT EXISTS documents_updated_at_idx ON documents(user_id, updated_at DESC);


-- ─────────────────────────────────────────────
-- PHASE 3: Create document_shares table + update RLS
-- ─────────────────────────────────────────────

-- 1. Create document_shares table
CREATE TABLE IF NOT EXISTS document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

-- Only owner can manage their shares
CREATE POLICY "Owner manages own shares"
  ON document_shares FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Allow anyone to SELECT shares (needed for token lookup on shared pages)
CREATE POLICY "Anyone can read shares by token"
  ON document_shares FOR SELECT
  USING (true);

-- 2. Update RLS on documents table
-- Drop existing overly restrictive policies
DROP POLICY IF EXISTS "Users can only access own documents" ON documents;
DROP POLICY IF EXISTS "Users manage own documents" ON documents;
DROP POLICY IF EXISTS "Read own or shared documents" ON documents;
DROP POLICY IF EXISTS "Insert own documents" ON documents;
DROP POLICY IF EXISTS "Update own or edit-shared documents" ON documents;
DROP POLICY IF EXISTS "Delete own documents" ON documents;

-- Read: owner OR has valid share
CREATE POLICY "Read own or shared documents"
  ON documents FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM document_shares
      WHERE document_shares.document_id = documents.id
        AND (expires_at IS NULL OR expires_at > now())
    )
  );

-- Insert: only owner
CREATE POLICY "Insert own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update: owner OR has 'edit' share
CREATE POLICY "Update own or edit-shared documents"
  ON documents FOR UPDATE
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM document_shares
      WHERE document_shares.document_id = documents.id
        AND permission = 'edit'
        AND (expires_at IS NULL OR expires_at > now())
    )
  );

-- Delete: only owner
CREATE POLICY "Delete own documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);
