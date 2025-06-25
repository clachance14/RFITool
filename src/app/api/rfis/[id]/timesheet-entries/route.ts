import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { RFITimesheetEntry } from '@/lib/types';

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

// GET /api/rfis/[id]/timesheet-entries - Get all timesheet entries for an RFI
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rfiId = params.id;

    if (!rfiId) {
      return NextResponse.json(
        { error: 'RFI ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user has access to this RFI through company association
    const { data: userCompany, error: companyError } = await supabaseAdmin
      .from('company_users')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (companyError || !userCompany) {
      return NextResponse.json(
        { error: 'Unable to determine user company' },
        { status: 403 }
      );
    }

    // Verify RFI belongs to user's company
    const { data: rfiProject, error: rfiError } = await supabaseAdmin
      .from('rfis')
      .select(`
        id,
        projects!inner(
          company_id
        )
      `)
      .eq('id', rfiId)
      .eq('projects.company_id', userCompany.company_id)
      .single();

    if (rfiError || !rfiProject) {
      return NextResponse.json(
        { error: 'RFI not found or access denied' },
        { status: 404 }
      );
    }

    // Get timesheet entries using admin client but with proper authorization
    const { data: entries, error } = await supabaseAdmin
      .from('rfi_timesheet_entries')
      .select('*')
      .eq('rfi_id', rfiId)
      .order('entry_date', { ascending: false });

    if (error) {
      console.error('Error fetching timesheet entries:', error);
      
      // Check if it's a "relation does not exist" error (table not created)
      if (error.message?.includes('relation "rfi_timesheet_entries" does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database migration required',
            message: 'The timesheet tracking tables have not been created yet. Please run the migration script.',
            migrationRequired: true
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch timesheet entries' },
        { status: 500 }
      );
    }

    // Also get the summary data
    const { data: summary, error: summaryError } = await supabaseAdmin
      .from('rfi_timesheet_summary')
      .select('*')
      .eq('rfi_id', rfiId)
      .single();

    if (summaryError && summaryError.code !== 'PGRST116') {
      console.error('Error fetching timesheet summary:', summaryError);
    }

    return NextResponse.json({
      success: true,
      data: {
        entries: entries || [],
        summary: summary || null
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/rfis/[id]/timesheet-entries - Create a new timesheet entry
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rfiId = params.id;
    const body = await request.json();

    if (!rfiId) {
      return NextResponse.json(
        { error: 'RFI ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user has access to this RFI through company association
    const { data: userCompany, error: companyError } = await supabaseAdmin
      .from('company_users')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (companyError || !userCompany) {
      return NextResponse.json(
        { error: 'Unable to determine user company' },
        { status: 403 }
      );
    }

    // Verify RFI belongs to user's company
    const { data: rfiProject, error: rfiError } = await supabaseAdmin
      .from('rfis')
      .select(`
        id,
        projects!inner(
          company_id
        )
      `)
      .eq('id', rfiId)
      .eq('projects.company_id', userCompany.company_id)
      .single();

    if (rfiError || !rfiProject) {
      return NextResponse.json(
        { error: 'RFI not found or access denied' },
        { status: 404 }
      );
    }

    // Validate required fields
    const { 
      timesheet_number, 
      labor_hours = 0, 
      labor_cost = 0, 
      material_cost = 0, 
      subcontractor_cost = 0,
      equipment_cost = 0,
      description,
      entry_date 
    } = body;

    if (!timesheet_number) {
      return NextResponse.json(
        { error: 'Timesheet number is required' },
        { status: 400 }
      );
    }

    // Check if timesheet number already exists for this RFI using admin client
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('rfi_timesheet_entries')
      .select('id')
      .eq('rfi_id', rfiId)
      .eq('timesheet_number', timesheet_number)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing timesheet:', checkError);
      return NextResponse.json(
        { error: 'Failed to validate timesheet number' },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { error: 'Timesheet number already exists for this RFI' },
        { status: 409 }
      );
    }

    // Create the timesheet entry using authenticated user ID
    const { data: newEntry, error: insertError } = await supabaseAdmin
      .from('rfi_timesheet_entries')
      .insert({
        rfi_id: rfiId,
        timesheet_number,
        labor_hours: Number(labor_hours) || 0,
        labor_cost: Number(labor_cost) || 0,
        material_cost: Number(material_cost) || 0,
        subcontractor_cost: Number(subcontractor_cost) || 0,
        equipment_cost: Number(equipment_cost) || 0,
        description: description || null,
        entry_date: entry_date || new Date().toISOString().split('T')[0],
        created_by: user.id // Use the authenticated user's ID
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating timesheet entry:', insertError);
      return NextResponse.json(
        { error: 'Failed to create timesheet entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newEntry
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 