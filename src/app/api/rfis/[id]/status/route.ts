import { NextRequest, NextResponse } from 'next/server';
import { RFIWorkflowService } from '@/services/rfiWorkflow';
import { supabase } from '@/lib/supabase';
import { RFIStatus } from '@/lib/types';

// PUT /api/rfis/[id]/status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rfiId = params.id;
    const body = await request.json();
    const { status: targetStatus, additionalData } = body;

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get current RFI to determine current status
    const { data: currentRFI, error: fetchError } = await supabase
      .from('rfis')
      .select('status')
      .eq('id', rfiId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: 'RFI not found' },
        { status: 404 }
      );
    }

    const currentStatus = currentRFI.status as RFIStatus;

    // Validate the transition
    if (!RFIWorkflowService.isValidTransition(currentStatus, targetStatus)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid status transition from ${currentStatus} to ${targetStatus}` 
        },
        { status: 400 }
      );
    }

    // Execute the transition
    const result = await RFIWorkflowService.executeTransition(
      rfiId,
      targetStatus,
      currentStatus,
      user.id,
      additionalData
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: `RFI status updated to ${targetStatus}`
    });

  } catch (error) {
    console.error('Status transition error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// GET /api/rfis/[id]/status/transitions
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rfiId = params.id;

    // Get current RFI status
    const { data: currentRFI, error: fetchError } = await supabase
      .from('rfis')
      .select('status')
      .eq('id', rfiId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: 'RFI not found' },
        { status: 404 }
      );
    }

    const currentStatus = currentRFI.status as RFIStatus;
    const availableTransitions = RFIWorkflowService.getAvailableTransitions(currentStatus);
    const workflowState = RFIWorkflowService.getWorkflowState(currentStatus);

    return NextResponse.json({
      success: true,
      data: {
        currentStatus,
        workflowState,
        availableTransitions
      }
    });

  } catch (error) {
    console.error('Get transitions error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 