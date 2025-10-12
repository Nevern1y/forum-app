# Supabase Migrations

This directory contains SQL migration files for the forum application database schema.

## Migration Files

1. **001_add_privacy_settings.sql** - Adds privacy settings to user profiles
   - Profile visibility (public/followers_only/private)
   - Activity visibility toggles
   - Location and website fields

2. **002_add_pinned_posts.sql** - Enables post pinning feature
   - is_pinned flag on posts table
   - Indexes for efficient sorting

3. **003_create_reports_table.sql** - Moderation and reporting system
   - Reports table for user-submitted reports
   - RLS policies for security
   - Moderator permissions (based on reputation)

4. **004_create_blocked_users_table.sql** - User blocking functionality
   - blocked_users relationship table
   - RLS policies for privacy
   - Prevents self-blocking

5. **005_create_storage_buckets.sql** - File storage setup
   - Avatars bucket (2MB limit)
   - Post images bucket (5MB limit)
   - Storage policies for access control

6. **006_add_post_reactions.sql** - Emoji reactions system
   - Extended reaction types beyond like/dislike
   - Support for 12 emoji reactions

7. **007_add_updated_at_triggers.sql** - Edit tracking
   - Automatic updated_at timestamps
   - Triggers for posts, comments, and profiles
   - History tracking foundation

## How to Run Migrations

### Option 1: Supabase CLI (Recommended)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Run all migrations
supabase db push
```

### Option 2: Supabase Dashboard

1. Go to https://app.supabase.com
2. Select your project
3. Navigate to SQL Editor
4. Copy and paste each migration file in order (001 → 007)
5. Execute each migration

### Option 3: Manual psql

```bash
psql "postgres://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
  -f supabase/migrations/001_add_privacy_settings.sql

# Repeat for each migration file
```

## Important Notes

- **Run migrations in order** (001 → 007)
- **Backup your database** before running migrations in production
- Some migrations include `IF NOT EXISTS` checks to avoid errors on re-run
- All migrations include Row Level Security (RLS) policies
- Storage buckets are created with file size and MIME type restrictions

## Rollback

To rollback a migration, you'll need to write the reverse SQL. For example:

```sql
-- To rollback 002_add_pinned_posts.sql
ALTER TABLE posts DROP COLUMN IF EXISTS is_pinned;
DROP INDEX IF EXISTS idx_posts_pinned;
DROP INDEX IF EXISTS idx_posts_pinned_sort;
```

## Testing

After running migrations, test the following:

1. Create a new post and try to pin it
2. Upload an avatar in profile settings
3. Report a post or comment
4. Block and unblock a user
5. Change privacy settings
6. React with emoji to a post
7. Edit a post and verify updated_at changes

## Troubleshooting

### Permission Errors

If you get permission errors, ensure you're connected as a superuser or have the necessary privileges.

### Bucket Already Exists

If storage buckets already exist, the migration will update their settings using `ON CONFLICT DO UPDATE`.

### RLS Policy Errors

If RLS policies fail, check that:
- The tables exist
- You're authenticated
- Your user has the necessary permissions
