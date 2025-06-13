import { format } from 'date-fns';
import { RFI } from '@/lib/types';

export interface EmailTemplateOptions {
  senderName?: string;
  senderTitle?: string;
  companyName?: string;
  projectManager?: string;
  includeUrgencyInSubject?: boolean;
  includeProjectDetails?: boolean;
  customMessage?: string;
  signatureType?: 'simple' | 'professional' | 'custom';
  customSignature?: string;
}

export interface EmailTemplate {
  subject: string;
  body: string;
  plainText: string;
}

export class EmailTemplateService {
  private static readonly DEFAULT_OPTIONS: EmailTemplateOptions = {
    senderName: 'Project Team',
    senderTitle: 'Project Manager',
    companyName: 'Construction Company',
    includeUrgencyInSubject: true,
    includeProjectDetails: true,
    signatureType: 'professional'
  };

  /**
   * Generate client link email template
   */
  static generateClientLinkTemplate(
    rfi: any,
    linkData: any,
    project: any,
    options: EmailTemplateOptions = {}
  ): EmailTemplate {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const projectName = project?.project_name || 'Unknown Project';
    const contractorName = project?.contractor_job_number || opts.companyName;
    const clientName = project?.client_company_name || 'Client';
    const expiryDate = format(new Date(linkData.expires_at), 'PPPP');
    const urgencyText = rfi.urgency === 'urgent' ? 'URGENT - ' : '';
    const subjectUrgency = opts.includeUrgencyInSubject && rfi.urgency === 'urgent' ? '[URGENT] ' : '';

    const subject = `${subjectUrgency}RFI ${rfi.rfi_number} - ${rfi.subject} - Response Required`;

    const body = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #1f2937; margin: 0 0 10px 0;">${urgencyText}Request for Information</h2>
    <p style="color: #6b7280; margin: 0;">Project: ${projectName}</p>
  </div>

  <p style="color: #374151;">Dear ${clientName} Team,</p>

  <p style="color: #374151;">Please review and provide your response to the following Request for Information:</p>

  ${opts.includeProjectDetails ? `
  <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <h3 style="color: #1f2937; margin: 0 0 10px 0;">Project Details</h3>
    <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
      <li><strong>Project:</strong> ${projectName}</li>
      <li><strong>RFI Number:</strong> ${rfi.rfi_number}</li>
      <li><strong>Subject:</strong> ${rfi.subject}</li>
      <li><strong>Date Issued:</strong> ${format(new Date(rfi.created_at), 'PPP')}</li>
      ${rfi.urgency === 'urgent' ? '<li style="color: #dc2626;"><strong>Priority:</strong> URGENT</li>' : ''}
    </ul>
  </div>
  ` : ''}

  <div style="background: #dbeafe; border: 1px solid #3b82f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <h3 style="color: #1e40af; margin: 0 0 10px 0;">Response Required</h3>
    <p style="color: #1e40af; margin: 0 0 10px 0;">Click the secure link below to view the complete RFI details and submit your response:</p>
    <a href="${linkData.secure_link}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">View RFI & Respond</a>
  </div>

  ${opts.customMessage ? `
  <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <p style="color: #374151; margin: 0;">${opts.customMessage}</p>
  </div>
  ` : ''}

  <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <h3 style="color: #92400e; margin: 0 0 10px 0;">Important Information</h3>
    <ul style="color: #92400e; margin: 0; padding-left: 20px;">
      <li>This secure link will expire on <strong>${expiryDate}</strong></li>
      <li>Only authorized personnel should access this link</li>
      <li>Your response is required to proceed with the project</li>
      <li>Please respond promptly to avoid project delays</li>
    </ul>
  </div>

  <p style="color: #374151;">If you have any questions or need assistance accessing the RFI, please contact our project team immediately.</p>

  <p style="color: #374151;">Thank you for your prompt attention to this matter.</p>

  ${this.generateSignature(opts, contractorName)}
</div>
    `.trim();

    const plainText = `
Dear ${clientName} Team,

${urgencyText}Please review and provide your response to the following Request for Information:

PROJECT DETAILS:
• Project: ${projectName}
• RFI Number: ${rfi.rfi_number}
• Subject: ${rfi.subject}
• Date Issued: ${format(new Date(rfi.created_at), 'PPP')}
${rfi.urgency === 'urgent' ? '• Priority: URGENT' : ''}

RESPONSE REQUIRED:
Please click the secure link below to view the complete RFI details and submit your response:

${linkData.secure_link}

${opts.customMessage ? `\n${opts.customMessage}\n` : ''}

IMPORTANT INFORMATION:
• This secure link will expire on ${expiryDate}
• Only authorized personnel should access this link
• Your response is required to proceed with the project
• Please respond promptly to avoid project delays

If you have any questions or need assistance accessing the RFI, please contact our project team immediately.

Thank you for your prompt attention to this matter.

${this.generatePlainTextSignature(opts, contractorName)}
    `.trim();

    return { subject, body, plainText };
  }

  /**
   * Generate RFI status update email template
   */
  static generateStatusUpdateTemplate(
    rfi: any,
    project: any,
    newStatus: string,
    options: EmailTemplateOptions = {}
  ): EmailTemplate {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const projectName = project?.project_name || 'Unknown Project';
    const contractorName = project?.contractor_job_number || opts.companyName;
    const clientName = project?.client_company_name || 'Client';

    const statusDisplay = newStatus.replace('_', ' ').toUpperCase();
    const subject = `RFI ${rfi.rfi_number} Status Update - ${statusDisplay}`;

    const body = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #1f2937; margin: 0 0 10px 0;">RFI Status Update</h2>
    <p style="color: #6b7280; margin: 0;">Project: ${projectName}</p>
  </div>

  <p style="color: #374151;">Dear ${clientName} Team,</p>

  <p style="color: #374151;">This is to inform you that the status of RFI ${rfi.rfi_number} has been updated.</p>

  <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <h3 style="color: #1f2937; margin: 0 0 10px 0;">RFI Details</h3>
    <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
      <li><strong>RFI Number:</strong> ${rfi.rfi_number}</li>
      <li><strong>Subject:</strong> ${rfi.subject}</li>
      <li><strong>New Status:</strong> <span style="color: #059669; font-weight: bold;">${statusDisplay}</span></li>
      <li><strong>Updated:</strong> ${format(new Date(), 'PPP')}</li>
    </ul>
  </div>

  ${opts.customMessage ? `
  <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <p style="color: #374151; margin: 0;">${opts.customMessage}</p>
  </div>
  ` : ''}

  <p style="color: #374151;">If you have any questions regarding this update, please don't hesitate to contact our project team.</p>

  ${this.generateSignature(opts, contractorName)}
</div>
    `.trim();

    const plainText = `
Dear ${clientName} Team,

This is to inform you that the status of RFI ${rfi.rfi_number} has been updated.

RFI DETAILS:
• RFI Number: ${rfi.rfi_number}
• Subject: ${rfi.subject}
• New Status: ${statusDisplay}
• Updated: ${format(new Date(), 'PPP')}

${opts.customMessage ? `\n${opts.customMessage}\n` : ''}

If you have any questions regarding this update, please don't hesitate to contact our project team.

${this.generatePlainTextSignature(opts, contractorName)}
    `.trim();

    return { subject, body, plainText };
  }

