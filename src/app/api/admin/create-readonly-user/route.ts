import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, fullName, password = 'readonly123' } = await request.json();

    // Validate required fields
    if (!email || !fullName) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      );
    }

    // Get the admin client
    const supabaseAdmin = getSupabaseAdmin();

    // Get the current user's company to associate the read-only user with
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

    // Get the current user's company
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

    // Check if current user has admin permissions (role_id 1 or 2)
    if (![1, 2].includes(currentUserCompany.role_id)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create users' },
        { status: 403 }
      );
    }

    // Check if email already exists
    const { data: existingUser, error: existingUserError } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Create auth user using admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      user_metadata: {
        full_name: fullName.trim(),
      },
      email_confirm: true, // Skip email confirmation for demo users
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json(
        { error: 'Failed to create authentication user: ' + authError.message },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // Create user profile in users table
    const { data: userData, error: userProfileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        status: 'active'
      })
      .select()
      .single();

    if (userProfileError) {
      console.error('Error creating user profile:', userProfileError);
      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Failed to create user profile: ' + userProfileError.message },
        { status: 400 }
      );
    }

    // Link user to company with view_only role (role_id = 4)
    const { data: companyUserData, error: companyUserError } = await supabaseAdmin
      .from('company_users')
      .insert({
        user_id: userId,
        company_id: currentUserCompany.company_id,
        role_id: 4 // view_only role
      })
      .select()
      .single();

    if (companyUserError) {
      console.error('Error linking user to company:', companyUserError);
      // Clean up if company linking fails
      await supabaseAdmin.from('users').delete().eq('id', userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Failed to link user to company: ' + companyUserError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Read-only user created successfully',
      user: {
        id: userId,
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        role: 'view_only',
        tempPassword: password
      }
    });

  } catch (error) {
    console.error('Error in create-readonly-user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 