import { supabase } from '@/lib/supabase';
import { EmailTemplateService, EmailTemplateOptions } from './emailTemplateService';

export interface NotificationData {
  rfi_id: string;
  type: 'response_received' | 'overdue_reminder' | 'status_changed' | 'link_generated';
  message: string;
  metadata?: Record<string, any>;
}

export interface EmailNotificationData {
  to: string[];
  subject: string;
  body: string;
  template: string;
  rfiId: string;
  projectId?: string;
}

export class NotificationService {
  /**
   * Create an in-app notification
   */
  static async createNotification(data: NotificationData): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .insert({
          rfi_id: data.rfi_id,
          type: data.type,
          message: data.message,
          metadata: data.metadata || {},
          is_read: false,
          created_at: new Date().toISOString()
        });
      
      console.log(`✅ Notification created for RFI ${data.rfi_id}: ${data.type}`);
    } catch (error) {
      console.error('Failed to create notification:', error);
      // Don't throw - notification failure shouldn't break main functionality
    }
  }

  /**
   * Send notification when client responds to RFI
   */
  static async notifyClientResponse(
    rfiId: string, 
    responseStatus: string,
    clientName: string,
    projectTeamEmails: string[] = []
  ): Promise<void> {
    try {
      // Create in-app notification
      await this.createNotification({
        rfi_id: rfiId,
        type: 'response_received',
        message: `Client response received with status: ${responseStatus}`,
        metadata: {
          response_status: responseStatus,
          client_name: clientName,
          timestamp: new Date().toISOString()
        }
      });

      // Get RFI and project data for email
      const { data: rfiData, error: rfiError } = await supabase
        .from('rfis')
        .select(`
          *,
          projects!inner(
            id,
            project_name,
            client_company_name,
            contractor_job_number,
            project_manager_contact
          )
        `)
        .eq('id', rfiId)
        .single();

      if (rfiError || !rfiData) {
        console.error('Failed to fetch RFI data for notification:', rfiError);
        return;
      }

      // Generate email template for response received
      const emailTemplate = this.generateResponseReceivedTemplate(
        rfiData,
        responseStatus,
        clientName
      );

      // Determine recipients
      const recipients = this.determineRecipients(
        rfiData.projects,
        projectTeamEmails,
        'response_received'
      );

      // Send email notification
      await this.sendEmailNotification({
        to: recipients,
        subject: emailTemplate.subject,
        body: emailTemplate.body,
        template: 'response_received',
        rfiId: rfiId,
        projectId: rfiData.project_id
      });

      console.log(`✅ Client response notification sent for RFI ${rfiId}`);
    } catch (error) {
      console.error('Failed to send client response notification:', error);
    }
  }

  /**
   * Generate email template for response received notification
   */
  private static generateResponseReceivedTemplate(
    rfi: any,
    responseStatus: string,
    clientName: string
  ) {
    const project = rfi.projects;
    const statusColor = this.getStatusColor(responseStatus);
    const statusText = responseStatus.replace('_', ' ').toUpperCase();

    const subject = `🔔 Client Response Received - RFI ${rfi.rfi_number} - ${statusText}`;

    const body = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
  <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #0c4a6e; margin: 0 0 10px 0;">🔔 Client Response Received</h2>
    <p style="color: #075985; margin: 0;">Project: ${project.project_name}</p>
  </div>

  <p style="color: #374151;">Dear Project Team,</p>

  <p style="color: #374151;">A client response has been received for the following RFI:</p>

  <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <h3 style="color: #1f2937; margin: 0 0 10px 0;">RFI Details</h3>
    <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
      <li><strong>RFI Number:</strong> ${rfi.rfi_number}</li>
      <li><strong>Subject:</strong> ${rfi.subject}</li>
      <li><strong>Client:</strong> ${clientName}</li>
      <li><strong>Response Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></li>
      <li><strong>Response Date:</strong> ${new Date().toLocaleDateString()}</li>
    </ul>
  </div>

  <div style="background: #dcfce7; border: 1px solid #16a34a; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <h3 style="color: #166534; margin: 0 0 10px 0;">Next Steps</h3>
    <p style="color: #166534; margin: 0;">Please review the client response and take appropriate action. You can access the full RFI details in the system.</p>
  </div>

  <p style="color: #374151;">Thank you,<br>RFI Tracking System</p>
</div>
    `.trim();

    return { subject, body };
  }

  /**
   * Send email notification (placeholder - to be implemented with actual email service)
   */
  private static async sendEmailNotification(data: EmailNotificationData): Promise<void> {
    try {
      // This would integrate with your email service (SendGrid, Resend, etc.)
      console.log(`📧 Email notification sent to: ${data.to.join(', ')}`);
      console.log(`📧 Subject: ${data.subject}`);
      
      // For now, just log the notification
      // In production, you would call your email service here
      /*
      const emailService = new YourEmailService();
      await emailService.send({
        to: data.to,
        subject: data.subject,
        html: data.body
      });
      */
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  /**
   * Determine notification recipients based on notification type
   */
  private static determineRecipients(
    project: any,
    teamEmails: string[],
    notificationType: string
  ): string[] {
    const recipients: string[] = [];

    // Always include project manager
    if (project.project_manager_contact) {
      recipients.push(project.project_manager_contact);
    }

    // Add team emails for internal notifications
    if (notificationType === 'response_received' && teamEmails.length > 0) {
      recipients.push(...teamEmails);
    }

    // Remove duplicates
    return [...new Set(recipients)];
  }

  /**
   * Get color for status display
   */
  private static getStatusColor(status: string): string {
    switch (status) {
      case 'approved':
        return '#059669';
      case 'rejected':
        return '#dc2626';
      case 'needs_clarification':
        return '#d97706';
      default:
        return '#6b7280';
    }
  }

  /**
   * Mark notifications as read
   */
  static async markNotificationsAsRead(rfiId: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('rfi_id', rfiId);
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  }

  /**
   * Get unread notifications count
   */
  static async getUnreadNotificationsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      if (error) {
        console.error('Failed to get unread notifications count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Failed to get unread notifications count:', error);
      return 0;
    }
  }

  /**
   * Get recent notifications
   */
  static async getRecentNotifications(limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          rfis!inner(
            rfi_number,
            subject,
            projects!inner(
              project_name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get recent notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get recent notifications:', error);
      return [];
    }
  }

  /**
   * Clear (delete) a single notification
   */
  static async clearNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Failed to clear notification:', error);
        throw error;
      }

      console.log(`✅ Notification ${notificationId} cleared successfully`);
    } catch (error) {
      console.error('Failed to clear notification:', error);
      throw error;
    }
  }

  /**
   * Clear (delete) all notifications for a specific RFI
   */
  static async clearNotificationsForRFI(rfiId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('rfi_id', rfiId);

      if (error) {
        console.error('Failed to clear notifications for RFI:', error);
        throw error;
      }

      console.log(`✅ All notifications for RFI ${rfiId} cleared successfully`);
    } catch (error) {
      console.error('Failed to clear notifications for RFI:', error);
      throw error;
    }
  }

  /**
   * Clear (delete) all notifications
   */
  static async clearAllNotifications(): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (error) {
        console.error('Failed to clear all notifications:', error);
        throw error;
      }

      console.log('✅ All notifications cleared successfully');
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      throw error;
    }
  }

  /**
   * Clear (delete) all read notifications
   */
  static async clearReadNotifications(): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('is_read', true);

      if (error) {
        console.error('Failed to clear read notifications:', error);
        throw error;
      }

      console.log('✅ All read notifications cleared successfully');
    } catch (error) {
      console.error('Failed to clear read notifications:', error);
      throw error;
    }
  }
} 