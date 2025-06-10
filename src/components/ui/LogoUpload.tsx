"use client";

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { uploadLogo, validateLogoFile, STORAGE_BUCKETS } from '@/lib/storage';

interface LogoUploadProps {
  currentLogoUrl?: string;
  onLogoChange: (url: string | null) => void;
  bucket: keyof typeof STORAGE_BUCKETS;
  label: string;
  placeholder?: string;
}

export function LogoUpload({
  currentLogoUrl,
  onLogoChange,
  bucket,
  label,
  placeholder = "Click to upload logo"
}: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentLogoUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateLogoFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Upload to Supabase Storage
      const { url, error: uploadError } = await uploadLogo(file, bucket);
      
      if (uploadError) {
        setError(uploadError);
        setPreview(currentLogoUrl || null);
        return;
      }

      if (url) {
        // Clean up preview URL
        URL.revokeObjectURL(previewUrl);
        setPreview(url);
        onLogoChange(url);
      }
    } catch (err) {
      setError('Failed to upload logo');
      setPreview(currentLogoUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setPreview(null);
    onLogoChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div className="flex items-center space-x-4">
        {/* Preview Area */}
        <div 
          onClick={triggerFileSelect}
          className="relative w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer transition-colors group"
        >
          {preview ? (
            <div className="relative w-full h-full">
              <img
                src={preview}
                alt="Logo preview"
                className="w-full h-full object-contain rounded-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full text-gray-400">
              <ImageIcon className="w-8 h-8 mb-1" />
              <span className="text-xs text-center">Upload</span>
            </div>
          )}
          
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={triggerFileSelect}
              disabled={uploading}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Choose File'}
            </button>
            
            {preview && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                disabled={uploading}
                className="flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
              >
                <X className="w-4 h-4 mr-2" />
                Remove
              </button>
            )}
          </div>
          
          <p className="mt-1 text-xs text-gray-500">
            {placeholder}. Max 5MB. JPG, PNG, GIF, WebP.
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
} 