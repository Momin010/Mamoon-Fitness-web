
import React, { useState, useRef } from 'react';
import { Camera, X, Upload, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSupabase } from '../context/SupabaseContext';

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  onCancel: () => void;
  bucket?: string;
  folder?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUploaded,
  onCancel,
  bucket = 'images',
  folder = 'uploads'
}) => {
  const { user } = useSupabase();
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const compressImage = (dataUrl: string, maxWidth: number = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = dataUrl;
    });
  };

  const handleUpload = async () => {
    if (!preview) return;
    if (!user) {
      setError('You must be signed in to upload images');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // Compress image
      const compressed = await compressImage(preview);
      
      // Convert to blob
      const response = await fetch(compressed);
      const blob = await response.blob();
      
      // Generate unique filename with user ID for RLS
      const filename = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      
      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filename, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filename);

      onImageUploaded(publicUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Upload Image</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {!preview ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center cursor-pointer hover:border-zinc-500 transition-colors"
          >
            <Camera size={48} className="mx-auto mb-4 text-zinc-500" />
            <p className="text-zinc-400 mb-2">Click to select an image</p>
            <p className="text-zinc-600 text-sm">JPG, PNG up to 5MB</p>
          </div>
        ) : (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-xl"
            />
            <button
              onClick={() => setPreview(null)}
              className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-zinc-700 rounded-xl text-zinc-400 hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!preview || isUploading}
            className="flex-1 py-3 bg-green-500 text-black rounded-xl font-bold hover:bg-green-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={18} />
                Upload
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
