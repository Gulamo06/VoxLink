import { supabase } from '../lib/supabase';

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
      const filePath = `audio-messages/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage.from('audio-messages').upload(filePath, audioBlob, {
        contentType: 'audio/webm',
        cacheControl: '3600'
      });

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Upload failed - no data returned');
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage.from('audio-messages').getPublicUrl(data.path);

      if (!publicUrlData?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('Audio upload failed:', err);
      throw err;
    }
  }
};
