import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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