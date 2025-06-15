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

    // Check if current user has permission to create users (App Owner, Super Admin, or Admin)
    if (![0, 1, 2].includes(currentUserCompany.role_id)) {
      return NextResponse.json(
        { error: 'Only app owners, super admins, and admins can create new users' },
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

    // Create company_users record to link user to company
    const { data: companyUserData, error: companyUserError } = await supabaseAdmin
      .from('company_users')
      .insert({
        user_id: inviteData.user.id,
        company_id: companyId,
        role_id: roleId
      })
      .select()
      .single();

    if (companyUserError) {
      console.error('Error linking user to company:', companyUserError);
      console.error('Failed company link details:', {
        user_id: inviteData.user.id,
        company_id: companyId,
        role_id: roleId,
        email: email.trim().toLowerCase()
      });
      
      // Rollback: Clean up the user record if company linking fails
      try {
        await supabaseAdmin.from('users').delete().eq('id', inviteData.user.id);
        await supabaseAdmin.auth.admin.deleteUser(inviteData.user.id);
        console.log('Successfully rolled back user creation due to company linking failure');
      } catch (rollbackError) {
        console.error('Failed to rollback user creation:', rollbackError);
      }
      
      return NextResponse.json(
        { error: 'User creation failed: Unable to link user to company. ' + companyUserError.message },
        { status: 400 }
      );
    }

    // Verify the company association was created successfully
    const { data: verifyAssociation, error: verifyError } = await supabaseAdmin
      .from('company_users')
      .select('user_id, company_id, role_id')
      .eq('user_id', inviteData.user.id)
      .single();

    if (verifyError || !verifyAssociation) {
      console.error('Company association verification failed:', verifyError);
      console.error('Association verification details:', {
        user_id: inviteData.user.id,
        expected_company_id: companyId,
        expected_role_id: roleId
      });
      
      return NextResponse.json(
        { error: 'User created but company association could not be verified. Please contact support.' },
        { status: 500 }
      );
    }

    console.log('User invitation completed successfully:', {
      user_id: inviteData.user.id,
      email: email.trim().toLowerCase(),
      full_name: fullName.trim(),
      company_id: companyId,
      role_id: roleId,
      role_name: roleId === 5 ? 'client_collaborator' : 'other'
    });

    return NextResponse.json({
      success: true,
      user: {
        id: inviteData.user.id,
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        status: 'invited',
        role_id: roleId
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