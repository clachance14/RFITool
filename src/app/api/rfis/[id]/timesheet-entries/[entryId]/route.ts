import { NextRequest, NextResponse } from 'next/server';
import { supabase, getSupabaseAdmin } from '@/lib/supabase';

// GET /api/rfis/[id]/timesheet-entries/[entryId] - Get a specific timesheet entry
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; entryId: string } }
) {
  try {
    const { id: rfiId, entryId } = params;

    if (!rfiId || !entryId) {
      return NextResponse.json(
        { error: 'RFI ID and Entry ID are required' },
        { status: 400 }
      );
    }

    const { data: entry, error } = await supabase
      .from('rfi_timesheet_entries')
      .select('*')
      .eq('id', entryId)
      .eq('rfi_id', rfiId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Timesheet entry not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching timesheet entry:', error);
      return NextResponse.json(
        { error: 'Failed to fetch timesheet entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: entry
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/rfis/[id]/timesheet-entries/[entryId] - Update a timesheet entry
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; entryId: string } }
) {
  try {
    const { id: rfiId, entryId } = params;
    const body = await request.json();

    if (!rfiId || !entryId) {
      return NextResponse.json(
        { error: 'RFI ID and Entry ID are required' },
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

    // Check if the entry exists and belongs to this RFI
    const { data: existing, error: checkError } = await supabase
      .from('rfi_timesheet_entries')
      .select('id, timesheet_number')
      .eq('id', entryId)
      .eq('rfi_id', rfiId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Timesheet entry not found' },
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

    // Check if timesheet number conflicts with another entry (if changed)
    if (timesheet_number !== existing.timesheet_number) {
      const { data: conflict, error: conflictError } = await supabase
        .from('rfi_timesheet_entries')
        .select('id')
        .eq('rfi_id', rfiId)
        .eq('timesheet_number', timesheet_number)
        .neq('id', entryId)
        .single();

      if (conflictError && conflictError.code !== 'PGRST116') {
        console.error('Error checking timesheet conflict:', conflictError);
        return NextResponse.json(
          { error: 'Failed to validate timesheet number' },
          { status: 500 }
        );
      }

      if (conflict) {
        return NextResponse.json(
          { error: 'Timesheet number already exists for this RFI' },
          { status: 409 }
        );
      }
    }

    // Update the timesheet entry
    const { data: updatedEntry, error: updateError } = await supabase
      .from('rfi_timesheet_entries')
      .update({
        timesheet_number,
        labor_hours: Number(labor_hours) || 0,
        labor_cost: Number(labor_cost) || 0,
        material_cost: Number(material_cost) || 0,
        subcontractor_cost: Number(subcontractor_cost) || 0,
        equipment_cost: Number(equipment_cost) || 0,
        description: description || null,
        entry_date: entry_date
      })
      .eq('id', entryId)
      .eq('rfi_id', rfiId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating timesheet entry:', updateError);
      return NextResponse.json(
        { error: 'Failed to update timesheet entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedEntry
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/rfis/[id]/timesheet-entries/[entryId] - Delete a timesheet entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; entryId: string } }
) {
  try {
    const { id: rfiId, entryId } = params;

    if (!rfiId || !entryId) {
      return NextResponse.json(
        { error: 'RFI ID and Entry ID are required' },
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

    // Check if the entry exists and belongs to this RFI
    const { data: existing, error: checkError } = await supabase
      .from('rfi_timesheet_entries')
      .select('id')
      .eq('id', entryId)
      .eq('rfi_id', rfiId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Timesheet entry not found' },
        { status: 404 }
      );
    }

    // Delete the timesheet entry
    const { error: deleteError } = await supabase
      .from('rfi_timesheet_entries')
      .delete()
      .eq('id', entryId)
      .eq('rfi_id', rfiId);

    if (deleteError) {
      console.error('Error deleting timesheet entry:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete timesheet entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Timesheet entry deleted successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 