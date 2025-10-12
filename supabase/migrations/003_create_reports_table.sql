-- Migration: Create reports/moderation system
-- Description: Allow users to report inappropriate content
-- Date: 2024

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'user')),
  content_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'spam',
    'harassment',
    'hate_speech',
    'violence',
    'misinformation',
    'illegal',
    'nsfw',
    'copyright',
    'other'
  )),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE reports IS 'User reports for inappropriate content';
COMMENT ON COLUMN reports.reporter_id IS 'User who submitted the report';
COMMENT ON COLUMN reports.content_type IS 'Type of content being reported: post, comment, or user';
COMMENT ON COLUMN reports.content_id IS 'ID of the content being reported';
COMMENT ON COLUMN reports.reason IS 'Reason for the report';
COMMENT ON COLUMN reports.description IS 'Additional details about the report';
COMMENT ON COLUMN reports.status IS 'Current status of the report';
COMMENT ON COLUMN reports.reviewed_by IS 'Moderator who reviewed the report';
COMMENT ON COLUMN reports.reviewed_at IS 'When the report was reviewed';

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_content ON reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);

-- Enable Row Level Security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create reports
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Policy: Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Policy: Moderators can view all reports (add role check when implementing moderator roles)
CREATE POLICY "Moderators can view all reports"
  ON reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND reputation >= 10000
    )
  );

-- Policy: Moderators can update reports
CREATE POLICY "Moderators can update reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND reputation >= 10000
    )
  );
