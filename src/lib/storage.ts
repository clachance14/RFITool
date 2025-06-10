import { supabase } from './supabase';

// Storage bucket names
export const STORAGE_BUCKETS = {
  COMPANY_LOGOS: 'company-logos',
  CLIENT_LOGOS: 'client-logos',
  RFI_ATTACHMENTS: 'rfi-attachments',
} as const;

// Upload file to Supabase Storage
export async function uploadLogo(
  file: File,
  bucket: keyof typeof STORAGE_BUCKETS,
  fileName?: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    // Debug: Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Upload session check:', { session: session?.user?.id, error: sessionError });
    
    if (!session) {
      return { url: null, error: 'User not authenticated' };
    }

    // Generate unique filename if not provided
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = fileName || `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    
    // Upload file to storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS[bucket])
      .upload(uniqueFileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      return { url: null, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKETS[bucket])
      .getPublicUrl(data.path);

    return { url: publicUrl, error: null };
  } catch (err) {
    console.error('Upload error:', err);
    return { url: null, error: 'Failed to upload file' };
  }
}

// Delete file from Supabase Storage
export async function deleteLogo(
  bucket: keyof typeof STORAGE_BUCKETS,
  filePath: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS[bucket])
      .remove([filePath]);

    if (error) {
      console.error('Storage delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Delete error:', err);
    return { success: false, error: 'Failed to delete file' };
  }
}

// Get file path from full URL
export function getFilePathFromUrl(url: string, bucket: keyof typeof STORAGE_BUCKETS): string {
  const bucketName = STORAGE_BUCKETS[bucket];
  const pattern = new RegExp(`${bucketName}/(.+)$`);
  const match = url.match(pattern);
  return match ? match[1] : '';
}

// Upload RFI attachment
export async function uploadAttachment(
  file: File,
  rfiId: string,
  fileName?: string
): Promise<{ url: string | null; path: string | null; error: string | null }> {
  try {
    // Debug: Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Upload session check:', { session: session?.user?.id, error: sessionError });
    
    if (!session) {
      return { url: null, path: null, error: 'User not authenticated' };
    }

    // Generate unique filename if not provided
    const fileExtension = file.name.split('.').pop();
    const sanitizedFileName = fileName || file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${rfiId}/${Date.now()}-${sanitizedFileName}`;
    
    // Upload file to storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.RFI_ATTACHMENTS)
      .upload(uniqueFileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      return { url: null, path: null, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKETS.RFI_ATTACHMENTS)
      .getPublicUrl(data.path);

    return { url: publicUrl, path: data.path, error: null };
  } catch (err) {
    console.error('Upload error:', err);
    return { url: null, path: null, error: 'Failed to upload file' };
  }
}

// Delete RFI attachment
export async function deleteAttachment(
  filePath: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.RFI_ATTACHMENTS)
      .remove([filePath]);

    if (error) {
      console.error('Storage delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Delete error:', err);
    return { success: false, error: 'Failed to delete file' };
  }
}

// Validate file type and size
export function validateLogoFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  return { valid: true };
}

// Validate RFI attachment file
export function validateAttachmentFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    // Documents
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Text files
    'text/plain', 'text/csv',
    // Archives
    'application/zip', 'application/x-rar-compressed'
  ];
  const maxSize = 50 * 1024 * 1024; // 50MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not supported. Please upload documents, images, or archive files.' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 50MB' };
  }

  return { valid: true };
} 