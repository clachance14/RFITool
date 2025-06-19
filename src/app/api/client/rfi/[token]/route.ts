import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { NotificationService } from '@/services/notificationService';

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

const clientResponseSchema = z.object({
  client_response: z.string().min(1, 'Response is required'),
  client_response_submitted_by: z.string().min(1, 'Submitter name is required'),
  response_status: z.enum(['approved', 'rejected', 'needs_clarification']),
  additional_comments: z.string().optional(),
  client_cm_approval: z.string().optional(),
  field_work_approved: z.boolean().optional()
});

// Validate a secure link token
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
          contractor_job_number,
          job_contract_number,
          project_manager_contact,
          client_logo_url,
          companies!inner(
            logo_url
          )
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

// GET /api/client/rfi/[token] - Get RFI data for client viewing
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 400 }
      );
    }

    const validation = await validateToken(token);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.reason },
        { status: 404 }
      );
    }

    // Fetch complete RFI data with attachments and cost items
    const { data: attachments } = await supabaseAdmin
      .from('rfi_attachments')
      .select('*')
      .eq('rfi_id', validation.rfi.id);

    // Fetch cost items for the Cost Impact Breakdown
    const { data: costItems } = await supabaseAdmin
      .from('rfi_cost_items')
      .select('*')
      .eq('rfi_id', validation.rfi.id);

    // Generate public URLs for attachments if not already present
    const attachmentsWithUrls = attachments?.map(attachment => {
      if (!attachment.public_url && attachment.file_path) {
        const { data } = supabaseAdmin.storage
          .from('rfi-attachments')
          .getPublicUrl(attachment.file_path);
        return {
          ...attachment,
          public_url: data.publicUrl
        };
      }
      return attachment;
    }) || [];

    return NextResponse.json({
      success: true,
      data: {
        ...validation.rfi,
        attachments: attachmentsWithUrls,
        cost_items: costItems || []
      }
    });
  } catch (error) {
    console.error('Error fetching RFI by token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch RFI data' },
      { status: 500 }
    );
  }
}

// POST /api/client/rfi/[token] - Submit client response
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedResponse = clientResponseSchema.safeParse(body);
    
    if (!validatedResponse.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid response data', 
          details: validatedResponse.error.issues 
        },
        { status: 400 }
      );
    }

    // First validate the token
    const validation = await validateToken(token);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.reason || 'Invalid token' },
        { status: 400 }
      );
    }

    // Update RFI with client response using admin client
    const { data: updatedRFI, error } = await supabaseAdmin
      .from('rfis')
      .update({
        client_response: validatedResponse.data.client_response,
        client_response_submitted_by: validatedResponse.data.client_response_submitted_by,
        response_status: validatedResponse.data.response_status,
        additional_comments: validatedResponse.data.additional_comments,
        client_cm_approval: validatedResponse.data.client_cm_approval,
        field_work_approved: validatedResponse.data.field_work_approved,
        status: 'active',
        stage: 'response_received',
        date_responded: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('secure_link_token', token)
      .select()
      .single();

    if (error) {
      console.error('Error updating RFI with client response:', error);
      return NextResponse.json(
        { success: false, error: `Failed to submit response: ${error.message}` },
        { status: 500 }
      );
    }

    // Send notification about the client response
    try {
      const clientName = validation.rfi.projects?.client_company_name || 'Client';
      await NotificationService.notifyClientResponse(
        updatedRFI.id,
        validatedResponse.data.response_status,
        clientName,
        // You can add project team emails here if available
        []
      );
    } catch (notificationError) {
      // Log but don't fail the response submission
      console.error('Failed to send notification:', notificationError);
    }

    return NextResponse.json({
      success: true,
      message: 'Response submitted successfully',
      data: updatedRFI
    });
  } catch (error) {
    console.error('Error submitting client response:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit response' },
      { status: 500 }
    );
  }
} 