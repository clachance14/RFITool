import { RFIStatusLegacy } from '@/lib/types';
import { supabase, handleSupabaseError } from '@/lib/supabase';
import { NotificationService } from './notificationService';

export interface RFIWorkflowTransition {
  from: RFIStatusLegacy;
  to: RFIStatusLegacy;
  label: string;
  description: string;
  icon: string;
  color: string;
  requiresValidation?: boolean;
  validationFields?: string[];
}

export interface RFIWorkflowState {
  status: RFIStatusLegacy;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
}

// Define the RFI workflow states
export const RFI_WORKFLOW_STATES: Record<RFIStatusLegacy, RFIWorkflowState> = {
  draft: {
    status: 'draft',
    label: 'Draft',
    description: 'RFI is being created and edited',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: 'pencil'
  },
  active: {
    status: 'active',
    label: 'Active',
    description: 'RFI is finalized and ready to send',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: 'check-circle'
  },
  sent: {
    status: 'sent',
    label: 'Sent',
    description: 'RFI has been sent to client',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: 'paper-airplane'
  },
  responded: {
    status: 'responded',
    label: 'Responded',
    description: 'Client has responded to the RFI',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: 'chat-bubble-left-right'
  },
  closed: {
    status: 'closed',
    label: 'Closed',
    description: 'RFI is complete and closed',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: 'archive-box'
  },
  overdue: {
    status: 'overdue',
    label: 'Overdue',
    description: 'RFI response is past due date',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: 'exclamation-triangle'
  },
  voided: {
    status: 'voided',
    label: 'Voided',
    description: 'RFI was created in error and voided',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    icon: 'x-circle'
  },
  revised: {
    status: 'revised',
    label: 'Revised',
    description: 'RFI has been revised with a new version',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    icon: 'document-duplicate'
  },
  returned: {
    status: 'returned',
    label: 'Returned',
    description: 'Client requested clarification or changes',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: 'arrow-uturn-left'
  },
  rejected: {
    status: 'rejected',
    label: 'Rejected',
    description: 'RFI was rejected as invalid or out of scope',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    icon: 'hand-raised'
  },
  superseded: {
    status: 'superseded',
    label: 'Superseded',
    description: 'RFI has been replaced by another RFI',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    icon: 'arrow-right-circle'
  }
};

// Define valid workflow transitions
export const RFI_WORKFLOW_TRANSITIONS: RFIWorkflowTransition[] = [
  {
    from: 'active',
    to: 'sent',
    label: 'Send to Client',
    description: 'Send the RFI to the client for response',
    icon: 'paper-airplane',
    color: 'bg-purple-600'
  },
  {
    from: 'sent',
    to: 'responded',
    label: 'Mark as Responded',
    description: 'Mark the RFI as responded by client',
    icon: 'chat-bubble-left-right',
    color: 'bg-green-600'
  },
  {
    from: 'responded',
    to: 'closed',
    label: 'Close RFI',
    description: 'Close the RFI as complete',
    icon: 'archive-box',
    color: 'bg-gray-600'
  },
  {
    from: 'active',
    to: 'draft',
    label: 'Back to Draft',
    description: 'Return RFI to draft for further editing',
    icon: 'arrow-left',
    color: 'bg-gray-500'
  },
  {
    from: 'sent',
    to: 'active',
    label: 'Recall RFI',
    description: 'Recall the RFI back to active status',
    icon: 'arrow-left',
    color: 'bg-gray-500'
  },
  {
    from: 'closed',
    to: 'active',
    label: 'Reopen RFI',
    description: 'Reopen the closed RFI',
    icon: 'arrow-path',
    color: 'bg-orange-600'
  },
  // Enhanced workflow transitions for edge cases
  {
    from: 'draft',
    to: 'voided',
    label: 'Void RFI',
    description: 'Mark RFI as void (created in error)',
    icon: 'x-circle',
    color: 'bg-gray-500',
    requiresValidation: true,
    validationFields: ['voided_reason']
  },
  {
    from: 'active',
    to: 'voided',
    label: 'Void RFI',
    description: 'Mark RFI as void (created in error)',
    icon: 'x-circle',
    color: 'bg-gray-500',
    requiresValidation: true,
    validationFields: ['voided_reason']
  },
  {
    from: 'draft',
    to: 'revised',
    label: 'Create Revision',
    description: 'Create a new version of this RFI',
    icon: 'document-duplicate',
    color: 'bg-indigo-600'
  },
  {
    from: 'active',
    to: 'revised',
    label: 'Create Revision',
    description: 'Create a new version of this RFI',
    icon: 'document-duplicate',
    color: 'bg-indigo-600'
  },
  {
    from: 'sent',
    to: 'returned',
    label: 'Mark as Returned',
    description: 'Client returned for clarification',
    icon: 'arrow-uturn-left',
    color: 'bg-yellow-600'
  },
  {
    from: 'sent',
    to: 'rejected',
    label: 'Mark as Rejected',
    description: 'Client rejected the RFI',
    icon: 'hand-raised',
    color: 'bg-red-600',
    requiresValidation: true,
    validationFields: ['rejection_type', 'rejection_reason']
  },
  {
    from: 'active',
    to: 'superseded',
    label: 'Mark as Superseded',
    description: 'Replace with another RFI',
    icon: 'arrow-right-circle',
    color: 'bg-purple-600',
    requiresValidation: true,
    validationFields: ['superseded_by']
  },
  {
    from: 'sent',
    to: 'superseded',
    label: 'Mark as Superseded',
    description: 'Replace with another RFI',
    icon: 'arrow-right-circle',
    color: 'bg-purple-600',
    requiresValidation: true,
    validationFields: ['superseded_by']
  },
  {
    from: 'returned',
    to: 'active',
    label: 'Address Return',
    description: 'Address client feedback and reactivate',
    icon: 'arrow-right',
    color: 'bg-blue-600'
  },
  {
    from: 'returned',
    to: 'revised',
    label: 'Create Revision',
    description: 'Create new version addressing feedback',
    icon: 'document-duplicate',
    color: 'bg-indigo-600'
  }
];

