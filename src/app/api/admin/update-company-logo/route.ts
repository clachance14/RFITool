import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { logoUrl } = await request.json();

    // Validate required fields
    if (!logoUrl || typeof logoUrl !== 'string') {
      return NextResponse.json(
        { error: 'Logo URL is required' },
        { status: 400 }
      );
    }

    // Get the admin client (bypasses RLS)
    const supabaseAdmin = getSupabaseAdmin();

    // Check authentication
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
    const { data: userCompany, error: companyError } = await supabaseAdmin
      .from('company_users')
      .select('company_id, role_id')
      .eq('user_id', user.id)
      .single();

    if (companyError || !userCompany) {
      return NextResponse.json(
        { error: 'Unable to determine your company' },
        { status: 400 }
      );
    }

    // Check if current user has permission to update company logo (Admin or higher)
    if (![0, 1, 2].includes(userCompany.role_id)) {
      return NextResponse.json(
        { error: 'Only admins and higher can update company logos' },
        { status: 403 }
      );
    }

    // Update the company logo using admin client (bypasses RLS)
    const { error: updateError } = await supabaseAdmin
      .from('companies')
      .update({
        logo_url: logoUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userCompany.company_id);

    if (updateError) {
      console.error('Error updating company logo:', updateError);
      return NextResponse.json(
        { error: 'Failed to update company logo: ' + updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Company logo updated successfully'
    });

  } catch (error) {
    console.error('Error in update-company-logo API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 