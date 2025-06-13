import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface ClientResponseRequest {
  rfi_id: string;
  response: string;
  client_name: string;
  client_email: string;
  attachment_count: number;
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

    // Parse request body
    const body: ClientResponseRequest = await request.json();
    const { rfi_id, response, client_name, client_email, attachment_count } = body;

    if (!rfi_id || !response?.trim()) {
      return NextResponse.json(
        { error: 'RFI ID and response are required' },
        { status: 400 }
      );
    }

    // Validate RFI ID matches session
    if (rfi_id !== session.rfi_id) {
      return NextResponse.json(
        { error: 'RFI ID does not match client session' },
        { status: 403 }
      );
    }

    // Check if response already exists
    const { data: existingRfi, error: rfiError } = await supabase
      .from('rfis')
      .select('client_response, stage')
      .eq('id', rfi_id)
      .single();

    if (rfiError) {
      return NextResponse.json(
        { error: 'RFI not found' },
        { status: 404 }
      );
    }

    if (existingRfi.client_response && existingRfi.stage === 'response_received') {
      return NextResponse.json(
        { error: 'Response has already been submitted for this RFI' },
        { status: 409 }
      );
    }

    try {
      // Update RFI with client response
      const { data: updatedRfi, error: updateError } = await supabase
        .from('rfis')
        .update({
          client_response: response,
          date_responded: new Date().toISOString(),
          stage: 'response_received',
          client_response_by: client_name || client_email || 'Client User',
          client_response_date: new Date().toISOString()
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

      // Log the response submission in audit trail
      await supabase
        .from('rfi_audit_log')
        .insert({
          rfi_id: rfi_id,
          action: 'client_response_submitted',
          performed_by: client_name || client_email || 'Client User',
          performed_by_type: 'client',
          client_session_token: clientToken,
          old_values: {
            stage: existingRfi.stage,
            client_response: existingRfi.client_response
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
            client_name: client_name,
            client_email: client_email
          }
        });

      // Update client session with response submission
      await supabase
        .from('client_sessions')
        .update({ 
          last_accessed: new Date().toISOString(),
          response_submitted: true,
          response_submitted_at: new Date().toISOString()
        })
        .eq('token', clientToken);

      // Send notification to internal team (optional - could be implemented later)
      // await sendInternalNotification({
      //   type: 'client_response_received',
      //   rfi_id: rfi_id,
      //   client_name: client_name,
      //   response: response
      // });

      return NextResponse.json({
        success: true,
        message: 'Response submitted successfully',
        rfi_id: rfi_id,
        response_date: updatedRfi.date_responded,
        stage: updatedRfi.stage
      });

    } catch (dbError) {
      console.error('Database error during response submission:', dbError);
      return NextResponse.json(
        { error: 'Database error occurred while saving response' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Client response submission error:', error);
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