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
  status: z.enum(['draft', 'sent', 'responded', 'overdue'], {
    errorMap: () => ({ message: 'Invalid status value' }),
  }),
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
    // Additional validation: If status is 'sent', ensure required fields are present
    if (data.status === 'sent') {
      return !!data.reason_for_rfi && !!data.contractor_question;
    }
    return true;
  },
  {
    message: 'Reason for RFI and contractor question are required when sending an RFI',
    path: ['status'],
  }
);

// Schema for updating an existing RFI
export const updateRFISchema = z.object({
  subject: optionalTextField,
  description: optionalTextField,
  status: z.enum(['draft', 'sent', 'responded', 'overdue']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assigned_to: z.string().nullable().optional(),
  due_date: z.string().datetime().nullable().optional(),
  response: z.string().nullable().optional(),
  response_date: z.string().datetime().nullable().optional(),
}).refine(
  (data) => {
    // Additional validation: If status is 'sent', ensure required fields are present
    if (data.status === 'sent') {
      return !!data.description;
    }
    return true;
  },
  {
    message: 'Description is required when sending an RFI',
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
  job_contract_number: z.string().min(1, 'Contract number is required').max(100),
  client_company_name: z.string().min(1, 'Client company is required').max(200),
  project_manager_contact: z.string().min(1, 'Contact is required'),
  
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