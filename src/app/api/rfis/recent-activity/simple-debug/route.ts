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

    // Test 1: Count all notifications (admin access)
    const { count: totalNotifications, error: notifCountError } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true });

    // Test 2: Get recent notifications without filters
    const { data: recentNotifications, error: recentNotifError } = await supabaseAdmin
      .from('notifications')
      .select('id, type, message, created_at, rfi_id')
      .order('created_at', { ascending: false })
      .limit(10);

    // Test 3: Check if user exists in company_users
    const { data: companyLink, error: companyLinkError } = await supabaseAdmin
      .from('company_users')
      .select('company_id')
      .eq('user_id', user.id);

    // Test 4: Get user's RFIs directly
    const { data: userRfis, error: userRfiError } = await supabaseAdmin
      .from('rfis')
      .select('id, rfi_number, subject, status, stage, project_id')
      .limit(5);

    // Test 5: Get projects accessible to user
    const { data: userProjects, error: userProjectError } = await supabaseAdmin
      .from('projects')
      .select('id, project_name, company_id')
      .limit(5);

    // Test 6: Check what the notification bell is actually counting
    // Let's try to replicate the NotificationService.getUnreadNotificationsCount() method
    const { count: unreadNotifCount, error: unreadCountError } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    // Test 7: Try to get all tables to see if notifications table exists
    const { data: allTables, error: tablesError } = await supabaseAdmin
      .rpc('get_table_names');

    // Test 8: Check if there are any records in any notification-related tables
    let alternativeNotifications = null;
    let alternativeError = null;
    try {
      // Check if there's a different notifications table or similar
      const { data: altNotif, error: altError } = await supabaseAdmin
        .from('rfi_status_logs')
        .select('*')
        .limit(5);
      alternativeNotifications = altNotif;
      alternativeError = altError;
    } catch (e) {
      alternativeError = e;
    }

    // Test 9: Check all companies and users to understand the association
    const { data: allCompanies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('id, company_name')
      .limit(10);

    const { data: allCompanyUsers, error: allCompanyUsersError } = await supabaseAdmin
      .from('company_users')
      .select('user_id, company_id, role')
      .limit(10);

    // Test 10: Check what companies the RFIs belong to
    const { data: rfiCompanies, error: rfiCompaniesError } = await supabaseAdmin
      .from('rfis')
      .select(`
        id, 
        rfi_number, 
        projects!inner(
          id,
          project_name,
          company_id,
          companies!inner(
            id,
            company_name
          )
        )
      `)
      .limit(5);

    // Test 11: Try to create a test notification to see what happens
    let testNotificationResult = null;
    let testNotificationError = null;
    try {
      const { data: testNotif, error: testError } = await supabaseAdmin
        .from('notifications')
        .insert({
          rfi_id: 'test-rfi-id',
          type: 'test',
          message: 'Test notification from debug',
          is_read: false,
          created_at: new Date().toISOString()
        })
        .select();
      testNotificationResult = testNotif;
      testNotificationError = testError;
    } catch (e) {
      testNotificationError = e;
    }

    // Test 12: Check notifications table schema
    let notificationsSchema = null;
    let notificationsSchemaError = null;
    try {
      // Try to get the first notification to see the table structure
      const { data: schemaCheck, error: schemaError } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .limit(1);
      notificationsSchema = schemaCheck;
      notificationsSchemaError = schemaError;
    } catch (e) {
      notificationsSchemaError = e;
    }

    // Test 13: Try a minimal notification insert
    let minimalNotificationResult = null;
    let minimalNotificationError = null;
    try {
      const { data: minimalNotif, error: minimalError } = await supabaseAdmin
        .from('notifications')
        .insert({
          type: 'test',
          message: 'Minimal test'
        })
        .select();
      minimalNotificationResult = minimalNotif;
      minimalNotificationError = minimalError;
    } catch (e) {
      minimalNotificationError = e;
    }

    return NextResponse.json({
      success: true,
      simpleDebug: {
        user: {
          id: user.id,
          email: user.email
        },
        totalNotifications: {
          count: totalNotifications,
          error: notifCountError?.message
        },
        recentNotifications: {
          count: recentNotifications?.length || 0,
          data: recentNotifications,
          error: recentNotifError?.message
        },
        unreadNotifications: {
          count: unreadNotifCount,
          error: unreadCountError?.message
        },
        companyLink: {
          count: companyLink?.length || 0,
          data: companyLink,
          error: companyLinkError?.message
        },
        userRfis: {
          count: userRfis?.length || 0,
          data: userRfis,
          error: userRfiError?.message
        },
        userProjects: {
          count: userProjects?.length || 0,
          data: userProjects,
          error: userProjectError?.message
        },
        databaseTables: {
          data: allTables,
          error: tablesError?.message
        },
        alternativeNotifications: {
          count: alternativeNotifications?.length || 0,
          data: alternativeNotifications,
          error: alternativeError instanceof Error ? alternativeError.message : String(alternativeError)
        },
        allCompanies: {
          count: allCompanies?.length || 0,
          data: allCompanies,
          error: companiesError?.message
        },
        allCompanyUsers: {
          count: allCompanyUsers?.length || 0,
          data: allCompanyUsers,
          error: allCompanyUsersError?.message
        },
        rfiCompanies: {
          count: rfiCompanies?.length || 0,
          data: rfiCompanies,
          error: rfiCompaniesError?.message
        },
        testNotification: {
          result: testNotificationResult,
          error: testNotificationError instanceof Error ? testNotificationError.message : String(testNotificationError)
        },
        notificationsSchema: {
          data: notificationsSchema,
          error: notificationsSchemaError instanceof Error ? notificationsSchemaError.message : String(notificationsSchemaError)
        },
        minimalNotification: {
          result: minimalNotificationResult,
          error: minimalNotificationError instanceof Error ? minimalNotificationError.message : String(minimalNotificationError)
        }
      }
    });

  } catch (error) {
    console.error('Simple debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 