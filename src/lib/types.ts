export interface Project {
  id: string;
  
  // Project Identification
  project_name: string;
  contractor_job_number: string;
  job_contract_number: string;
  client_company_name: string;
  company_id?: string; // Optional during testing phase
  project_manager_contact: string;
  client_contact_name: string;
  
  // Project Details
  location?: string;
  project_type?: 'mechanical' | 'civil' | 'ie' | 'other';
  contract_value?: number;
  start_date?: string;
  expected_completion?: string;
  project_description?: string;
  
  // Logo URLs
  client_logo_url?: string; // Client logo for this project
  
  // Default RFI Settings
  default_urgency: 'urgent' | 'non-urgent';
  standard_recipients: string[];
  project_disciplines: string[];
  
  // System fields
  created_at: string;
  updated_at: string;
}

// NEW: 3-Value Status System
export type RFIStatus = 'draft' | 'active' | 'closed';

// NEW: Detailed Stage System
export type RFIStage = 
  | 'sent_to_client'
  | 'awaiting_response' 
  | 'response_received'
  | 'field_work_in_progress'
  | 'work_completed'
  | 'declined'
  | 'late_overdue'
  | 'revision_requested'
  | 'on_hold';

// LEGACY: Keep for backward compatibility during transition
export type RFIStatusLegacy = 'draft' | 'active' | 'sent' | 'responded' | 'closed' | 'overdue' | 'voided' | 'revised' | 'returned' | 'rejected' | 'superseded';

// RFI Rejection Types
export type RFIRejectionType = 'internal_review' | 'client_rejected' | 'client_rejected_not_in_scope';

// RFI Status Categories for business logic
export type RFIStatusCategory = 'active' | 'terminal' | 'transitional';

// RFI Priority Types
export type RFIPriority = 'low' | 'medium' | 'high';

// RFI Cost Types
export type RFICostType = 'labor' | 'material' | 'equipment' | 'subcontractor' | 'other';

// RFI Cost Item Interface
export interface RFICostItem {
  id: string;
  rfi_id: string;
  description: string;
  cost_type: RFICostType;
  quantity: number;
  unit: string;
  unit_cost: number;
  created_at: string;
}

// RFI Attachment Interface
export interface RFIAttachment {
  id: string;
  rfi_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_size_bytes?: number; // Legacy field for compatibility
  file_type: string;
  created_at: string;
  uploaded_by: string;
  public_url?: string;
}

// RFI Revision Interface for version tracking
export interface RFIRevision {
  id: string;
  rfi_id: string;
  revision_number: number;
  subject: string;
  description: string;
  reason_for_rfi: string;
  contractor_question: string;
  contractor_proposed_solution?: string;
  created_by: string;
  created_at: string;
  changes_summary?: string;
}

// RFI Status Log for audit trail
export interface RFIStatusLog {
  id: string;
  rfi_id: string;
  from_status: RFIStatus;
  to_status: RFIStatus;
  from_stage?: RFIStage;
  to_stage?: RFIStage;
  changed_by: string;
  changed_at: string;
  reason?: string;
  additional_data?: Record<string, any>;
}

// Enhanced RFI Interface with NEW status/stage system
export interface RFI {
  id: string;
  rfi_number: string;
  project_id: string;
  subject: string;
  description: string;
  proposed_solution?: string;
  
  // NEW: Status/Stage System
  status: RFIStatus;
  stage?: RFIStage | null;
  
  priority: RFIPriority;
  assigned_to: string | null;
  due_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  response: string | null;
  response_date: string | null;
  
  // Revision Tracking
  current_revision?: number;
  original_rfi_id?: string; // For revisions, points to original
  
  // Edge Case Fields
  superseded_by?: string; // RFI ID that superseded this one
  superseded_at?: string;
  rejection_type?: RFIRejectionType;
  rejection_reason?: string;
  voided_reason?: string;
  voided_by?: string;
  voided_at?: string;
  
  // Admin Controls
  reopened_by?: string;
  reopened_at?: string;
  reopened_reason?: string;
  
  // Status Tracking
  date_activated?: string;
  date_sent?: string;
  date_responded?: string;
  date_closed?: string;
  date_returned?: string;
  days_overdue?: number;
  
  // NEW: Field Work Tracking
  work_started_date?: string;
  work_completed_date?: string;
  actual_labor_hours?: number;
  actual_labor_cost?: number;
  actual_material_cost?: number;
  actual_equipment_cost?: number;
  actual_total_cost?: number;
  
  // Secure Links
  secure_link_token?: string;
  link_expires_at?: string;
  
  attachments: string[];
  // Attachment objects with full details
  attachment_files?: RFIAttachment[];
  // Revision history
  revisions?: RFIRevision[];
  // Status change history
  status_logs?: RFIStatusLog[];
  
  // Cost Impact Details (legacy fields for compatibility)
  manhours?: number;
  labor_costs?: number;
  material_costs?: number;
  equipment_costs?: number;
  subcontractor_costs?: number;
  // Cost Items (new normalized structure)
  cost_items?: RFICostItem[];
  
  // Cost Tracking Flags
  exclude_from_cost_tracking?: boolean; // For VOIDED/SUPERSEDED RFIs
  cost_tracking_transferred_to?: string; // RFI ID for SUPERSEDED cases
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'app_owner' | 'super_admin' | 'admin' | 'rfi_user' | 'view_only' | 'client_collaborator';
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  logo_url?: string; // Contractor logo
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  company_id: string;
  role: 'app_owner' | 'super_admin' | 'admin' | 'rfi_user' | 'view_only' | 'client_collaborator';
  created_at: string;
  updated_at: string;
}

