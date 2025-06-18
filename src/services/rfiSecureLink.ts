import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export interface SecureLinkOptions {
  expirationDays?: number; // Default 30 days
  allowMultipleResponses?: boolean; // Default false
}

export interface SecureLinkResponse {
  secure_link: string;
  token: string;
  expires_at: string;
}

export class RFISecureLinkService {
  private static readonly DEFAULT_EXPIRATION_DAYS = 30;
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  private static readonly BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  /**
   * Generate a short, secure Base62 token
   */
  private static generateShortToken(length: number = 4): string {
    const bytes = crypto.randomBytes(Math.ceil(length * 3 / 4));
    let result = '';
    
    for (let i = 0; i < bytes.length && result.length < length; i++) {
      result += this.BASE62_CHARS[bytes[i] % 62];
    }
    
    return result.substring(0, length);
  }

  /**
   * Generate contextual short code based on project and RFI data
   */
  private static generateContextualToken(projectName: string, rfiNumber: string): string {
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

    // Generate random suffix for security
    const randomSuffix = this.generateShortToken(4);

    // Format: "ABC-R001-24-Xy9K" 
    return `${projectCode}-R${formattedRfiNumber}-${year}-${randomSuffix}`;
  }

  /**
   * Generate a secure link for an RFI
   */
  static async generateSecureLink(
    rfiId: string, 
    options: SecureLinkOptions = {}
  ): Promise<SecureLinkResponse> {
    const { expirationDays = this.DEFAULT_EXPIRATION_DAYS } = options;
    
    // First verify the RFI exists and get project data for contextual token
    const { data: rfiWithProject, error: selectError } = await supabase
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
      throw new Error('RFI not found or access denied');
    }

    // Generate contextual secure token
    const token = this.generateContextualToken(
      (rfiWithProject.projects as any).project_name, 
      rfiWithProject.rfi_number
    );
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);
    
    // Update RFI with secure link token
    const { error } = await supabase
      .from('rfis')
      .update({
        secure_link_token: token,
        link_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', rfiId);

    if (error) {
      throw new Error(`Failed to generate secure link: ${error.message}`);
    }

    // Create secure link URL
    const secureLink = `${this.BASE_URL}/client/rfi/${token}`;

    return {
      secure_link: secureLink,
      token,
      expires_at: expiresAt.toISOString()
    };
  }

  /**
   * Validate a secure link token
   */
  static async validateToken(token: string): Promise<{
    valid: boolean;
    rfi?: any;
    reason?: string;
  }> {
    try {
      const { data: rfi, error } = await supabase
        .from('rfis')
        .select(`
          *,
          projects!inner(
            id,
            project_name,
            client_company_name,
            contractor_job_number
          )
        `)
        .eq('secure_link_token', token)
        .single();

      if (error || !rfi) {
        return {
          valid: false,
          reason: 'Invalid or expired link'
        };
      }

      // Check if link has expired
      if (rfi.link_expires_at && new Date(rfi.link_expires_at) < new Date()) {
        return {
          valid: false,
          reason: 'Link has expired'
        };
      }

      // Check if RFI has already been responded to
      if (rfi.status === 'responded' && !rfi.allow_multiple_responses) {
        return {
          valid: false,
          reason: 'This RFI has already been responded to'
        };
      }

      return {
        valid: true,
        rfi
      };
    } catch (error) {
      return {
        valid: false,
        reason: 'Failed to validate link'
      };
    }
  }

  /**
   * Submit a client response via secure link
   */
  static async submitClientResponse(token: string, response: {
    client_response: string;
    client_response_submitted_by: string;
    response_status: 'approved' | 'rejected' | 'needs_clarification';
    additional_comments?: string;
    client_cm_approval?: string;
  }): Promise<{
    success: boolean;
    message: string;
    rfi?: any;
  }> {
    try {
      // First validate the token
      const validation = await this.validateToken(token);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.reason || 'Invalid token'
        };
      }

      // Update RFI with client response
      const { data: updatedRFI, error } = await supabase
        .from('rfis')
        .update({
          client_response: response.client_response,
          client_response_submitted_by: response.client_response_submitted_by,
          response_status: response.response_status,
          additional_comments: response.additional_comments,
          client_cm_approval: response.client_cm_approval,
          status: 'active',
          stage: 'response_received',
          date_responded: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('secure_link_token', token)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to submit response: ${error.message}`);
      }

      // Create notification for internal team
      await this.createResponseNotification(updatedRFI.id, response.response_status);

      return {
        success: true,
        message: 'Response submitted successfully',
        rfi: updatedRFI
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit response'
      };
    }
  }

  /**
   * Get RFI data by secure token (for client viewing)
   */
  static async getRFIByToken(token: string): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    try {
      const validation = await this.validateToken(token);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.reason
        };
      }

      // Fetch complete RFI data with attachments
      const { data: attachments } = await supabase
        .from('rfi_attachments')
        .select('*')
        .eq('rfi_id', validation.rfi.id);

      return {
        success: true,
        data: {
          ...validation.rfi,
          attachments: attachments || []
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch RFI data'
      };
    }
  }

  /**
   * Create a notification when client responds
   */
  private static async createResponseNotification(rfiId: string, responseStatus: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .insert({
          rfi_id: rfiId,
          type: 'response_received',
          message: `Client response received with status: ${responseStatus}`,
          is_read: false
        });
    } catch (error) {
      console.error('Failed to create notification:', error);
      // Don't throw here - notification failure shouldn't fail the response submission
    }
  }

  /**
   * Regenerate secure link (useful when link expires)
   */
  static async regenerateSecureLink(
    rfiId: string, 
    options: SecureLinkOptions = {}
  ): Promise<SecureLinkResponse> {
    // First check if RFI exists and can have link regenerated
    const { data: rfi, error } = await supabase
      .from('rfis')
      .select('id, status')
      .eq('id', rfiId)
      .single();

    if (error || !rfi) {
      throw new Error('RFI not found');
    }

    if (rfi.status === 'responded') {
      throw new Error('Cannot regenerate link for responded RFI');
    }

    // Generate new secure link
    return this.generateSecureLink(rfiId, options);
  }

  /**
   * Revoke secure link (make it invalid)
   */
  static async revokeSecureLink(rfiId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('rfis')
        .update({
          secure_link_token: null,
          link_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', rfiId);

      return !error;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if RFI is overdue and update status
   */
  static async checkAndMarkOverdue(): Promise<number> {
    try {
      // Find sent RFIs that are past due
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: overdueRFIs, error } = await supabase
        .from('rfis')
        .update({ status: 'overdue' })
        .eq('status', 'sent')
        .lt('date_sent', thirtyDaysAgo.toISOString())
        .select('id');

      if (error) {
        throw new Error(`Failed to mark overdue RFIs: ${error.message}`);
      }

      // Create overdue notifications
      if (overdueRFIs && overdueRFIs.length > 0) {
        const notifications = overdueRFIs.map(rfi => ({
          rfi_id: rfi.id,
          type: 'overdue_reminder' as const,
          message: 'RFI is overdue for response',
          is_read: false
        }));

        await supabase
          .from('notifications')
          .insert(notifications);
      }

      return overdueRFIs?.length || 0;
    } catch (error) {
      console.error('Failed to check overdue RFIs:', error);
      return 0;
    }
  }
} 