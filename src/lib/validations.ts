import * as z from 'zod';

// Common field schemas that are reused
const textField = z.string().min(1, 'Subject is required').max(500, 'Subject too long');
const optionalTextField = z.string().max(500, 'Maximum 500 characters allowed').optional();
const optionalLongTextField = z.string().max(2000, 'Maximum 2000 characters allowed').optional();

// Base RFI schema with common fields
const baseRFISchema = {
  subject: textField,
  to_recipient: z.string().min(1, 'To Recipient is required').max(500, 'Maximum 500 characters allowed'),
  reason_for_rfi: z.string().min(1, 'Reason for RFI is required').max(500, 'Maximum 500 characters allowed'),
  project_id: z.string().uuid('Invalid project ID'),
  status: z.enum(['draft', 'sent', 'responded', 'overdue'], {
    errorMap: () => ({ message: 'Invalid status value' }),
  }),
  urgency: z.enum(['urgent', 'non-urgent'], {
    errorMap: () => ({ message: 'Invalid urgency value' }),
  }),
};

// Optional fields schema
const optionalRFIFields = {
  company: optionalTextField,
  contract_number: optionalTextField,
  revision: z.string().default('0'),
  date_created: z.string().datetime().optional(),
  work_impact: optionalLongTextField,
  cost_impact: optionalLongTextField,
  schedule_impact: optionalLongTextField,
  discipline: optionalTextField,
  system: optionalTextField,
  sub_system: optionalTextField,
  schedule_id: optionalTextField,
  test_package: optionalTextField,
  contractor_proposed_solution: optionalLongTextField,
  associated_reference_documents: optionalLongTextField,
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
      return !!data.to_recipient && !!data.reason_for_rfi;
    }
    return true;
  },
  {
    message: 'Recipient and reason are required when sending an RFI',
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