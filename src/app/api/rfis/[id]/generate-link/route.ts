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
  allowMultipleResponses: z.boolean().optional(),
  user_id: z.string().optional(),
  user_email: z.string().email().optional()
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

    // Parse request body first to get user information
    const body = await request.json().catch(() => ({}));
    const validatedOptions = generateLinkSchema.safeParse(body);
    
    if (!validatedOptions.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid options', details: validatedOptions.error.issues },
        { status: 400 }
      );
    }

    const { expirationDays = 30, allowMultipleResponses = false, user_id, user_email } = validatedOptions.data;

    // Get user information - prioritize what's passed in the request
    let userId = user_id || null;
    let userName = 'Unknown User';
    let userEmail = user_email || null;

    if (userId) {
      // Get user's full name from users table
      const { data: userData, error: userDataError } = await supabaseAdmin
        .from('users')
        .select('full_name, email')
        .eq('id', userId)
        .single();
      
      console.log('User data result:', { userData, error: userDataError });
      
      if (userData?.full_name) {
        userName = userData.full_name;
      } else if (userData?.email) {
        userName = userData.email;
      } else if (userEmail) {
        userName = userEmail;
      }
      
      console.log('Final user info:', { userId, userName, userEmail });
    } else {
      console.warn('No user ID provided in request');
    }

    // Get user authentication from cookies (this is how Next.js/Supabase auth works)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    // Create a client with the request's cookies to get authenticated user
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: request.headers.get('Authorization') || '',
        }
      }
    });

    // Extract cookies and set them for the client
    const cookieStore = request.headers.get('cookie');
    if (cookieStore) {
      // Parse cookies and extract auth tokens
      const cookies = cookieStore.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          acc[key] = decodeURIComponent(value);
        }
        return acc;
      }, {} as Record<string, string>);

      // Set auth session from cookies if available
      const accessToken = cookies['sb-access-token'] || cookies['supabase.auth.token'];
      const refreshToken = cookies['sb-refresh-token'] || cookies['supabase.auth.refresh-token'];
      
      if (accessToken) {
        try {
          await supabaseClient.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });
        } catch (sessionError) {
          console.warn('Could not set session from cookies:', sessionError);
        }
      }
    }

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

    // Create notification with enhanced user tracking
    try {
      if (userId) {
        // Use the enhanced notification service
        const { NotificationService } = await import('@/services/notificationService');
        await NotificationService.notifyLinkGenerated(
          rfiId,
          userId,
          linkData.expires_at
        );
        console.log('✅ Enhanced notification created for user:', userName);
      } else {
        // Create notification with available user info (fallback)
        await supabaseAdmin
          .from('notifications')
          .insert({
            rfi_id: rfiId,
            type: 'link_generated',
            message: `${userName} generated a secure client link`,
            metadata: {
              performed_by_type: 'user',
              performed_by_name: userName,
              performed_by_email: userEmail,
              action_details: 'Generated secure client access link',
              secure_link_generated: true,
              expires_at: linkData.expires_at,
              status_changed_to: 'active',
              stage_changed_to: 'sent_to_client',
              contextual_token: linkData.token
            },
            is_read: false
          });
        console.log('✅ Fallback notification created for user:', userName);
      }
    } catch (notificationError) {
      console.error('Failed to create link generation notification:', notificationError);
      // Don't fail the entire request if notification fails
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