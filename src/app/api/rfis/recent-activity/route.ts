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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '15');
    
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
    console.log('User company ID:', companyId);

    // 1. Get status changes from rfi_status_logs (with company filtering)
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
        rfis!inner(
          rfi_number,
          subject,
          project_id,
          projects!inner(
            project_name,
            company_id
          )
        ),
        users!changed_by(
          full_name,
          email
        )
      `)
      .eq('rfis.projects.company_id', companyId)
      .order('changed_at', { ascending: false })
      .limit(limit);

    if (statusError) {
      console.error('Status logs error:', statusError);
    } else if (statusLogs) {
      statusLogs.forEach((log: any) => {
        const rfi = Array.isArray(log.rfis) ? log.rfis[0] : log.rfis;
        const user = Array.isArray(log.users) ? log.users[0] : log.users;
        const project = Array.isArray(rfi?.projects) ? rfi.projects[0] : rfi?.projects;
        
        activities.push({
          id: `status_${log.id}`,
          type: 'status_changed',
          rfi_id: log.rfi_id,
          rfi_number: rfi?.rfi_number || 'Unknown',
          rfi_subject: rfi?.subject || 'Unknown Subject',
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

    // 2. Get general activity from rfi_activity (if it exists)
    const { data: activityLogs, error: activityError } = await supabaseAdmin
      .from('rfi_activity')
      .select(`
        id,
        rfi_id,
        user_id,
        activity_type,
        details,
        created_at,
        rfis!inner(
          rfi_number,
          subject,
          project_id,
          projects!inner(
            project_name,
            company_id
          )
        ),
        users!user_id(
          full_name,
          email
        )
      `)
      .eq('rfis.projects.company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (activityError) {
      console.log('Activity logs error (table may not exist):', activityError);
    } else if (activityLogs) {
      activityLogs.forEach((log: any) => {
        const rfi = Array.isArray(log.rfis) ? log.rfis[0] : log.rfis;
        const user = Array.isArray(log.users) ? log.users[0] : log.users;
        const project = Array.isArray(rfi?.projects) ? rfi.projects[0] : rfi?.projects;
        
        activities.push({
          id: `activity_${log.id}`,
          type: log.activity_type,
          rfi_id: log.rfi_id,
          rfi_number: rfi?.rfi_number || 'Unknown',
          rfi_subject: rfi?.subject || 'Unknown Subject',
          project_name: project?.project_name || 'Unknown Project',
          description: log.details?.message || `${user?.full_name || 'Unknown User'} performed ${log.activity_type}`,
          change_type: log.activity_type,
          timestamp: log.created_at,
          user_name: user?.full_name || user?.email || 'Unknown User',
          user_email: user?.email
        });
      });
    }

    // 3. Fallback to notifications if no activity tables have data
    if (activities.length === 0) {
      console.log('No activity found in logs, falling back to notifications');
      
      const { data: notifications, error: notificationsError } = await supabaseAdmin
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
              company_id
            )
          )
        `)
        .eq('rfis.projects.company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (notificationsError) {
        console.error('Notifications error:', notificationsError);
      } else if (notifications) {
        notifications.forEach((notification: any) => {
          const metadata = notification.metadata || {};
          const rfi = Array.isArray(notification.rfis) ? notification.rfis[0] : notification.rfis;
          const project = Array.isArray(rfi?.projects) ? rfi.projects[0] : rfi?.projects;
          
          activities.push({
            id: `notification_${notification.id}`,
            type: notification.type,
            rfi_id: notification.rfi_id,
            rfi_number: rfi?.rfi_number || 'Unknown',
            rfi_subject: rfi?.subject || 'Unknown Subject',
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

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limit to requested number
    const limitedActivities = activities.slice(0, limit);

    console.log('Transformed activities:', limitedActivities?.length, 'items');

    return NextResponse.json({ 
      success: true, 
      data: limitedActivities 
    });

  } catch (error) {
    console.error('Recent activity error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 