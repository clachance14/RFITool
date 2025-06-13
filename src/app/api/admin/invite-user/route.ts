import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, fullName, companyId, roleId, invitedBy } = await request.json();

    // Validate required fields
    if (!email || !fullName || !companyId || !roleId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the admin client
    const supabaseAdmin = getSupabaseAdmin();

    // Check authentication and permissions
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Extract the JWT token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Get the current user's role to check permissions
    const { data: currentUserCompany, error: companyError } = await supabaseAdmin
      .from('company_users')
      .select('company_id, role_id')
      .eq('user_id', user.id)
      .single();

    if (companyError || !currentUserCompany) {
      return NextResponse.json(
        { error: 'Unable to determine your company' },
        { status: 400 }
      );
    }

    // Check if current user has permission to create users (App Owner or Super Admin)
    if (![0, 1].includes(currentUserCompany.role_id)) {
      return NextResponse.json(
        { error: 'Only app owners and super admins can create new users' },
        { status: 403 }
      );
    }

    // Send invitation email using Supabase Auth Admin API
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email.trim().toLowerCase(),
      {
        data: {
          full_name: fullName.trim(),
          company_id: companyId,
          role_id: roleId,
          invited_by: invitedBy || 'system'
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/callback`
      }
    );

    if (inviteError) {
      console.error('Error sending invitation:', inviteError);
      return NextResponse.json(
        { error: 'Failed to send invitation: ' + inviteError.message },
        { status: 400 }
      );
    }

    if (!inviteData.user) {
      return NextResponse.json(
        { error: 'Failed to create invitation - no user data returned' },
        { status: 400 }
      );
    }

    // Create user record in our users table
    const { data: newUserData, error: createUserError } = await supabaseAdmin
      .from('users')
      .insert({
        id: inviteData.user.id, // Use the auth user ID
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        status: 'invited'
      })
      .select()
      .single();

    if (createUserError) {
      console.error('Error creating user record:', createUserError);
      return NextResponse.json(
        { error: 'Invitation sent but failed to create user record: ' + createUserError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: inviteData.user.id,
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        status: 'invited'
      }
    });

  } catch (error) {
    console.error('Error in invite-user API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 