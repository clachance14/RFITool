export interface Project {
  id: string;
  
  // Project Identification
  project_name: string;
  job_contract_number: string;
  client_company_name: string;
  company_id?: string; // Optional during testing phase
  project_manager_contact: string;
  
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

// RFI Status Types
export type RFIStatus = 'draft' | 'sent' | 'responded' | 'overdue';

// RFI Priority Types
export type RFIPriority = 'low' | 'medium' | 'high';

// RFI Interface
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
  attachments: string[];
  // Cost Impact Details
  manhours?: number;
  labor_costs?: number;
  material_costs?: number;
  equipment_costs?: number;
  subcontractor_costs?: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user';
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
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export interface ProjectFormData {
  name: string;
  client_name: string;
  job_number: string;
  contract_number: string;
  start_date: string;
  end_date?: string;
  status?: 'active' | 'completed' | 'on_hold';
  description: string;
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
  job_contract_number: string;
  client_company_name: string;
  company_id?: string; // Optional during testing phase
  project_manager_contact: string;
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