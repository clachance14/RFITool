import { NextRequest, NextResponse } from 'next/server';
import { RFISecureLinkService } from '@/services/rfiSecureLink';
import { z } from 'zod';

const clientResponseSchema = z.object({
  client_response: z.string().min(1, 'Response is required'),
  client_response_submitted_by: z.string().min(1, 'Submitter name is required'),
  response_status: z.enum(['approved', 'rejected', 'needs_clarification']),
  additional_comments: z.string().optional(),
  client_cm_approval: z.string().optional()
});

// GET /api/client/rfi/[token] - Get RFI data for client viewing
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 400 }
      );
    }

    const result = await RFISecureLinkService.getRFIByToken(token);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error fetching RFI by token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch RFI data' },
      { status: 500 }
    );
  }
}

// POST /api/client/rfi/[token] - Submit client response
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedResponse = clientResponseSchema.safeParse(body);
    
    if (!validatedResponse.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid response data', 
          details: validatedResponse.error.issues 
        },
        { status: 400 }
      );
    }

    // Submit client response
    const result = await RFISecureLinkService.submitClientResponse(
      token,
      validatedResponse.data
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.rfi
    });
  } catch (error) {
    console.error('Error submitting client response:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit response' },
      { status: 500 }
    );
  }
} 