// Form Input Types
export interface CreateRFIInput {
  project_id: string;
  subject: string;
  to_recipient: string;
  reason_for_rfi: string;
  urgency: 'urgent' | 'non-urgent';
  status: RFIStatus;
  stage?: RFIStage | null;
  company?: string;
  contract_number?: string;
  revision?: string;
  date_created?: string;
  work_impact?: string;
  cost_impact?: string;
  schedule_impact?: string;
  discipline?: string;
  system?: string;
  sub_system?: string;
  schedule_id?: string;
  test_package?: string;
  contractor_proposed_solution?: string;
  associated_reference_documents?: string;
  requested_by?: string;
  reviewed_by?: string;
  contractor_question?: string;
  block_area?: string;
  // Cost Impact Details
  manhours?: number;
  labor_costs?: number;
  material_costs?: number;
  equipment_costs?: number;
  subcontractor_costs?: number;
  // Field Work Tracking
  work_started_date?: string;
  work_completed_date?: string;
  actual_labor_hours?: number;
  actual_labor_cost?: number;
  actual_material_cost?: number;
  actual_equipment_cost?: number;
  actual_total_cost?: number;
  // Attachments
  attachments?: File[];
}

export interface UpdateRFIInput {
  subject?: string;
  description?: string;
  status?: RFIStatus;
  stage?: RFIStage | null;
  priority?: RFIPriority;
  assigned_to?: string | null;
  due_date?: string | null;
  response?: string | null;
  response_date?: string | null;
  // Field Work Tracking
  work_started_date?: string | null;
  work_completed_date?: string | null;
  actual_labor_hours?: number | null;
  actual_labor_cost?: number | null;
  actual_material_cost?: number | null;
  actual_equipment_cost?: number | null;
  actual_total_cost?: number | null;
  // Edge case fields
  rejection_type?: RFIRejectionType;
  rejection_reason?: string;
  voided_reason?: string;
  superseded_by?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Create/Update input types
export interface CreateProjectInput {
  project_name: string;
  contractor_job_number: string;
  job_contract_number: string;
  client_company_name: string;
  company_id?: string; // Optional during testing phase
  project_manager_contact: string;
  client_contact_name: string;
  location?: string;
  project_type?: 'mechanical' | 'civil' | 'ie' | 'other';
  contract_value?: number;
  start_date?: string;
  expected_completion?: string;
  project_description?: string;
  client_logo_url?: string; // Client logo URL
  default_urgency: 'urgent' | 'non-urgent';
  standard_recipients: string[];
  project_disciplines: string[];
}

// STATUS/STAGE UTILITY FUNCTIONS AND TYPES

// Status/Stage Display Configuration
export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

export interface StageConfig {
  label: string;
  color: string;
  bgColor: string;
  description: string;
}

// Status Display Configurations
export const STATUS_CONFIGS: Record<RFIStatus, StatusConfig> = {
  draft: {
    label: 'Draft',
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
    icon: '🟡'
  },
  active: {
    label: 'Active',
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
    icon: '🔵'
  },
  closed: {
    label: 'Closed',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
    icon: '🟢'
  }
};

// Stage Display Configurations
export const STAGE_CONFIGS: Record<RFIStage, StageConfig> = {
  sent_to_client: {
    label: 'Sent to Client',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    description: 'RFI has been sent to client for review'
  },
  awaiting_response: {
    label: 'Awaiting Response',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    description: 'Waiting for client response'
  },
  response_received: {
    label: 'Response Received',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    description: 'Client has provided a response'
  },
  field_work_in_progress: {
    label: 'Field Work in Progress',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    description: 'Field work is being performed to address the RFI'
  },
  work_completed: {
    label: 'Work Completed',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    description: 'Field work has been completed'
  },
  declined: {
    label: 'Declined',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    description: 'RFI was declined by client'
  },
  late_overdue: {
    label: 'Late/Overdue',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    description: 'RFI response is overdue'
  },
  revision_requested: {
    label: 'Revision Requested',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    description: 'Client has requested revisions'
  },
  on_hold: {
    label: 'On Hold',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    description: 'RFI is temporarily on hold'
  }
};

// Valid Stage Transitions
export const STAGE_TRANSITIONS: Record<RFIStage, RFIStage[]> = {
  sent_to_client: ['awaiting_response', 'late_overdue', 'response_received'],
  awaiting_response: ['response_received', 'late_overdue', 'on_hold'],
  response_received: ['field_work_in_progress', 'work_completed', 'declined', 'revision_requested'],
  field_work_in_progress: ['work_completed', 'on_hold'],
  work_completed: [], // Terminal stage
  declined: [], // Terminal stage
  late_overdue: ['response_received', 'declined'],
  revision_requested: ['sent_to_client'],
  on_hold: ['awaiting_response', 'field_work_in_progress']
};

// Utility Functions
export function getStatusDisplay(status: RFIStatus): StatusConfig {
  return STATUS_CONFIGS[status];
}

export function getStageDisplay(stage: RFIStage): StageConfig {
  return STAGE_CONFIGS[stage];
}

export function canTransitionToStage(currentStage: RFIStage | null, targetStage: RFIStage): boolean {
  if (!currentStage) return true; // From null stage, can transition to any stage
  return STAGE_TRANSITIONS[currentStage].includes(targetStage);
}

export function isTerminalStage(stage: RFIStage): boolean {
  return STAGE_TRANSITIONS[stage].length === 0;
}

export function requiresFieldWork(stage: RFIStage): boolean {
  return stage === 'field_work_in_progress' || stage === 'work_completed';
}

export function getNextPossibleStages(currentStage: RFIStage | null): RFIStage[] {
  if (!currentStage) {
    return ['sent_to_client', 'awaiting_response'];
  }
  return STAGE_TRANSITIONS[currentStage];
} 