# Supabase Configuration Guide

To support room creation, user profile matching, contact lists, and realtime audio messaging, you must run the complete database schema in your Supabase dashboard.

## 1. Run the Complete SQL Schema (Required)

Instead of setting up tables individually, you should run the pre-configured [voxlink_tables.sql](file:///c:/Users/gchih/OneDrive/Desktop/WEBSITES44/VoxLink/supabase/voxlink_tables.sql) file which creates all required tables, relationships, indexes, storage buckets, and Row-Level Security (RLS) policies:

1. In your **Supabase Dashboard**, navigate to the **SQL Editor** from the left sidebar.
2. Click **New Query** (or **New blank query**).
3. Copy the entire contents of [voxlink_tables.sql](file:///c:/Users/gchih/OneDrive/Desktop/WEBSITES44/VoxLink/supabase/voxlink_tables.sql) and paste it into the editor.
4. Click **Run** in the bottom-right corner of the editor.

This script automatically creates and configures the following tables:
* `profiles` (Stores user profiles and presence status)
* `contacts` (Tracks user contact relationships)
* `groups` (Stores room information)
* `group_members` (Maps users to their joined rooms)
* `messages` (Stores chat text and voice note references)

---

### 2. Create the `audio-messages` Storage Bucket

1. Go to your Supabase project → Storage
2. Click "Create a new bucket"
3. Set the bucket name to: `audio-messages`
4. Choose "Private" for privacy (or "Public" if you want direct access)
5. Click "Create bucket"

### 3. Configure Storage Bucket Policy

Go to Storage → `audio-messages` → Policies and add:

**For authenticated users to upload:**
```sql
CREATE POLICY "Allow authenticated users to upload audio" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'audio-messages'
    AND auth.role() = 'authenticated'
  );
```

**For public access to read (if bucket is private):**
```sql
CREATE POLICY "Allow public read of audio messages" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'audio-messages');
```

### 4. Enable Row Level Security (RLS)

Make sure RLS is enabled on the `messages` table:

1. Go to Authentication → Policies
2. Ensure the `messages` table has RLS enabled
3. Add policies for anonymous users if needed:

```sql
-- Allow anonymous users to insert messages
CREATE POLICY "Allow anon to insert messages" ON messages
  FOR INSERT
  WITH CHECK (auth.role() = 'anon');

-- Allow all users to read messages
CREATE POLICY "Allow all to read messages" ON messages
  FOR SELECT
  USING (true);

-- Allow users to update their own messages
CREATE POLICY "Allow users to update own messages" ON messages
  FOR UPDATE
  USING (auth.uid() = sender_id::uuid OR auth.role() = 'anon')
  WITH CHECK (auth.uid() = sender_id::uuid OR auth.role() = 'anon');
```

### 5. Enable Realtime for Messages

In your Supabase project:

1. Go to Database → Replication
2. Toggle "Enable" for the `messages` table
3. This allows the frontend to listen to real-time changes

### 6. Update Environment Variables

Make sure your `.env` file has:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 7. Test the Setup

1. Open your VoxLink app
2. Try recording an audio message
3. Click "Send Audio"
4. The audio should upload to Supabase Storage
5. The message should appear in the chat in real-time for all users

## Troubleshooting

### Audio upload fails
- Check that the `audio-messages` bucket exists
- Verify that Storage Policies allow your auth role to upload
- Check browser console for detailed error messages

### Messages not appearing in real-time
- Verify that Realtime is enabled on the `messages` table
- Check that the `chat_id` filter matches your actual chat IDs
- Look at browser console for subscription errors

### Permission denied errors
- Review your RLS policies on both `messages` table and storage
- Make sure policies match your authentication method (anon vs authenticated)
- Test policies directly in Supabase SQL editor

## Schema Reference

### messages table
```
id (UUID, Primary Key)
chat_id (Text)
sender_id (Text)
text (Text, nullable)
voice_url (Text, nullable)
created_at (Timestamp)
read (Boolean)
updated_at (Timestamp)
```

### audio-messages bucket
- Accepts: `audio/webm`, `audio/mp3`, `audio/*`
- Path format: `audio-messages/{userId}-{timestamp}.webm`
- Public URL format: `https://your-project.supabase.co/storage/v1/object/public/audio-messages/{filePath}`
