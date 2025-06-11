import { NextRequest, NextResponse } from 'next/server';
import { RFISecureLinkService } from '@/services/rfiSecureLink';
import { z } from 'zod';

const generateLinkSchema = z.object({
  expirationDays: z.number().min(1).max(365).optional(),
  allowMultipleResponses: z.boolean().optional()
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rfiId = params.id;
    
    // Validate RFI ID format
    if (!rfiId || typeof rfiId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid RFI ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const validatedOptions = generateLinkSchema.safeParse(body);
    
    if (!validatedOptions.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid options', details: validatedOptions.error.issues },
        { status: 400 }
      );
    }

    // Generate secure link
    const linkResponse = await RFISecureLinkService.generateSecureLink(
      rfiId,
      validatedOptions.data
    );

    return NextResponse.json({
      success: true,
      data: linkResponse
    });
  } catch (error) {
    console.error('Error generating secure link:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate secure link' 
      },
      { status: 500 }
    );
  }
} 