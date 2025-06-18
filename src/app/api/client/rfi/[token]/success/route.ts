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

async function validateToken(token: string) {
  try {
    const { data: rfi, error } = await supabaseAdmin
      .from('rfis')
      .select(`
        id,
        rfi_number,
        subject,
        client_response,
        client_response_submitted_by,
        date_responded,
        stage,
        projects (
          project_name,
          client_company_name
        )
      `)
      .eq('secure_link_token', token)
      .single();

    if (error || !rfi) {
      return { valid: false, reason: 'Invalid or expired token' };
    }

    // Check if response has been submitted
    if (!rfi.client_response || rfi.stage !== 'response_received') {
      return { valid: false, reason: 'No response submitted for this RFI' };
    }

    return { valid: true, rfi };
  } catch (error) {
    return { valid: false, reason: 'Token validation failed' };
  }
}

// GET /api/client/rfi/[token]/success - Get success page data
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

    // Validate token and get RFI data
    const validation = await validateToken(token);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.reason || 'Invalid token' },
        { status: 400 }
      );
    }

    const rfi = validation.rfi;

    // Get attachment count for this RFI submission
    const { count: attachmentCount } = await supabaseAdmin
      .from('rfi_attachments')
      .select('*', { count: 'exact', head: true })
      .eq('rfi_id', rfi.id)
      .eq('uploaded_by_type', 'client');

    // Prepare success data
    const successData = {
      rfi: {
        id: rfi.id,
        rfi_number: rfi.rfi_number,
        subject: rfi.subject,
        projects: rfi.projects
      },
      response: {
        submitted_at: rfi.date_responded,
        submitted_by: rfi.client_response_submitted_by || 'Client User',
        response_length: rfi.client_response?.length || 0,
        attachment_count: attachmentCount || 0
      }
    };

    return NextResponse.json({
      success: true,
      data: successData
    });

  } catch (error) {
    console.error('Error fetching success data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load success data' },
      { status: 500 }
    );
  }
} 