export class RFIWorkflowService {
  /**
   * Get available transitions for a given RFI status
   */
  static getAvailableTransitions(currentStatus: RFIStatusLegacy): RFIWorkflowTransition[] {
    return RFI_WORKFLOW_TRANSITIONS.filter(transition => transition.from === currentStatus);
  }

  /**
   * Check if a status transition is valid
   */
  static isValidTransition(from: RFIStatusLegacy, to: RFIStatusLegacy): boolean {
    return RFI_WORKFLOW_TRANSITIONS.some(transition => 
      transition.from === from && transition.to === to
    );
  }

  /**
   * Get workflow state information for a status
   */
  static getWorkflowState(status: RFIStatusLegacy): RFIWorkflowState {
    return RFI_WORKFLOW_STATES[status];
  }

  /**
   * Validate RFI data before allowing status transition
   */
  static async validateRFIForTransition(
    rfiId: string, 
    targetStatus: RFIStatusLegacy, 
    currentStatus: RFIStatusLegacy
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const transition = RFI_WORKFLOW_TRANSITIONS.find(t => 
      t.from === currentStatus && t.to === targetStatus
    );

    if (!transition) {
      errors.push(`Invalid transition from ${currentStatus} to ${targetStatus}`);
      return { valid: false, errors };
    }

    if (!transition.requiresValidation) {
      return { valid: true, errors: [] };
    }

    // Fetch RFI data for validation
    try {
      const { data: rfiData, error } = await supabase
        .from('rfis')
        .select('*')
        .eq('id', rfiId)
        .single();

      if (error) {
        errors.push('Failed to fetch RFI data for validation');
        return { valid: false, errors };
      }

      // Validate required fields
      if (transition.validationFields) {
        for (const field of transition.validationFields) {
          if (!rfiData[field] || (typeof rfiData[field] === 'string' && rfiData[field].trim() === '')) {
            const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            errors.push(`${fieldName} is required`);
          }
        }
      }

      // Additional validation based on target status
      if (targetStatus === 'sent') {
        if (!rfiData.due_date) {
          errors.push('Due date is required before sending RFI');
        }
        if (!rfiData.assigned_to) {
          errors.push('RFI must be assigned before sending');
        }
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      errors.push('Validation failed due to system error');
      return { valid: false, errors };
    }
  }

  /**
   * Execute a status transition with validation and side effects
   */
  static async executeTransition(
    rfiId: string,
    targetStatus: RFIStatusLegacy,
    currentStatus: RFIStatusLegacy,
    userId: string,
    additionalData?: Record<string, any>
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      // Validate the transition
      const validation = await this.validateRFIForTransition(rfiId, targetStatus, currentStatus);
      if (!validation.valid) {
        return {
          success: false,
          error: `Transition validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Prepare update data
      const updateData: any = {
        status: targetStatus,
        updated_at: new Date().toISOString()
      };

      // Add status-specific data
      switch (targetStatus) {
        case 'active':
          updateData.date_activated = new Date().toISOString();
          break;
        case 'sent':
          updateData.date_sent = new Date().toISOString();
          if (!updateData.due_date && additionalData?.due_date) {
            updateData.due_date = additionalData.due_date;
          }
          if (!updateData.assigned_to && additionalData?.assigned_to) {
            updateData.assigned_to = additionalData.assigned_to;
          }
          break;
        case 'responded':
          updateData.date_responded = new Date().toISOString();
          if (additionalData?.response) {
            updateData.client_response = additionalData.response;
          }
          break;
        case 'closed':
          updateData.date_closed = new Date().toISOString();
          break;
      }

      // Execute the database update
      const { data, error } = await supabase
        .from('rfis')
        .update(updateData)
        .eq('id', rfiId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: `Failed to update RFI status: ${error.message}`
        };
      }

      // Log the transition
      await this.logStatusTransition(rfiId, currentStatus, targetStatus, userId);
      
      // Also log to general activity table
      await this.logActivity(rfiId, userId, 'status_changed', {
        message: `Status changed from ${currentStatus} to ${targetStatus}`,
        from_status: currentStatus,
        to_status: targetStatus,
        reason: additionalData?.reason
      });

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: `Status transition failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Log status transitions for audit trail and create notifications
   */
  private static async logStatusTransition(
    rfiId: string,
    fromStatus: RFIStatusLegacy,
    toStatus: RFIStatusLegacy,
    userId: string,
    reason?: string
  ): Promise<void> {
    try {
      // Log to audit trail
      await supabase
        .from('rfi_status_logs')
        .insert({
          rfi_id: rfiId,
          from_status: fromStatus,
          to_status: toStatus,
          changed_by: userId,
          changed_at: new Date().toISOString(),
          reason: reason
        });

      // Create notification with enhanced user tracking
      await NotificationService.notifyStatusChange(
        rfiId,
        fromStatus,
        toStatus,
        userId,
        reason
      );

      console.log(`✅ Status transition logged and notification sent: ${fromStatus} → ${toStatus} by ${userId}`);
    } catch (error) {
      // Log error but don't fail the main operation
      console.warn('Failed to log status transition:', error);
    }
  }

  /**
   * Log general RFI activity for comprehensive tracking
   */
  private static async logActivity(
    rfiId: string,
    userId: string,
    activityType: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    try {
      await supabase
        .from('rfi_activity')
        .insert({
          rfi_id: rfiId,
          user_id: userId,
          activity_type: activityType,
          details: details,
          created_at: new Date().toISOString()
        });

      console.log(`✅ Activity logged: ${activityType} for RFI ${rfiId} by ${userId}`);
    } catch (error) {
      console.warn('Failed to log activity:', error);
    }
  }

  /**
   * Public method to log activities from other parts of the application
   */
  static async logRFIActivity(
    rfiId: string,
    userId: string,
    activityType: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    return this.logActivity(rfiId, userId, activityType, details);
  }

  /**
   * Check for overdue RFIs and update their status
   */
  static async checkForOverdueRFIs(): Promise<void> {
    try {
      const { data: overdueRFIs, error } = await supabase
        .from('rfis')
        .select('id, status, due_date')
        .eq('status', 'sent')
        .lt('due_date', new Date().toISOString());

      if (error) {
        console.error('Failed to check for overdue RFIs:', error);
        return;
      }

      if (overdueRFIs && overdueRFIs.length > 0) {
        const updatePromises = overdueRFIs.map(rfi =>
          supabase
            .from('rfis')
            .update({ status: 'overdue' })
            .eq('id', rfi.id)
        );

        await Promise.all(updatePromises);
        console.log(`Updated ${overdueRFIs.length} RFIs to overdue status`);
      }
    } catch (error) {
      console.error('Error checking for overdue RFIs:', error);
    }
  }
} 