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

// Enhanced RFI Status Types with edge cases
export type RFIStatus = 'draft' | 'active' | 'sent' | 'responded' | 'closed' | 'overdue' | 'voided' | 'revised' | 'returned' | 'rejected' | 'superseded';

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
  file_size_bytes: number;
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
  changed_by: string;
  changed_at: string;
  reason?: string;
  additional_data?: Record<string, any>;
}

// Enhanced RFI Interface with revision tracking and edge case fields
export interface RFI {
  id: string;
  rfi_number: string;
  project_id: string;
  subject: string;
  description: string;
  status: RFIStatus;
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
  role: 'owner' | 'admin' | 'rfi_user' | 'view_only' | 'client_collaborator';
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
  role: 'owner' | 'admin' | 'rfi_user' | 'view_only' | 'client_collaborator';
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
  // Attachments
  attachments?: File[];
}

export interface UpdateRFIInput {
  subject?: string;
  description?: string;
  status?: RFIStatus;
  priority?: RFIPriority;
  assigned_to?: string | null;
  due_date?: string | null;
  response?: string | null;
  response_date?: string | null;
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