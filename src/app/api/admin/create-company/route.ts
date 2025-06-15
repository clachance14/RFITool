import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Get the admin client (bypasses RLS)
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

    // Check if current user has permission to create companies (App Owner, Super Admin, or Admin)
    if (![0, 1, 2].includes(currentUserCompany.role_id)) {
      return NextResponse.json(
        { error: 'Only app owners, super admins, and admins can create companies' },
        { status: 403 }
      );
    }

    // Check if company name already exists
    const { data: existingCompany, error: existingError } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('name', name.trim())
      .single();

    if (existingCompany) {
      return NextResponse.json(
        { error: 'A company with this name already exists' },
        { status: 409 }
      );
    }

    // Create the company using admin client (bypasses RLS)
    const { data: newCompany, error: createError } = await supabaseAdmin
      .from('companies')
      .insert({
        name: name.trim()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating company:', createError);
      return NextResponse.json(
        { error: 'Failed to create company: ' + createError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      company: newCompany
    });

  } catch (error) {
    console.error('Error in create-company API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 