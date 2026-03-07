# Avatar Upload Setup

## Database Setup

Run the following SQL in your Supabase SQL Editor to create the avatars storage bucket:

```sql
-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Features

- ✅ Local file upload to Supabase Storage
- ✅ Automatic profile picture updates across all pages
- ✅ File validation (type, size)
- ✅ Public access to uploaded avatars
- ✅ Proper error handling
- ✅ Loading states

## API Endpoints

### POST `/api/profile/avatar`

Uploads a new avatar image for the authenticated user.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `avatar` field containing the image file

**Response:**
```json
{
  "success": true,
  "avatarUrl": "https://your-project.supabase.co/storage/v1/object/public/avatars/user_id_timestamp.jpg"
}
```

**File Requirements:**
- Supported formats: JPEG, PNG, GIF, WebP
- Maximum size: 5MB

## Frontend Components

The avatar upload feature is integrated into the profile page (`/profile`). Users can click the upload button on their profile picture to select and upload a new avatar.

## Security

- Only authenticated users can upload avatars
- Files are validated for type and size
- Users can only upload to their own user folder
- Public read access for displaying avatars