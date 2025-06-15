import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get the admin client
    const supabaseAdmin = getSupabaseAdmin();

    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Find the user by email
    const { data: targetUser, error: findError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, status')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (findError) {
      return NextResponse.json(
        { error: 'User not found with that email address' },
        { status: 404 }
      );
    }

    if (targetUser.status !== 'invited') {
      return NextResponse.json(
        { error: `User status is "${targetUser.status}". Only invited users can have invitations resent.` },
        { status: 400 }
      );
    }

    // Get user's company and role info
    const { data: companyInfo, error: companyError } = await supabaseAdmin
      .from('company_users')
      .select('company_id, role_id')
      .eq('user_id', targetUser.id)
      .single();

    if (companyError) {
      return NextResponse.json(
        { error: 'Unable to find user company information' },
        { status: 400 }
      );
    }

    // Resend invitation using Supabase Auth Admin API
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email.trim().toLowerCase(),
      {
        data: {
          full_name: targetUser.full_name,
          company_id: companyInfo.company_id,
          role_id: companyInfo.role_id
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/callback`
      }
    );

    if (inviteError) {
      console.error('Error resending invitation:', inviteError);
      return NextResponse.json(
        { error: 'Failed to resend invitation: ' + inviteError.message },
        { status: 400 }
      );
    }

    console.log('Invitation resent successfully:', {
      email: email.trim().toLowerCase(),
      user_id: targetUser.id,
      full_name: targetUser.full_name
    });

    return NextResponse.json({
      success: true,
      message: `Invitation resent to ${targetUser.full_name} (${email})`
    });

  } catch (error) {
    console.error('Error in resend-invitation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 