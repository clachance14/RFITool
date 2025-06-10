import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';
import { RFI, UpdateRFIInput, ApiResponse, RFIStatus } from '@/lib/types';
import { updateRFISchema } from '@/lib/validations';
import { supabase } from '@/lib/supabase';

// UUID validation schema
const uuidSchema = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  'Invalid RFI ID format'
);

// Helper function to create error response
function errorResponse(message: string, status: number = 400): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

// GET /api/rfis/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate RFI ID
    const validatedId = uuidSchema.safeParse(params.id);
    if (!validatedId.success) {
      return errorResponse('Invalid RFI ID format');
    }

    // Fetch RFI from database
    const { data: rfiData, error: rfiError } = await supabase
      .from('rfis')
      .select('*')
      .eq('id', validatedId.data)
      .single();

    if (rfiError) {
      if (rfiError.code === 'PGRST116') {
        return errorResponse('RFI not found', 404);
      }
      console.error('Database error:', rfiError);
      return errorResponse('Failed to fetch RFI', 500);
    }

    // Fetch attachments for the RFI
    const { data: attachments, error: attachmentError } = await supabase
      .from('rfi_attachments')
      .select('*')
      .eq('rfi_id', validatedId.data);

    if (attachmentError) {
      console.error('Error fetching attachments:', attachmentError);
      // Continue without attachments rather than failing
    }

    // Return RFI with attachments
    return NextResponse.json({
      success: true,
      data: {
        rfi: rfiData,
        attachments: attachments || [],
      },
    });
  } catch (error) {
    console.error('Error fetching RFI:', error);
    return errorResponse('Failed to fetch RFI', 500);
  }
}

// PUT /api/rfis/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate RFI ID
    const validatedId = uuidSchema.safeParse(params.id);
    if (!validatedId.success) {
      return errorResponse('Invalid RFI ID format');
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateRFISchema.safeParse(body);
    if (!validatedData.success) {
      return errorResponse('Invalid RFI data: ' + validatedData.error.message);
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return errorResponse('User not authenticated', 401);
    }

    // Update RFI in database
    const { data: updatedRFI, error: updateError } = await supabase
      .from('rfis')
      .update({
        ...validatedData.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validatedId.data)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return errorResponse('RFI not found', 404);
      }
      console.error('Database update error:', updateError);
      return errorResponse('Failed to update RFI: ' + updateError.message, 500);
    }

    // Return updated RFI
    return NextResponse.json({
      success: true,
      data: updatedRFI,
    });
  } catch (error) {
    console.error('Error updating RFI:', error);
    return errorResponse('Failed to update RFI', 500);
  }
}

// DELETE /api/rfis/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate RFI ID
    const validatedId = uuidSchema.safeParse(params.id);
    if (!validatedId.success) {
      return errorResponse('Invalid RFI ID format');
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return errorResponse('User not authenticated', 401);
    }

    // Delete RFI from database
    const { error: deleteError } = await supabase
      .from('rfis')
      .delete()
      .eq('id', validatedId.data);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      return errorResponse('Failed to delete RFI: ' + deleteError.message, 500);
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'RFI deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting RFI:', error);
    return errorResponse('Failed to delete RFI', 500);
  }
} 