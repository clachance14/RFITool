import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface ClientUploadRequest {
  file: File;
  rfi_id: string;
  client_token: string;
  client_uploaded_by: string;
  attachment_category: string;
}

// Validate a secure link token (matching the main RFI endpoint)
async function validateToken(token: string): Promise<{
  valid: boolean;
  rfi?: any;
  reason?: string;
}> {
  try {
    const { data: rfi, error } = await supabaseAdmin
      .from('rfis')
      .select(`
        *,
        projects!inner(
          id,
          project_name,
          client_company_name,
          contractor_job_number
        )
      `)
      .eq('secure_link_token', token)
      .single();

    if (error || !rfi) {
      return {
        valid: false,
        reason: 'Invalid or expired link'
      };
    }

    // Check if link has expired
    if (rfi.link_expires_at && new Date(rfi.link_expires_at) < new Date()) {
      return {
        valid: false,
        reason: 'Link has expired'
      };
    }

    // Check if RFI has already been responded to
    if (rfi.status === 'responded' && !rfi.allow_multiple_responses) {
      return {
        valid: false,
        reason: 'This RFI has already been responded to'
      };
    }

    return {
      valid: true,
      rfi
    };
  } catch (error) {
    return {
      valid: false,
      reason: 'Failed to validate link'
    };
  }
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

    // Validate client token using the same method as the main RFI endpoint
    const validation = await validateToken(clientToken);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.reason || 'Invalid token' },
        { status: 401 }
      );
    }

    const rfi = validation.rfi;
    
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

    // Validate RFI ID matches token
    if (rfiId !== rfi.id) {
      return NextResponse.json(
        { error: 'RFI ID does not match client token' },
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
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
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
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('rfi-attachments')
        .getPublicUrl(uploadData.path);

      // Insert attachment record with client-specific fields (they exist in the schema)
      const { data: attachmentData, error: attachmentError } = await supabaseAdmin
        .from('rfi_attachments')
        .insert({
          rfi_id: rfiId,
          file_name: file.name,
          file_path: uploadData.path,
          file_size_bytes: file.size,
          file_size: file.size,
          file_type: file.type,
          public_url: publicUrl,
          // Client-specific fields (these columns exist in the database)
          uploaded_by_type: 'client',
          client_session_token: clientToken,
          attachment_category: attachmentCategory || 'client_response',
          client_uploaded_by: clientUploadedBy || clientEmail || 'Client User',
          is_visible_to_client: true,
          uploaded_by: null // Make this nullable since it's a UUID field for users
        })
        .select()
        .single();

      if (attachmentError) {
        console.error('Database insert error:', attachmentError);
        
        // Clean up uploaded file if database insert fails
        await supabaseAdmin.storage
          .from('rfi-attachments')
          .remove([uploadData.path]);

        return NextResponse.json(
          { error: 'Failed to save attachment record' },
          { status: 500 }
        );
      }

      // Log the upload in audit trail (optional - may not exist yet)
      try {
        await supabaseAdmin
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
      } catch (auditError) {
        // Audit logging is optional - don't fail the upload if it doesn't work
        console.warn('Audit logging failed:', auditError);
      }

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
    console.error('Upload endpoint error:', error);
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