import { supabase } from '../lib/supabase';

const AUDIO_BUCKET = 'audio-messages';
const PROFILE_BUCKET = 'profile-pictures';

function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  if (!data?.publicUrl) {
    throw new Error('Failed to get public URL');
  }

  return data.publicUrl;
}

/**
 * Service for uploading files to Supabase Storage
 */
export const storageService = {
  /**
   * Upload an audio blob to Supabase Storage
   * @param audioBlob - The audio Blob to upload
   * @param userId - The user ID for organizing files
   * @returns Public URL of the uploaded file
   */
  uploadAudio: async (audioBlob: Blob, userId: string): Promise<string> => {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const fileName = `${userId}-${Date.now()}.webm`;
      const filePath = `audio-messages/${userId}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage.from(AUDIO_BUCKET).upload(filePath, audioBlob, {
        contentType: 'audio/webm',
        cacheControl: '3600'
      });

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Upload failed - no data returned');
      }

      return getPublicUrl(AUDIO_BUCKET, data.path);
    } catch (err) {
      console.error('Audio upload failed:', err);
      throw err;
    }
  },

  /**
   * Upload a profile picture to Supabase Storage
   * @param imageFile - The selected image file
   * @param userId - The user ID for organizing files
   * @returns Public URL of the uploaded image
   */
  uploadProfilePicture: async (imageFile: File, userId: string): Promise<string> => {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const filePath = `avatars/${userId}/profile`;
      const contentType = imageFile.type || 'image/jpeg';

      const { data, error } = await supabase.storage.from(PROFILE_BUCKET).upload(filePath, imageFile, {
        cacheControl: '3600',
        contentType,
        upsert: true
      });

      if (error) {
        throw error;
      }

      const storedPath = data?.path ?? filePath;
      const publicUrl = getPublicUrl(PROFILE_BUCKET, storedPath);

      return `${publicUrl}?t=${Date.now()}`;
    } catch (err) {
      console.error('Profile picture upload failed:', err);
      throw err;
    }
  }
};
