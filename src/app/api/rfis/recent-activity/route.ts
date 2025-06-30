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
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '15');
    
    console.log('Recent activity API called with limit:', limit);
    
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('No authorization header found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    console.log('Authenticating user with token:', token.substring(0, 20) + '...');
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.log('Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authenticated:', user.id, user.email);

    // Fetch recent activity from multiple sources for comprehensive history
    const activities: any[] = [];

    // Get user's company ID for filtering
    const { data: userCompany, error: companyError } = await supabaseAdmin
      .from('company_users')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (companyError || !userCompany) {
      console.log('No company association found for user:', user.id);
      return NextResponse.json({ 
        success: true, 
        data: [],
        debug: { error: 'No company association found' }
      });
    }

    const companyId = userCompany.company_id;
    console.log('🔍 User company lookup successful:', {
      userId: user.id,
      email: user.email,
      companyId: companyId
    });

    // DIRECT TEST: Check if rfi_activity table has any data at all
    const { data: allActivities, error: allActivitiesError } = await supabaseAdmin
      .from('rfi_activity')
      .select('id, activity_type, rfi_id')
      .limit(5);
    
    console.log('🔍 DIRECT TEST - rfi_activity table access:', {
      error: allActivitiesError?.message,
      totalCount: allActivities?.length,
      sample: allActivities?.[0]
    });

    // SIMPLER TEST: Get activities with basic RFI info (no complex joins)
    const { data: simpleActivities, error: simpleError } = await supabaseAdmin
      .from('rfi_activity')
      .select(`
        id,
        activity_type,
        rfi_id,
        details,
        created_at,
        rfis(
          rfi_number,
          project_id,
          projects(company_id)
        )
      `)
      .eq('rfis.projects.company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(15);
    
    console.log('🔍 SIMPLE TEST - Direct company activities:', {
      error: simpleError?.message,
      count: simpleActivities?.length,
      sample: simpleActivities?.slice(0, 2)
    });

    // 1. Get status changes from rfi_status_logs (SIMPLIFIED VERSION)
    console.log('Querying rfi_status_logs with company filter:', companyId);
    
    // First get RFI IDs that belong to user's company (reusable logic)
    const { data: companyRfisForStatus, error: companyRfisStatusError } = await supabaseAdmin
      .from('rfis')
      .select(`
        id,
        rfi_number,
        subject,
        projects(
          project_name,
          company_id
        )
      `)
      .eq('projects.company_id', companyId);

    console.log('🔍 Company RFIs for status logs:', {
      error: companyRfisStatusError?.message,
      count: companyRfisForStatus?.length,
      sampleRfis: companyRfisForStatus?.slice(0, 2).map(rfi => ({ id: rfi.id, number: rfi.rfi_number }))
    });

    if (!companyRfisStatusError && companyRfisForStatus && companyRfisForStatus.length > 0) {
      const rfiIdsForStatus = companyRfisForStatus.map(rfi => rfi.id);
      
      // Now get status logs for these specific RFI IDs
      const { data: statusLogs, error: statusError } = await supabaseAdmin
        .from('rfi_status_logs')
        .select(`
          id,
          rfi_id,
          from_status,
          to_status,
          from_stage,
          to_stage,
          changed_by,
          changed_at,
          reason,
          users!changed_by(
            full_name,
            email
          )
        `)
        .in('rfi_id', rfiIdsForStatus)
        .order('changed_at', { ascending: false })
        .limit(limit);

      console.log('Status logs query results:', {
        error: statusError?.message,
        count: statusLogs?.length
      });

      if (!statusError && statusLogs) {
        statusLogs.forEach((log: any) => {
          // Find the matching RFI data
          const matchingRfi = companyRfisForStatus.find(rfi => rfi.id === log.rfi_id);
          const user = Array.isArray(log.users) ? log.users[0] : log.users;
          const project = Array.isArray(matchingRfi?.projects) ? matchingRfi.projects[0] : matchingRfi?.projects;
          
          activities.push({
            id: `status_${log.id}`,
            type: 'status_changed',
            rfi_id: log.rfi_id,
            rfi_number: matchingRfi?.rfi_number || 'Unknown',
            rfi_subject: matchingRfi?.subject || 'Unknown Subject',
            project_name: project?.project_name || 'Unknown Project',
            description: `${user?.full_name || 'Unknown User'} changed status from ${log.from_status} to ${log.to_status}${log.reason ? ` - ${log.reason}` : ''}`,
            change_type: 'status',
            from_value: log.from_status,
            to_value: log.to_status,
            timestamp: log.changed_at,
            user_name: user?.full_name || user?.email || 'Unknown User',
            user_email: user?.email,
            reason: log.reason
          });
        });
      }
    } else {
      console.log('No company RFIs found for status logs or error occurred');
    }

    // 2. Get general activity from rfi_activity (SIMPLIFIED VERSION)
    console.log('Querying rfi_activity with company filter:', companyId);
    
    // First get RFI IDs that belong to user's company
    const { data: companyRfis, error: companyRfisError } = await supabaseAdmin
      .from('rfis')
      .select(`
        id,
        rfi_number,
        subject,
        projects(
          project_name,
          company_id
        )
      `)
      .eq('projects.company_id', companyId);

    console.log('🔍 Company RFIs for activity logs:', {
      error: companyRfisError?.message,
      count: companyRfis?.length,
      sampleRfis: companyRfis?.slice(0, 2).map(rfi => ({ id: rfi.id, number: rfi.rfi_number }))
    });

    if (!companyRfisError && companyRfis && companyRfis.length > 0) {
      const rfiIds = companyRfis.map(rfi => rfi.id);
      
      // Now get activities for these specific RFI IDs (much simpler!)
      const { data: activityLogs, error: activityError } = await supabaseAdmin
        .from('rfi_activity')
        .select(`
          id,
          rfi_id,
          user_id,
          activity_type,
          details,
          created_at,
          users!user_id(
            full_name,
            email
          )
        `)
        .in('rfi_id', rfiIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      console.log('🔍 Activity query results:', {
        error: activityError?.message,
        count: activityLogs?.length,
        rfiIdsQueried: rfiIds.length,
        sample: activityLogs?.[0] ? {
          id: activityLogs[0].id,
          type: activityLogs[0].activity_type,
          rfi_id: activityLogs[0].rfi_id
        } : 'No activities found'
      });

      if (!activityError && activityLogs) {
        activityLogs.forEach((log: any) => {
          // Find the matching RFI data
          const matchingRfi = companyRfis.find(rfi => rfi.id === log.rfi_id);
          const user = Array.isArray(log.users) ? log.users[0] : log.users;
          const project = Array.isArray(matchingRfi?.projects) ? matchingRfi.projects[0] : matchingRfi?.projects;
          
          activities.push({
            id: `activity_${log.id}`,
            type: log.activity_type,
            rfi_id: log.rfi_id,
            rfi_number: matchingRfi?.rfi_number || 'Unknown',
            rfi_subject: matchingRfi?.subject || 'Unknown Subject',
            project_name: project?.project_name || 'Unknown Project',
            description: log.details?.message || `${user?.full_name || 'Unknown User'} performed ${log.activity_type}`,
            change_type: log.activity_type,
            timestamp: log.created_at,
            user_name: user?.full_name || user?.email || 'Unknown User',
            user_email: user?.email
          });
        });
      }
    } else {
      console.log('No company RFIs found or error occurred');
    }

    // 3. Fallback to notifications if no activity tables have data
    if (activities.length === 0) {
      console.log('No activity found in logs, falling back to notifications');
      
      // Use the same simplified approach for notifications
      const { data: companyRfisForNotif, error: companyRfisNotifError } = await supabaseAdmin
        .from('rfis')
        .select(`
          id,
          rfi_number,
          subject,
          projects(
            project_name,
            company_id
          )
        `)
        .eq('projects.company_id', companyId);

      if (!companyRfisNotifError && companyRfisForNotif && companyRfisForNotif.length > 0) {
        const rfiIdsForNotif = companyRfisForNotif.map(rfi => rfi.id);
        
        const { data: notifications, error: notificationsError } = await supabaseAdmin
          .from('notifications')
          .select(`
            id,
            rfi_id,
            type,
            message,
            metadata,
            created_at
          `)
          .in('rfi_id', rfiIdsForNotif)
          .order('created_at', { ascending: false })
          .limit(limit);

        console.log('Notifications fallback results:', {
          error: notificationsError?.message,
          count: notifications?.length
        });

        if (!notificationsError && notifications) {
          notifications.forEach((notification: any) => {
            const metadata = notification.metadata || {};
            const matchingRfi = companyRfisForNotif.find(rfi => rfi.id === notification.rfi_id);
            const project = Array.isArray(matchingRfi?.projects) ? matchingRfi.projects[0] : matchingRfi?.projects;
            
            activities.push({
              id: `notification_${notification.id}`,
              type: notification.type,
              rfi_id: notification.rfi_id,
              rfi_number: matchingRfi?.rfi_number || 'Unknown',
              rfi_subject: matchingRfi?.subject || 'Unknown Subject',
              project_name: project?.project_name || 'Unknown Project',
              description: notification.message,
              change_type: notification.type,
              timestamp: notification.created_at,
              user_name: metadata.performed_by_name || 'Unknown User',
              user_email: metadata.performed_by_email,
              reason: metadata.reason
            });
          });
        }
      }
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limit to requested number
    const limitedActivities = activities.slice(0, limit);

    console.log('=== RECENT ACTIVITY API RESULTS ===');
    console.log('Total activities found:', limitedActivities?.length);
    console.log('Company ID used for filtering:', companyId);
    console.log('Sample activities:', limitedActivities?.slice(0, 3).map(a => ({
      type: a.type,
      rfi_number: a.rfi_number,
      description: a.description,
      timestamp: a.timestamp
    })));
    console.log('=== END RESULTS ===');

    // Add debugging to the client-side console
    const debugInfo = {
      totalActivities: limitedActivities?.length,
      companyId: companyId,
      userEmail: user.email,
      message: limitedActivities?.length === 0 ? 'No activities found - check server logs' : 'Activities found successfully'
    };
    
    console.log('🚨 CLIENT DEBUG INFO:', debugInfo);

    return NextResponse.json({ 
      success: true, 
      data: limitedActivities,
      debug: debugInfo
    });

  } catch (error) {
    console.error('Recent activity error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 