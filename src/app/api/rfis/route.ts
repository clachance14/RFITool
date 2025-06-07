import { NextRequest, NextResponse } from 'next/server';
import * as z from 'zod';
import { RFI, CreateRFIInput, ApiResponse } from '@/lib/types';
import { createRFISchema } from '@/lib/validations';

// Mock data for development
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

// Query parameter validation schema
const querySchema = z.object({
  projectId: z.string().optional(),
  status: z.enum(['draft', 'sent', 'responded', 'overdue']).optional(),
  page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).optional(),
});

// Helper function to generate RFI number
function generateRFINumber(rfis: RFI[]): string {
  const lastRFI = [...rfis].sort((a, b) => 
    parseInt(b.rfi_number.split('-')[1]) - parseInt(a.rfi_number.split('-')[1])
  )[0];
  
  const lastNumber = lastRFI ? parseInt(lastRFI.rfi_number.split('-')[1]) : 0;
  const nextNumber = lastNumber + 1;
  return `RFI-${nextNumber.toString().padStart(3, '0')}`;
}

// Helper function to create error response
function errorResponse(message: string, status: number = 400): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

// GET /api/rfis
export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      projectId: searchParams.get('projectId'),
      status: searchParams.get('status'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    };

    const validatedParams = querySchema.safeParse(queryParams);
    if (!validatedParams.success) {
      return errorResponse('Invalid query parameters');
    }

    const { projectId, status, page = 1, limit = 10 } = validatedParams.data;

    // Filter RFIs based on query parameters
    let filteredRFIs = [...mockRFIs];
    
    if (projectId) {
      filteredRFIs = filteredRFIs.filter(rfi => rfi.project_id === projectId);
    }
    
    if (status) {
      filteredRFIs = filteredRFIs.filter(rfi => rfi.status === status);
    }

    // Calculate pagination
    const total = filteredRFIs.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRFIs = filteredRFIs.slice(startIndex, endIndex);

    // Return paginated response
    return NextResponse.json({
      success: true,
      data: {
        rfis: paginatedRFIs,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching RFIs:', error);
    return errorResponse('Failed to fetch RFIs', 500);
  }
}

// POST /api/rfis
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request body
    const validatedData = createRFISchema.safeParse(body);
    if (!validatedData.success) {
      return errorResponse('Invalid RFI data');
    }

    // Generate RFI number
    const rfiNumber = generateRFINumber(mockRFIs);

    // Create new RFI
    const newRFI: RFI = {
      id: Math.random().toString(36).substr(2, 9), // Mock ID generation
      rfi_number: rfiNumber,
      project_id: validatedData.data.project_id,
      subject: validatedData.data.subject,
      description: validatedData.data.reason_for_rfi,
      status: 'draft',
      priority: validatedData.data.urgency === 'urgent' ? 'high' : 'medium',
      assigned_to: validatedData.data.assigned_to || null,
      due_date: validatedData.data.due_date || null,
      created_by: 'user1', // Mock user ID
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      response: null,
      response_date: null,
      attachments: [],
    };

    // In a real implementation, we would save to the database here
    mockRFIs.push(newRFI);

    // Return created RFI
    return NextResponse.json({
      success: true,
      data: newRFI,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating RFI:', error);
    return errorResponse('Failed to create RFI', 500);
  }
} 