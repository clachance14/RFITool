import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

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

    const { expirationDays = 30, allowMultipleResponses = false } = validatedOptions.data;
    
    // First verify the RFI exists and get project data for contextual token
    const { data: rfiWithProject, error: selectError } = await supabaseAdmin
      .from('rfis')
      .select(`
        id,
        rfi_number,
        projects!inner(
          project_name
        )
      `)
      .eq('id', rfiId)
      .single();

    if (selectError || !rfiWithProject) {
      return NextResponse.json(
        { success: false, error: 'RFI not found or access denied' },
        { status: 404 }
      );
    }

    // Generate contextual secure token using the same logic as the service
    const generateContextualToken = (projectName: string, rfiNumber: string): string => {
      // Extract project code (first 3 letters, uppercase)
      const projectCode = projectName
        .replace(/[^a-zA-Z]/g, '') // Remove non-letters
        .substring(0, 3)
        .toUpperCase()
        .padEnd(3, 'X'); // Pad with X if less than 3 letters

      // Format RFI number (ensure 3 digits)
      const formattedRfiNumber = rfiNumber.replace(/\D/g, '').padStart(3, '0').substring(0, 3);

      // Get year (last 2 digits)
      const year = new Date().getFullYear().toString().slice(-2);

      // Generate random suffix for security (using crypto)
      const crypto = require('crypto');
      const randomBytes = crypto.randomBytes(3);
      const base62Chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let randomSuffix = '';
      for (let i = 0; i < 4; i++) {
        randomSuffix += base62Chars[randomBytes[i % 3] % 62];
      }

      // Format: "ABC-R001-24-Xy9K" 
      return `${projectCode}-R${formattedRfiNumber}-${year}-${randomSuffix}`;
    };

    const token = generateContextualToken(
      (rfiWithProject.projects as any).project_name, 
      rfiWithProject.rfi_number
    );
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);
    
    // Update RFI with secure link token
    const { error: tokenError } = await supabaseAdmin
      .from('rfis')
      .update({
        secure_link_token: token,
        link_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', rfiId);

    if (tokenError) {
      return NextResponse.json(
        { success: false, error: `Failed to generate secure link: ${tokenError.message}` },
        { status: 500 }
      );
    }

    // Create secure link URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const secureLink = `${baseUrl}/client/rfi/${token}`;

    const linkData = {
      secure_link: secureLink,
      token,
      expires_at: expiresAt.toISOString()
    };

    // Update RFI status/stage since the link is being generated for client
    const { error: updateError } = await supabaseAdmin
      .from('rfis')
      .update({
        // When generating a client link, the RFI is being sent to the client
        status: 'active',
        stage: 'sent_to_client',
        date_sent: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', rfiId);

    if (updateError) {
      console.warn('Failed to update RFI status/stage:', updateError);
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
            expires_at: linkData.expires_at,
            status_changed_to: 'active',
            stage_changed_to: 'sent_to_client',
            contextual_token: linkData.token
          },
          is_read: false
        });
    } catch (notificationError) {
      // Log but don't fail the link generation if notification fails
      console.warn('Failed to create link generation notification:', notificationError);
    }

    return NextResponse.json({
      success: true,
      data: linkData
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