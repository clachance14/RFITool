import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import crypto from 'crypto';

// Use service role client to bypass RLS
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

    const { expirationDays = 30 } = validatedOptions.data;
    
    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);
    
    // Update RFI with secure link token and set appropriate status/stage
    const { error } = await supabaseAdmin
      .from('rfis')
      .update({
        secure_link_token: token,
        link_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
        // When generating a client link, the RFI is being sent to the client
        status: 'active',
        stage: 'sent_to_client',
        date_sent: new Date().toISOString()
      })
      .eq('id', rfiId);

    if (error) {
      console.error('Error updating RFI with secure link:', error);
      return NextResponse.json(
        { success: false, error: `Failed to generate secure link: ${error.message}` },
        { status: 500 }
      );
    }

    // Create notification for link generation
    try {
      await supabaseAdmin
        .from('notifications')
        .insert({
          rfi_id: rfiId,
          type: 'link_generated',
          message: 'Secure client link generated and RFI sent to client',
          metadata: {
            secure_link_generated: true,
            expires_at: expiresAt.toISOString(),
            status_changed_to: 'active',
            stage_changed_to: 'sent_to_client'
          },
          is_read: false
        });
    } catch (notificationError) {
      // Log but don't fail the link generation if notification fails
      console.warn('Failed to create link generation notification:', notificationError);
    }

    // Create secure link URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const secureLink = `${baseUrl}/client/rfi/${token}`;

    return NextResponse.json({
      success: true,
      data: {
        secure_link: secureLink,
        token,
        expires_at: expiresAt.toISOString()
      }
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