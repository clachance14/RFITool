import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client
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

export async function GET(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test 1: Check if notifications table exists and has any data
    const { data: allNotifications, error: notifError } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .limit(5);

    // Test 2: Check user's company associations
    const { data: userCompany, error: companyError } = await supabaseAdmin
      .from('company_users')
      .select('company_id, companies(name)')
      .eq('user_id', user.id);

    // Test 3: Check if user has any RFIs
    const { data: userRfis, error: rfiError } = await supabaseAdmin
      .from('rfis')
      .select('id, rfi_number, subject, project_id, projects(project_name, company_id)')
      .limit(5);

    // Test 4: Try the actual query that should work
    const { data: filteredNotifications, error: filteredError } = await supabaseAdmin
      .from('notifications')
      .select(`
        id,
        rfi_id,
        type,
        message,
        metadata,
        created_at,
        rfis!inner(
          rfi_number,
          subject,
          project_id,
          projects!inner(
            project_name,
            company_id,
            company_users!inner(
              user_id
            )
          )
        )
      `)
      .eq('rfis.projects.company_users.user_id', user.id)
      .limit(5);

    return NextResponse.json({
      success: true,
      debug: {
        user: {
          id: user.id,
          email: user.email
        },
        allNotifications: {
          count: allNotifications?.length || 0,
          error: notifError?.message,
          sample: allNotifications?.[0]
        },
        userCompany: {
          data: userCompany,
          error: companyError?.message
        },
        userRfis: {
          count: userRfis?.length || 0,
          error: rfiError?.message,
          sample: userRfis?.[0]
        },
        filteredNotifications: {
          count: filteredNotifications?.length || 0,
          error: filteredError?.message,
          sample: filteredNotifications?.[0]
        }
      }
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 