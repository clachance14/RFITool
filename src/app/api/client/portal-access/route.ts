import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role client to bypass RLS for client access
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

export async function POST(request: NextRequest) {
  try {
    const { clientToken, userId } = await request.json();

    // Validate either client token or user ID
    if (!clientToken && !userId) {
      return NextResponse.json(
        { success: false, error: 'Client token or user ID required' },
        { status: 400 }
      );
    }

    let companyName = '';

    // Method 1: Token-based access
    if (clientToken) {
      // Validate token and get company info
      const { data: rfi, error } = await supabaseAdmin
        .from('rfis')
        .select(`
          projects!inner(
            client_company_name
          )
        `)
        .eq('secure_link_token', clientToken)
        .single();

      if (error || !rfi) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired token' },
          { status: 401 }
        );
      }

      companyName = (rfi.projects as any).client_company_name;
    }

    // Method 2: User-based access (authenticated client)
    if (userId && !companyName) {
      const { data: companyUser, error } = await supabaseAdmin
        .from('company_users')
        .select(`
          companies (
            name
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error || !companyUser) {
        return NextResponse.json(
          { success: false, error: 'User company association not found' },
          { status: 404 }
        );
      }

      companyName = (companyUser.companies as any)?.name || '';
    }

    if (!companyName) {
      return NextResponse.json(
        { success: false, error: 'Could not determine company access' },
        { status: 404 }
      );
    }

    // Get basic company stats
    const { data: rfiStats } = await supabaseAdmin
      .from('rfis')
      .select(`
        id,
        status,
        projects!inner(client_company_name)
      `)
      .eq('projects.client_company_name', companyName);

    const totalRfis = rfiStats?.length || 0;
    const activeRfis = rfiStats?.filter(r => r.status === 'active').length || 0;
    const closedRfis = rfiStats?.filter(r => r.status === 'closed').length || 0;

    return NextResponse.json({
      success: true,
      data: {
        companyName,
        hasAccess: true,
        stats: {
          totalRfis,
          activeRfis,
          closedRfis
        }
      }
    });

  } catch (error) {
    console.error('Portal access validation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate portal access' },
      { status: 500 }
    );
  }
} 