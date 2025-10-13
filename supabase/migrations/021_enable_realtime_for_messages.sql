-- Enable Realtime for direct_messages table
-- This is required for real-time message delivery

-- Set REPLICA IDENTITY to FULL for realtime to work properly
ALTER TABLE direct_messages REPLICA IDENTITY FULL;

-- Add table to realtime publication (if not already added)
-- This enables realtime events for INSERT, UPDATE, DELETE
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;

-- Verify the settings
COMMENT ON TABLE direct_messages IS 'Direct messaging system with realtime enabled - v1.1';
