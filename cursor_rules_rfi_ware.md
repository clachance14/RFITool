# Cursor Rules for RFI Ware Development

## Project Overview
You are building RFI Ware, a professional web application for general contractors in industrial construction to create, send, manage, and track Requests for Information (RFIs). This is a business-critical tool that must be reliable, secure, and user-friendly for users with basic computer skills.

## Core Development Principles

### 1. Industrial Professional Aesthetic
- **Design Philosophy**: Clean, functional, no-nonsense interface that prioritizes usability over visual flair
- **Color Palette**: Neutral grays (#f8f9fa, #e9ecef, #6c757d), whites (#ffffff), and muted blues (#0066cc, #004499) for professional appearance
- **Typography**: Use system fonts for reliability and fast loading
- **Visual Hierarchy**: Clear, obvious information hierarchy with proper spacing and contrast
- **Iconography**: Use lucide-react icons sparingly and only when they enhance understanding

### 2. User Experience for Basic Computer Users
- **Navigation**: Simple, predictable navigation patterns with clear labels
- **Forms**: Large, clearly labeled form fields with helpful placeholder text
- **Buttons**: Descriptive button text ("Create New RFI" not just "Create")
- **Feedback**: Clear success/error messages in plain language
- **Loading States**: Always show loading indicators for any action taking more than 1 second
- **Confirmations**: Ask for confirmation on destructive actions with clear consequences

## TypeScript Standards

### Strict Type Safety
```typescript
// Always use strict TypeScript - NO any types
interface RFI {
  id: string;
  rfi_number: string;
  subject: string;
  status: 'draft' | 'sent' | 'responded' | 'overdue';
  // ... all fields properly typed
}

// Use proper type assertions
const rfi = data as RFI; // Only when you're certain
// Prefer type guards
function isRFI(obj: any): obj is RFI {
  return obj && typeof obj.id === 'string' && typeof obj.rfi_number === 'string';
}
```

### Required Interfaces
- Always define interfaces for API responses, request bodies, and component props
- Use discriminated unions for status types and enums
- Never use `any` - use `unknown` if type is uncertain, then narrow with type guards

## React Component Standards

### Component Structure
```typescript
// Required component pattern
interface ComponentNameProps {
  // Always define props interface
  requiredProp: string;
  optionalProp?: number;
  children?: React.ReactNode;
}

export default function ComponentName({ requiredProp, optionalProp, children }: ComponentNameProps) {
  // Hooks at the top
  const [state, setState] = useState<string>('');
  
  // Event handlers
  const handleSubmit = useCallback(() => {
    // Implementation
  }, []);
  
  // Early returns for loading/error states
  if (isLoading) return <LoadingSpinner />;
  if (error) return <Alert type="error" message={error.message} />;
  
  // Main render
  return (
    <div className="container">
      {/* Component content */}
    </div>
  );
}
```

### Performance Requirements
- Use `React.memo` for components that render lists or expensive calculations
- Use `useCallback` for event handlers passed to child components
- Use `useMemo` for expensive calculations
- Implement proper loading states for all async operations

## Form Handling Standards

### React Hook Form + Zod Pattern
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const rfiSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(500, 'Subject too long'),
  reason_for_rfi: z.string().min(1, 'Reason is required'),
  urgency: z.enum(['urgent', 'non-urgent']),
});

type RFIFormData = z.infer<typeof rfiSchema>;

// Use this pattern for all forms
const form = useForm<RFIFormData>({
  resolver: zodResolver(rfiSchema),
  defaultValues: {
    subject: '',
    reason_for_rfi: '',
    urgency: 'non-urgent',
  },
});
```

### Form Validation Rules
- Always validate on both client and server side
- Show field-level errors immediately on blur
- Show form-level errors on submit attempt
- Disable submit button while form is submitting
- Provide clear, specific error messages in plain language

## UI Component Standards

### Tailwind CSS Guidelines
```typescript
// Use semantic class groupings
<button className="
  px-4 py-2 
  bg-blue-600 hover:bg-blue-700 
  text-white font-medium 
  rounded-md shadow-sm
  transition-colors duration-200
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Submit RFI
</button>

// Group classes logically: layout, colors, typography, effects
// Always include hover and disabled states
// Use consistent spacing scale (px-4, py-2, etc.)
```

### Required UI States
Every interactive component must handle:
- **Default state**: Normal appearance
- **Hover state**: Visual feedback on mouse over
- **Active state**: Visual feedback on click/press
- **Disabled state**: Clearly indicate when not interactive
- **Loading state**: Show when async operation in progress
- **Error state**: Show when something goes wrong

## API Integration Standards

### Error Handling Pattern
```typescript
// Required error handling for all API calls
async function createRFI(data: RFIFormData) {
  try {
    setIsLoading(true);
    setError(null);
    
    const response = await fetch('/api/rfis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create RFI');
    }
    
    const result = await response.json();
    setSuccess('RFI created successfully');
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    setError(message);
    throw err;
  } finally {
    setIsLoading(false);
  }
}
```

### API Response Standards
- Always return consistent response format: `{ success: boolean, data?: any, error?: string }`
- Include proper HTTP status codes
- Provide user-friendly error messages
- Log errors server-side but don't expose sensitive information

## File Upload Standards

### File Handling Requirements
```typescript
// Required file upload validation
const validateFile = (file: File): string | null => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  
  if (file.size > maxSize) {
    return 'File size must be less than 10MB';
  }
  
  if (!allowedTypes.includes(file.type)) {
    return 'Only PDF, JPEG, and PNG files are allowed';
  }
  
  return null;
};

