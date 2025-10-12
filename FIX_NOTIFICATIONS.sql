-- Quick Fix: Add missing columns to notifications table
-- Run this in Supabase SQL Editor

-- Check current structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications';

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add title column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'title'
  ) THEN
    ALTER TABLE notifications ADD COLUMN title TEXT NOT NULL DEFAULT 'Новое уведомление';
  END IF;

  -- Add message column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'message'
  ) THEN
    ALTER TABLE notifications ADD COLUMN message TEXT;
  END IF;

  -- Add link column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'link'
  ) THEN
    ALTER TABLE notifications ADD COLUMN link TEXT;
  END IF;
END $$;

-- Verify structure after fix
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
