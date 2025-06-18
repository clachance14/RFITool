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

interface ClientResponseRequest {
  rfi_id: string;
  response: string;
  responder_name: string;
  client_name: string;
  client_email: string;
  attachment_count: number;
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
        id,
        rfi_number,
        subject,
        client_response,
        stage,
        status,
        link_expires_at,
        allow_multiple_responses,
        projects (
          project_name,
          client_company_name
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

    // Parse request body
    const body: ClientResponseRequest = await request.json();
    const { rfi_id, response, responder_name, client_name, client_email, attachment_count } = body;

    if (!rfi_id || !response?.trim()) {
      return NextResponse.json(
        { error: 'RFI ID and response are required' },
        { status: 400 }
      );
    }

    if (!responder_name?.trim()) {
      return NextResponse.json(
        { error: 'Responder name is required' },
        { status: 400 }
      );
    }

    // Validate RFI ID matches token
    if (rfi_id !== rfi.id) {
      return NextResponse.json(
        { error: 'RFI ID does not match client token' },
        { status: 403 }
      );
    }

    // Check if response already exists
    if (rfi.client_response && rfi.stage === 'response_received') {
      return NextResponse.json(
        { error: 'Response has already been submitted for this RFI' },
        { status: 409 }
      );
    }

    try {
      // Update RFI with client response and advance workflow stage
      const { data: updatedRfi, error: updateError } = await supabaseAdmin
        .from('rfis')
        .update({
          client_response: response,
          client_response_submitted_by: responder_name,
          date_responded: new Date().toISOString(),
          stage: 'response_received',
          updated_at: new Date().toISOString()
        })
        .eq('id', rfi_id)
        .select()
        .single();

      if (updateError) {
        console.error('RFI update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to save response' },
          { status: 500 }
        );
      }

      // Log the response submission in audit trail (optional - may not exist yet)
      try {
        await supabaseAdmin
          .from('rfi_audit_log')
          .insert({
            rfi_id: rfi_id,
            action: 'client_response_submitted',
            performed_by: responder_name,
            performed_by_type: 'client',
            client_session_token: clientToken,
            old_values: {
              stage: rfi.stage,
              client_response: rfi.client_response
            },
            new_values: {
              stage: 'response_received',
              client_response: response
            },
            ip_address: request.ip || null,
            user_agent: request.headers.get('user-agent') || null,
            details: {
              response_length: response.length,
              attachment_count: attachment_count || 0,
              responder_name: responder_name,
              client_name: client_name,
              client_email: client_email
            }
          });
      } catch (auditError) {
        // Audit logging is optional - don't fail the response if it doesn't work
        console.warn('Audit logging failed:', auditError);
      }

      // Send notification about the client response
      try {
        await supabaseAdmin
          .from('notifications')
          .insert({
            rfi_id: updatedRfi.id,
            type: 'response_received',
            message: `Client response received from ${responder_name} (${client_name || client_email || 'Client User'})`,
            metadata: {
              responder_name: responder_name,
              client_name: client_name,
              client_email: client_email,
              response_length: response.length,
              attachment_count: attachment_count || 0
            },
            is_read: false
          });
      } catch (notificationError) {
        // Log but don't fail the response submission
        console.error('Failed to create notification:', notificationError);
      }

      return NextResponse.json({
        success: true,
        message: 'Response submitted successfully',
        data: {
          rfi_id: updatedRfi.id,
          response_submitted_at: updatedRfi.date_responded,
          stage: updatedRfi.stage,
          submitted_by: responder_name
        }
      });

    } catch (error) {
      console.error('Response submission error:', error);
      return NextResponse.json(
        { error: 'Failed to submit response' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Submit response endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to submit responses.' },
    { status: 405 }
  );
} 