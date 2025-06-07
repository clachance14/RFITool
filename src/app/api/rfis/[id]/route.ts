import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';
import { RFI, UpdateRFIInput, ApiResponse, RFIStatus } from '@/lib/types';
import { updateRFISchema } from '@/lib/validations';

// Mock data for development (same as in main route)
const mockRFIs: RFI[] = [
  {
    id: '1',
    rfi_number: 'RFI-001',
    project_id: '1',
    subject: 'Foundation Design Clarification',
    description: 'Need clarification on foundation design specifications',
    status: 'draft',
    priority: 'high',
    assigned_to: null,
    due_date: null,
    created_by: 'user1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    response: null,
    response_date: null,
    attachments: [],
  },
  // Add more mock RFIs as needed
];

// Mock attachments data
const mockAttachments = [
  {
    id: '1',
    rfi_id: '1',
    filename: 'foundation-specs.pdf',
    file_path: '/attachments/foundation-specs.pdf',
    file_size: 1024,
    file_type: 'application/pdf',
    uploaded_at: new Date().toISOString(),
  },
];

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

// Helper function to find RFI by ID
function findRFIById(id: string): RFI | undefined {
  return mockRFIs.find(rfi => rfi.id === id);
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

    // Find RFI
    const rfi = findRFIById(validatedId.data);
    if (!rfi) {
      return errorResponse('RFI not found', 404);
    }

    // Get attachments for RFI
    const attachments = mockAttachments.filter(
      attachment => attachment.rfi_id === rfi.id
    );

    // Return RFI with attachments
    return NextResponse.json({
      success: true,
      data: {
        rfi,
        attachments,
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

    // Find RFI
    const rfi = findRFIById(validatedId.data);
    if (!rfi) {
      return errorResponse('RFI not found', 404);
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateRFISchema.safeParse(body);
    if (!validatedData.success) {
      return errorResponse('Invalid RFI data');
    }

    // Update RFI
    const updatedRFI: RFI = {
      ...rfi,
      ...validatedData.data,
      updated_at: new Date().toISOString(),
    };

    // In a real implementation, we would update in the database here
    const index = mockRFIs.findIndex(r => r.id === rfi.id);
    if (index !== -1) {
      mockRFIs[index] = updatedRFI;
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

    // Find RFI
    const rfi = findRFIById(validatedId.data);
    if (!rfi) {
      return errorResponse('RFI not found', 404);
    }

    // Soft delete by updating status to 'draft' (since 'deleted' is not a valid status)
    const updatedRFI: RFI = {
      ...rfi,
      status: 'draft',
      updated_at: new Date().toISOString(),
    };

    // In a real implementation, we would update in the database here
    const index = mockRFIs.findIndex(r => r.id === rfi.id);
    if (index !== -1) {
      mockRFIs[index] = updatedRFI;
    }

    // Return success response
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting RFI:', error);
    return errorResponse('Failed to delete RFI', 500);
  }
} 