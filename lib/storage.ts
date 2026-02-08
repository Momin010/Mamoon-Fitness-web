import { supabase } from './supabase';

/**
 * Uploads a file to a Supabase storage bucket.
 * @param file The file object to upload.
 * @param bucket The storage bucket name (e.g., 'social_media', 'avatars').
 * @param folder Optional folder path within the bucket.
 * @returns The public URL of the uploaded file.
 */
export const uploadFile = async (file: File, bucket: string = 'social_media', folder: string = '') => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return data.publicUrl;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};
