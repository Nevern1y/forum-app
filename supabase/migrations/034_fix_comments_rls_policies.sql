-- ============================================================================
-- FIX COMMENTS RLS POLICIES
-- ============================================================================
-- Adds missing Row Level Security policies for comments table
-- This allows users to create, read, update and delete their own comments
-- ============================================================================

-- Enable RLS on comments table (if not already enabled)
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to recreate them correctly)
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

-- ============================================================================
-- READ POLICY - Anyone can view comments
-- ============================================================================
CREATE POLICY "Anyone can view comments"
ON comments
FOR SELECT
TO public
USING (true);

-- ============================================================================
-- INSERT POLICY - Authenticated users can create comments
-- ============================================================================
CREATE POLICY "Authenticated users can create comments"
ON comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

-- ============================================================================
-- UPDATE POLICY - Users can update their own comments
-- ============================================================================
CREATE POLICY "Users can update own comments"
ON comments
FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- ============================================================================
-- DELETE POLICY - Users can delete their own comments
-- ============================================================================
CREATE POLICY "Users can delete own comments"
ON comments
FOR DELETE
TO authenticated
USING (auth.uid() = author_id);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT SELECT ON comments TO anon, authenticated;
GRANT INSERT ON comments TO authenticated;
GRANT UPDATE ON comments TO authenticated;
GRANT DELETE ON comments TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- You can verify the policies are created by running:
-- SELECT * FROM pg_policies WHERE tablename = 'comments';