// Always show upload progress
const [uploadProgress, setUploadProgress] = useState(0);
```

### File Security Rules
- Validate file type using MIME type, not just extension
- Scan file content, don't trust client-side validation
- Store files in Supabase Storage with proper access controls
- Generate secure URLs for file access
- Log all file upload and access attempts

## Database Interaction Standards

### Supabase Best Practices
```typescript
// Always handle Supabase errors properly
const { data, error } = await supabase
  .from('rfis')
  .select('*')
  .eq('project_id', projectId);

if (error) {
  console.error('Database error:', error);
  throw new Error('Failed to fetch RFIs');
}

// Use proper type assertion
const rfis = data as RFI[];
```

### Query Optimization Rules
- Always use specific column selection, avoid `SELECT *` in production
- Implement proper pagination for large datasets (50 items per page)
- Use database indexes for frequently queried columns
- Cache frequently accessed data appropriately

## Security Standards

### Authentication Rules
- Never store passwords in plain text (even for single user MVP)
- Use secure session management with proper expiration
- Implement CSRF protection for state-changing operations
- Validate all user inputs server-side

### Data Protection
- Validate and sanitize all user inputs
- Use parameterized queries to prevent SQL injection
- Implement proper access controls for file downloads
- Log security events (failed logins, suspicious activity)

## Error Handling Standards

### User-Facing Error Messages
```typescript
// Use professional, helpful error messages
const errorMessages = {
  network: 'Connection problem. Please check your internet and try again.',
  validation: 'Please check the highlighted fields and correct any errors.',
  fileSize: 'File is too large. Maximum size is 10MB.',
  fileType: 'File type not supported. Please use PDF, JPEG, or PNG files.',
  serverError: 'Something went wrong on our end. Please try again in a few minutes.',
  notFound: 'The requested RFI could not be found.',
  expired: 'This link has expired. Please request a new one.',
};
```

### Error Boundary Implementation
- Wrap all major sections in error boundaries
- Provide fallback UI that allows user to continue working
- Log errors for debugging but don't expose stack traces to users

## Testing Requirements

### Required Test Coverage
- Unit tests for all utility functions and validation logic
- Component tests for critical UI components (forms, tables, file upload)
- Integration tests for complete user flows (create RFI, submit response)
- API tests for all endpoints with success and error scenarios

### Test Patterns
```typescript
// Required test structure
describe('RFIForm Component', () => {
  beforeEach(() => {
    // Setup clean state for each test
  });

  test('renders all required fields', () => {
    // Test basic rendering
  });

  test('validates form inputs correctly', () => {
    // Test validation logic
  });

  test('handles submission errors gracefully', () => {
    // Test error scenarios
  });
});
```

## Performance Standards

### Loading Time Requirements
- Initial page load: < 2 seconds
- Form submission: < 3 seconds with loading feedback
- Dashboard refresh: < 1 second
- File upload: Show progress, complete within 30 seconds for 10MB

### Optimization Rules
- Implement code splitting at route level using React.lazy
- Use proper image optimization for any images
- Minimize bundle size - only import what you use
- Use React.memo for expensive list renders

## Code Organization Standards

### File Naming Conventions
- React components: PascalCase (RFIForm.tsx, AttachmentUpload.tsx)
- Utility functions: camelCase (validateFile.ts, formatDate.ts)
- API routes: kebab-case (create-rfi.ts, send-notification.ts)
- Types and interfaces: PascalCase (RFI.ts, Project.ts)

### Import Organization
```typescript
// 1. React and Next.js imports
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party library imports
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// 3. Internal imports (absolute paths)
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { createRFI } from '@/lib/api';

// 4. Type imports
import type { RFI, Project } from '@/lib/types';
```

## Deployment Standards

### Environment Configuration
- Use environment variables for all configuration
- Never commit secrets or API keys
- Implement proper environment validation on startup
- Use different configurations for development and production

### Production Requirements
- Enable proper error logging and monitoring
- Implement health checks for critical services
- Use proper SSL/TLS configuration
- Set up automated backups for database

## Code Review Checklist

Before considering any code complete, verify:
- [ ] All TypeScript errors resolved (strict mode)
- [ ] All form inputs properly validated
- [ ] Loading states implemented for async operations
- [ ] Error handling covers all failure scenarios
- [ ] Components are properly typed with interfaces
- [ ] File uploads validated for size and type
- [ ] Database queries use proper error handling
- [ ] User-friendly error messages implemented
- [ ] Security validations in place
- [ ] Performance optimizations applied where needed
- [ ] Code follows established patterns consistently
- [ ] Tests written for critical functionality

## Professional Standards

### Code Quality
- Write self-documenting code with clear variable names
- Add comments for complex business logic only
- Keep functions small and focused (< 50 lines)
- Use descriptive names that explain intent

### User Experience
- Always provide feedback for user actions
- Use consistent terminology throughout the application
- Implement proper focus management for accessibility
- Test with realistic data and edge cases

Remember: This is a professional business application used by contractors managing important project communications. Prioritize reliability, clarity, and user confidence over fancy features or complex interactions.