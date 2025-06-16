import { NextRequest, NextResponse } from 'next/server';
import { supabase, getSupabaseAdmin } from '@/lib/supabase';
import { RFITimesheetEntry } from '@/lib/types';

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

    // Use regular client (RLS disabled for testing)
    const { data: entries, error } = await supabase
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
    const { data: summary, error: summaryError } = await supabase
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

    // Get the first user from the database for created_by field
    // TODO: Implement proper authentication later
    const supabaseAdmin = getSupabaseAdmin();
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);
    
    if (usersError || !users || users.length === 0) {
      return NextResponse.json(
        { error: 'Unable to determine user for timesheet entry' },
        { status: 500 }
      );
    }
    
    const userId = users[0].id;

    // Check if timesheet number already exists for this RFI
    const { data: existing, error: checkError } = await supabase
      .from('rfi_timesheet_entries')
      .select('id')
      .eq('rfi_id', rfiId)
      .eq('timesheet_number', timesheet_number)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
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

        // Create the timesheet entry
    const { data: newEntry, error: insertError } = await supabase
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
        created_by: userId
      })
      .select()
      .single();

    if (insertError) {
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