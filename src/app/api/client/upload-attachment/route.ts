import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface ClientUploadRequest {
  file: File;
  rfi_id: string;
  client_token: string;
  client_uploaded_by: string;
  attachment_category: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get client token from headers
    const clientToken = request.headers.get('X-Client-Token');
    const clientEmail = request.headers.get('X-Client-Email');

    if (!clientToken) {
      return NextResponse.json(
        { error: 'Client token required' },
        { status: 401 }
      );
    }

    // Validate client session
    const { data: sessionData, error: sessionError } = await supabase
      .rpc('validate_client_session', { p_token: clientToken });

    if (sessionError || !sessionData || sessionData.length === 0 || !sessionData[0].is_valid) {
      return NextResponse.json(
        { error: 'Invalid or expired client session' },
        { status: 401 }
      );
    }

    const session = sessionData[0];
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const rfiId = formData.get('rfi_id') as string;
    const clientUploadedBy = formData.get('client_uploaded_by') as string;
    const attachmentCategory = formData.get('attachment_category') as string;

    if (!file || !rfiId) {
      return NextResponse.json(
        { error: 'File and RFI ID are required' },
        { status: 400 }
      );
    }

    // Validate RFI ID matches session
    if (rfiId !== session.rfi_id) {
      return NextResponse.json(
        { error: 'RFI ID does not match client session' },
        { status: 403 }
      );
    }

    // Validate file
    const maxSize = 25 * 1024 * 1024; // 25MB for clients
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 25MB for client uploads.' },
        { status: 400 }
      );
    }

    // Allowed file types for clients
    const allowedTypes = [
      'application/pdf',
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip', 'application/x-rar-compressed'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Please upload PDF, images, documents, or archives.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `client-uploads/${rfiId}/${Date.now()}-${sanitizedFileName}`;

    try {
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('rfi-attachments')
        .upload(uniqueFileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload file to storage' },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('rfi-attachments')
        .getPublicUrl(uploadData.path);

      // Insert attachment record with client-specific fields
      const { data: attachmentData, error: attachmentError } = await supabase
        .from('rfi_attachments')
        .insert({
          rfi_id: rfiId,
          file_name: file.name,
          file_path: uploadData.path,
          file_size_bytes: file.size,
          file_size: file.size, // Also populate the new field
          file_type: file.type,
          public_url: publicUrl,
          // Client-specific fields
          uploaded_by_type: 'client',
          client_session_token: clientToken,
          attachment_category: attachmentCategory || 'client_response',
          client_uploaded_by: clientUploadedBy || clientEmail || 'Client User',
          is_visible_to_client: true,
          virus_scan_status: 'pending', // Will be updated by virus scanning process
          uploaded_by: 'client-session' // Placeholder for uploaded_by field
        })
        .select()
        .single();

      if (attachmentError) {
        console.error('Database insert error:', attachmentError);
        
        // Clean up uploaded file if database insert fails
        await supabase.storage
          .from('rfi-attachments')
          .remove([uploadData.path]);

        return NextResponse.json(
          { error: 'Failed to save attachment record' },
          { status: 500 }
        );
      }

      // Log the upload in audit trail
      await supabase
        .from('rfi_attachment_audit')
        .insert({
          attachment_id: attachmentData.id,
          rfi_id: rfiId,
          action: 'uploaded',
          performed_by: clientUploadedBy || clientEmail || 'Client User',
          performed_by_type: 'client',
          client_session_token: clientToken,
          ip_address: request.ip || null,
          user_agent: request.headers.get('user-agent') || null,
          details: {
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            category: attachmentCategory
          }
        });

      // Update client session last accessed
      await supabase
        .from('client_sessions')
        .update({ last_accessed: new Date().toISOString() })
        .eq('token', clientToken);

      return NextResponse.json({
        success: true,
        id: attachmentData.id,
        file_name: attachmentData.file_name,
        file_size: attachmentData.file_size_bytes,
        file_type: attachmentData.file_type,
        attachment_category: attachmentData.attachment_category,
        public_url: publicUrl,
        uploaded_at: attachmentData.created_at
      });

    } catch (storageError) {
      console.error('File upload error:', storageError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Client upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to upload files.' },
    { status: 405 }
  );
} 