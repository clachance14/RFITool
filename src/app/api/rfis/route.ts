import { NextRequest, NextResponse } from 'next/server';
import * as z from 'zod';
import { RFI, CreateRFIInput, ApiResponse } from '@/lib/types';
import { createRFISchema } from '@/lib/validations';
import { supabase } from '@/lib/supabase';

// Query parameter validation schema
const querySchema = z.object({
  projectId: z.string().optional(),
  status: z.enum(['draft', 'sent', 'responded', 'overdue']).optional(),
  page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).optional(),
});

// Helper function to generate RFI number
async function generateRFINumber(projectId?: string): Promise<string> {
  try {
    let query = supabase
      .from('rfis')
      .select('rfi_number')
      .order('created_at', { ascending: false });
    
    // If projectId is provided, filter by project
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    
    const { data, error } = await query.limit(1);

    if (error) {
      throw new Error('Failed to generate RFI number: ' + error.message);
    }

    const lastRFI = data?.[0];
    const lastNumber = lastRFI ? parseInt(lastRFI.rfi_number.split('-')[1]) : 0;
    const nextNumber = lastNumber + 1;
    return `RFI-${nextNumber.toString().padStart(3, '0')}`;
  } catch (err) {
    // Fallback to timestamp-based numbering if query fails
    const timestamp = Date.now().toString().slice(-6);
    return `RFI-${timestamp}`;
  }
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

    // Build query
    let query = supabase.from('rfis').select('*');

    // Apply filters
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return errorResponse('Failed to fetch RFIs', 500);
    }

    // Return paginated response
    return NextResponse.json({
      success: true,
      data: {
        rfis: data || [],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
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
      return errorResponse('Invalid RFI data: ' + validatedData.error.message);
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return errorResponse('User not authenticated', 401);
    }

    // Generate RFI number
    const rfiNumber = await generateRFINumber(validatedData.data.project_id);

    // Create new RFI data
    const newRFIData = {
      rfi_number: rfiNumber,
      project_id: validatedData.data.project_id,
      subject: validatedData.data.subject,
      reason_for_rfi: validatedData.data.reason_for_rfi,
      contractor_question: validatedData.data.contractor_question,
      contractor_proposed_solution: validatedData.data.contractor_proposed_solution || null,
      discipline: validatedData.data.discipline || null,
      system: validatedData.data.system || null,
      work_impact: validatedData.data.work_impact || null,
      cost_impact: validatedData.data.cost_impact || null,
      schedule_impact: validatedData.data.schedule_impact || null,
      test_package: validatedData.data.test_package || null,
      schedule_id: validatedData.data.schedule_id || null,
      block_area: validatedData.data.block_area || null,
      status: validatedData.data.status,
      urgency: validatedData.data.urgency,
      to_recipient: validatedData.data.to_recipient || '',
      created_by: user.id,
    };

    // Insert RFI into database
    const { data: rfiData, error: rfiError } = await supabase
      .from('rfis')
      .insert(newRFIData)
      .select()
      .single();

    if (rfiError) {
      console.error('Database insert error:', rfiError);
      return errorResponse('Failed to create RFI: ' + rfiError.message, 500);
    }

    // Return created RFI
    return NextResponse.json({
      success: true,
      data: rfiData,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating RFI:', error);
    return errorResponse('Failed to create RFI', 500);
  }
} 