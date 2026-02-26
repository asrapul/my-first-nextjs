-- =============================================
-- Step 1: Create document_shares table
-- =============================================
CREATE TABLE IF NOT EXISTS document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Step 2: Enable RLS
-- =============================================
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Step 3: Create RLS policies (split by operation)
-- =============================================

-- SELECT: Anyone can read shares (needed for token lookup)
CREATE POLICY "Anyone can read shares"
  ON document_shares FOR SELECT
  USING (true);

-- INSERT: Only owner can create shares
CREATE POLICY "Owner can create shares"
  ON document_shares FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- UPDATE: Only owner can update shares
CREATE POLICY "Owner can update shares"
  ON document_shares FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- DELETE: Only owner can delete shares
CREATE POLICY "Owner can delete shares"
  ON document_shares FOR DELETE
  USING (auth.uid() = owner_id);

-- =============================================
-- Step 4: Update documents RLS for shared access
-- =============================================
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
    OR EXISTS (
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
    OR EXISTS (
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
