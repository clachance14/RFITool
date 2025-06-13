import * as z from 'zod';

// Common field schemas that are reused
const textField = z.string().min(1, 'Subject is required').max(500, 'Subject too long');
const optionalTextField = z.string().max(500, 'Maximum 500 characters allowed').optional();
const optionalLongTextField = z.string().max(2000, 'Maximum 2000 characters allowed').optional();

// Base RFI schema with required fields
const baseRFISchema = {
  subject: textField,
  reason_for_rfi: z.string().min(1, 'Reason for RFI is required'),
  contractor_question: z.string().min(1, 'Contractor question is required'),
  project_id: z.string().min(1, 'Project selection is required'),
  status: z.enum(['draft', 'active', 'closed'], {
    errorMap: () => ({ message: 'Invalid status value' }),
  }),
  stage: z.enum([
    'sent_to_client',
    'awaiting_response', 
    'response_received',
    'field_work_in_progress',
    'work_completed',
    'declined',
    'late_overdue',
    'revision_requested',
    'on_hold'
  ]).optional().nullable(),
  urgency: z.enum(['urgent', 'non-urgent'], {
    errorMap: () => ({ message: 'Invalid urgency value' }),
  }),
};

// Optional fields schema
const optionalRFIFields = {
  // Project context fields
  discipline: z.string().max(255, 'Maximum 255 characters allowed').optional(),
  system: z.string().max(255, 'Maximum 255 characters allowed').optional(),
  work_impact: z.string().max(255, 'Maximum 255 characters allowed').optional(),
  cost_impact: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }, z.number().positive().optional()),
  schedule_impact: z.string().optional(),
  test_package: z.string().max(255, 'Maximum 255 characters allowed').optional(),
  schedule_id: z.string().max(255, 'Maximum 255 characters allowed').optional(),
  block_area: z.string().max(255, 'Maximum 255 characters allowed').optional(),
  
  // Solution and additional fields
  contractor_proposed_solution: optionalLongTextField,
  
  // Response fields
  client_response: z.string().optional(),
  client_response_submitted_by: z.string().max(255, 'Maximum 255 characters allowed').optional(),
  client_cm_approval: z.string().max(255, 'Maximum 255 characters allowed').optional(),
  
  // NEW: Field Work Tracking
  work_started_date: z.string().datetime().optional(),
  work_completed_date: z.string().datetime().optional(),
  actual_labor_hours: z.number().positive().optional(),
  actual_labor_cost: z.number().positive().optional(),
  actual_material_cost: z.number().positive().optional(),
  actual_equipment_cost: z.number().positive().optional(),
  actual_total_cost: z.number().positive().optional(),
  
  // System fields
  to_recipient: z.string().max(500, 'Maximum 500 characters allowed').optional(),
  revision: z.string().default('0'),
  date_created: z.string().datetime().optional(),
  requested_by: optionalTextField,
  reviewed_by: optionalTextField,
};

// Schema for creating a new RFI
export const createRFISchema = z.object({
  ...baseRFISchema,
  ...optionalRFIFields,
}).refine(
  (data) => {
    // Additional validation: If status is 'active', ensure stage is provided
    if (data.status === 'active' && !data.stage) {
      return false;
    }
    // If stage is field_work_in_progress, status must be active
    if (data.stage === 'field_work_in_progress' && data.status !== 'active') {
      return false;
    }
    return true;
  },
  {
    message: 'Active RFIs must have a stage, and field work stages require active status',
    path: ['status'],
  }
);

// Schema for updating an existing RFI
export const updateRFISchema = z.object({
  subject: optionalTextField,
  description: optionalTextField,
  status: z.enum(['draft', 'active', 'closed']).optional(),
  stage: z.enum([
    'sent_to_client',
    'awaiting_response', 
    'response_received',
    'field_work_in_progress',
    'work_completed',
    'declined',
    'late_overdue',
    'revision_requested',
    'on_hold'
  ]).optional().nullable(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assigned_to: z.string().nullable().optional(),
  due_date: z.string().datetime().nullable().optional(),
  response: z.string().nullable().optional(),
  response_date: z.string().datetime().nullable().optional(),
  
  // NEW: Field Work Tracking
  work_started_date: z.string().datetime().optional().nullable(),
  work_completed_date: z.string().datetime().optional().nullable(),
  actual_labor_hours: z.number().positive().optional().nullable(),
  actual_labor_cost: z.number().positive().optional().nullable(),
  actual_material_cost: z.number().positive().optional().nullable(),
  actual_equipment_cost: z.number().positive().optional().nullable(),
  actual_total_cost: z.number().positive().optional().nullable(),
  
  // Edge case fields (kept for compatibility)
  rejection_type: z.enum(['internal_review', 'client_rejected', 'client_rejected_not_in_scope']).optional(),
  rejection_reason: z.string().max(1000, 'Rejection reason too long').optional(),
  voided_reason: z.string().max(1000, 'Voided reason too long').optional(),
  superseded_by: z.string().uuid('Invalid RFI ID format').optional(),
}).refine(
  (data) => {
    // Additional validation: If status is 'active', ensure stage is provided
    if (data.status === 'active' && !data.stage) {
      return false;
    }
    // If stage is field_work_in_progress, status must be active
    if (data.stage === 'field_work_in_progress' && data.status !== 'active') {
      return false;
    }
    // If work_completed_date is set, work_started_date should also be set
    if (data.work_completed_date && !data.work_started_date) {
      return false;
    }
    return true;
  },
  {
    message: 'Invalid status/stage combination or work date sequence',
    path: ['status'],
  }
);

// Type inference for the schemas
export type CreateRFIInput = z.infer<typeof createRFISchema>;
export type UpdateRFIInput = z.infer<typeof updateRFISchema>;

// Validation error type
export type ValidationError = {
  field: string;
  message: string;
};

// Helper function to format Zod errors into a more user-friendly format
export function formatValidationErrors(error: z.ZodError): ValidationError[] {
  return error.errors.map((err: z.ZodIssue) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

export const createProjectSchema = z.object({
  project_name: z.string().min(1, 'Project name is required').max(200),
  contractor_job_number: z.string().min(1, 'Contractor job number is required').max(100),
  job_contract_number: z.string().min(1, 'Contract number is required').max(100),
  client_company_name: z.string().min(1, 'Client company is required').max(200),
  company_id: z.string().max(100).optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  project_manager_contact: z.string().min(1, 'Contact is required'),
  client_contact_name: z.string().min(1, 'Client contact name is required').max(200),
  
  // Make these truly optional by transforming empty strings to undefined
  location: z.string().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  project_type: z.enum(['mechanical', 'civil', 'ie', 'other']).optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  contract_value: z.preprocess((val) => {
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }, z.number().positive().optional()),
  start_date: z.string().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  expected_completion: z.string().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  project_description: z.string().max(1000).optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  
  // Logo URLs
  client_logo_url: z.string().url().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  
  default_urgency: z.enum(['urgent', 'non-urgent']),
  
  // Handle standard_recipients array with email validation
  standard_recipients: z.array(z.string())
    .transform(arr => arr.filter(email => email && email.trim() !== ''))
    .pipe(
      z.array(
        z.string()
          .email('Invalid email address')
      )
      .min(1, 'At least one recipient required')
    ),
  
  project_disciplines: z.array(z.string()).optional(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  id: z.string().uuid(),
});

// Export types
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>; 