  /**
   * Generate RFI reminder email template
   */
  static generateReminderTemplate(
    rfi: any,
    project: any,
    daysOverdue: number,
    options: EmailTemplateOptions = {}
  ): EmailTemplate {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const projectName = project?.project_name || 'Unknown Project';
    const contractorName = project?.contractor_job_number || opts.companyName;
    const clientName = project?.client_company_name || 'Client';

    const subject = `REMINDER: RFI ${rfi.rfi_number} Response Required - ${daysOverdue} Days Overdue`;

    const body = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
  <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #dc2626; margin: 0 0 10px 0;">⚠️ RFI Response Overdue</h2>
    <p style="color: #7f1d1d; margin: 0;">Project: ${projectName}</p>
  </div>

  <p style="color: #374151;">Dear ${clientName} Team,</p>

  <p style="color: #374151;">This is a reminder that RFI ${rfi.rfi_number} is now <strong style="color: #dc2626;">${daysOverdue} days overdue</strong> for response.</p>

  <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <h3 style="color: #1f2937; margin: 0 0 10px 0;">RFI Details</h3>
    <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
      <li><strong>RFI Number:</strong> ${rfi.rfi_number}</li>
      <li><strong>Subject:</strong> ${rfi.subject}</li>
      <li><strong>Date Issued:</strong> ${format(new Date(rfi.created_at), 'PPP')}</li>
      <li><strong>Days Overdue:</strong> <span style="color: #dc2626; font-weight: bold;">${daysOverdue} days</span></li>
    </ul>
  </div>

  <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <h3 style="color: #92400e; margin: 0 0 10px 0;">Action Required</h3>
    <p style="color: #92400e; margin: 0;">Please provide your response to this RFI as soon as possible to avoid further project delays. The overdue response may impact project schedule and costs.</p>
  </div>

  ${opts.customMessage ? `
  <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <p style="color: #374151; margin: 0;">${opts.customMessage}</p>
  </div>
  ` : ''}

  <p style="color: #374151;">If you need assistance or have questions, please contact our project team immediately.</p>

  ${this.generateSignature(opts, contractorName)}
</div>
    `.trim();

    const plainText = `
Dear ${clientName} Team,

This is a reminder that RFI ${rfi.rfi_number} is now ${daysOverdue} days overdue for response.

RFI DETAILS:
• RFI Number: ${rfi.rfi_number}
• Subject: ${rfi.subject}
• Date Issued: ${format(new Date(rfi.created_at), 'PPP')}
• Days Overdue: ${daysOverdue} days

ACTION REQUIRED:
Please provide your response to this RFI as soon as possible to avoid further project delays. The overdue response may impact project schedule and costs.

${opts.customMessage ? `\n${opts.customMessage}\n` : ''}

If you need assistance or have questions, please contact our project team immediately.

${this.generatePlainTextSignature(opts, contractorName)}
    `.trim();

    return { subject, body, plainText };
  }

  /**
   * Generate email signature
   */
  private static generateSignature(options: EmailTemplateOptions, contractorName: string): string {
    switch (options.signatureType) {
      case 'simple':
        return `
          <p style="color: #374151; margin-top: 30px;">
            Best regards,<br>
            ${options.senderName}<br>
            ${contractorName}
          </p>
        `;
      case 'professional':
        return `
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #374151; margin: 0;">Best regards,</p>
            <p style="color: #1f2937; font-weight: bold; margin: 5px 0 0 0;">${options.senderName}</p>
            <p style="color: #6b7280; margin: 0;">${options.senderTitle}</p>
            <p style="color: #6b7280; margin: 0;">${contractorName}</p>
            ${options.projectManager ? `<p style="color: #6b7280; margin: 0;">Project Manager: ${options.projectManager}</p>` : ''}
          </div>
        `;
      case 'custom':
        return options.customSignature || '';
      default:
        return `
          <p style="color: #374151; margin-top: 30px;">
            Best regards,<br>
            ${options.senderName}<br>
            ${contractorName}
          </p>
        `;
    }
  }

  /**
   * Generate plain text signature
   */
  private static generatePlainTextSignature(options: EmailTemplateOptions, contractorName: string): string {
    switch (options.signatureType) {
      case 'simple':
        return `Best regards,\n${options.senderName}\n${contractorName}`;
      case 'professional':
        return `Best regards,\n\n${options.senderName}\n${options.senderTitle}\n${contractorName}${options.projectManager ? `\nProject Manager: ${options.projectManager}` : ''}`;
      case 'custom':
        return options.customSignature?.replace(/<[^>]*>/g, '') || '';
      default:
        return `Best regards,\n${options.senderName}\n${contractorName}`;
    }
  }

  /**
   * Get available template types
   */
  static getAvailableTemplates(): string[] {
    return ['client_link', 'status_update', 'reminder', 'response_received'];
  }

  /**
   * Validate email template options
   */
  static validateOptions(options: EmailTemplateOptions): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (options.signatureType === 'custom' && !options.customSignature) {
      errors.push('Custom signature is required when using custom signature type');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 