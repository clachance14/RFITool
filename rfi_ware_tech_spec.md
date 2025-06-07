# Complete Technical Specification for RFI Ware

## 1. Project Overview

**Product Description**: A web-based tool for general contractors in industrial construction to create, send, manage, and track Requests for Information (RFIs) efficiently.

**Target Users**: Single general contractor user (MVP), with potential for multi-user support in future iterations.

**Key Business Objectives**:
- Streamline RFI creation and distribution process
- Improve response tracking and follow-up
- Maintain professional documentation standards
- Reduce manual email management overhead

**Success Metrics**:
- RFI creation time reduced to under 10 minutes
- 100% response tracking accuracy
- Zero lost attachments or responses
- Dashboard load time under 2 seconds

## 2. Technical Architecture

**Tech Stack**:
- Frontend: React 18+ with TypeScript 5+
- Backend: Node.js 18+ with Express 4+
- Database: Supabase PostgreSQL
- File Storage: Supabase Storage
- Styling: Tailwind CSS 3+
- Hosting: Vercel
- Development: Cursor AI + Claude AI

**Authentication Strategy**: Simple username/password login (hardcoded initially)
- Default credentials: username: `admin`, password: `rfiware2025`
- Session-based authentication with 8-hour timeout

**File Storage Approach**: 
- Supabase Storage buckets with public URLs
- 5 attachments max per RFI, 10MB per file
- Supported formats: PDF, JPEG, JPG, PNG

**Real-time Features**: 
- Polling-based notifications every 5 minutes
- Status updates on dashboard refresh

## 3. Complete Database Schema

```sql
-- Enable Row Level Security
ALTER DATABASE postgres SET timezone TO 'UTC';

-- Projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contract_number VARCHAR(100),
  client_company VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RFIs table
CREATE TABLE rfis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rfi_number VARCHAR(20) NOT NULL UNIQUE,
  revision INTEGER DEFAULT 0,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  contract_number VARCHAR(100),
  to_recipient VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  subject VARCHAR(500) NOT NULL,
  date_created DATE DEFAULT CURRENT_DATE,
  work_impact TEXT,
  cost_impact TEXT,
  schedule_impact TEXT,
  discipline VARCHAR(100),
  system VARCHAR(100),
  sub_system VARCHAR(100),
  schedule_id VARCHAR(100),
  reason_for_rfi TEXT NOT NULL,
  test_package VARCHAR(100),
  contractor_proposed_solution TEXT,
  associated_reference_documents TEXT,
  requested_by VARCHAR(255),
  reviewed_by VARCHAR(255),
  company_reviewer VARCHAR(255),
  client_response TEXT,
  client_response_submitted_by VARCHAR(255),
  client_cm_approval VARCHAR(255),
  
  -- System fields
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'responded', 'overdue')),
  urgency VARCHAR(20) DEFAULT 'non-urgent' CHECK (urgency IN ('urgent', 'non-urgent')),
  secure_link_token UUID DEFAULT gen_random_uuid() UNIQUE,
  link_expires_at TIMESTAMP WITH TIME ZONE,
  date_sent TIMESTAMP WITH TIME ZONE,
  date_responded TIMESTAMP WITH TIME ZONE,
  response_status VARCHAR(20) CHECK (response_status IN ('approved', 'rejected', 'needs_clarification')),
  additional_comments TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RFI Attachments table
CREATE TABLE rfi_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rfi_id UUID REFERENCES rfis(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rfi_id UUID REFERENCES rfis(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('response_received', 'overdue_reminder')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_rfis_status ON rfis(status);
CREATE INDEX idx_rfis_project_id ON rfis(project_id);
CREATE INDEX idx_rfis_date_sent ON rfis(date_sent);
CREATE INDEX idx_rfis_secure_token ON rfis(secure_link_token);
CREATE INDEX idx_notifications_unread ON notifications(is_read) WHERE is_read = FALSE;

-- Function to auto-generate RFI numbers
CREATE OR REPLACE FUNCTION generate_rfi_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rfi_number IS NULL OR NEW.rfi_number = '' THEN
    SELECT COALESCE(
      'RFI-' || LPAD((MAX(CAST(SUBSTRING(rfi_number FROM 5) AS INTEGER)) + 1)::TEXT, 3, '0'),
      'RFI-001'
    ) INTO NEW.rfi_number
    FROM rfis 
    WHERE rfi_number ~ '^RFI-[0-9]+$';
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-generating RFI numbers
CREATE TRIGGER trigger_generate_rfi_number
  BEFORE INSERT OR UPDATE ON rfis
  FOR EACH ROW
  EXECUTE FUNCTION generate_rfi_number();

-- Function to update RFI status based on dates
CREATE OR REPLACE FUNCTION update_rfi_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Set link expiration when sent
  IF NEW.status = 'sent' AND OLD.status != 'sent' THEN
    NEW.link_expires_at = NOW() + INTERVAL '30 days';
    NEW.date_sent = NOW();
  END IF;
  
  -- Update to responded when response is submitted
  IF NEW.client_response IS NOT NULL AND NEW.client_response != '' AND OLD.client_response IS NULL THEN
    NEW.status = 'responded';
    NEW.date_responded = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for status updates
CREATE TRIGGER trigger_update_rfi_status
  BEFORE UPDATE ON rfis
  FOR EACH ROW
  EXECUTE FUNCTION update_rfi_status();

-- Storage bucket setup (run after creating Supabase project)
-- CREATE BUCKET 'rfi-attachments' WITH public = true;

-- Row Level Security policies (initially disabled for single user)
-- ALTER TABLE rfis ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE rfi_attachments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

## 4. API Specification

### Authentication Endpoints
```typescript
POST /api/auth/login
Request: { username: string, password: string }
Response: { success: boolean, token?: string, message?: string }

POST /api/auth/logout
Response: { success: boolean }

GET /api/auth/verify
Headers: { Authorization: "Bearer <token>" }
Response: { valid: boolean, user?: object }
```

### Project Endpoints
```typescript
GET /api/projects
Response: { projects: Project[] }

POST /api/projects
Request: { name: string, contract_number?: string, client_company?: string }
Response: { project: Project }

PUT /api/projects/:id
Request: { name?: string, contract_number?: string, client_company?: string }
Response: { project: Project }

DELETE /api/projects/:id
Response: { success: boolean }
```

### RFI Endpoints
```typescript
GET /api/rfis
Query: { project_id?: string, status?: string, page?: number, limit?: number }
Response: { rfis: RFI[], total: number, page: number }

GET /api/rfis/:id
Response: { rfi: RFI, attachments: Attachment[] }

POST /api/rfis
Request: RFICreateRequest
Response: { rfi: RFI }

PUT /api/rfis/:id
Request: RFIUpdateRequest
Response: { rfi: RFI }

DELETE /api/rfis/:id
Response: { success: boolean }

POST /api/rfis/:id/send
Response: { rfi: RFI, secure_link: string }

GET /api/rfis/link/:token
Response: { rfi: RFI, attachments: Attachment[] }

POST /api/rfis/link/:token/respond
Request: { client_response: string, response_status: string, additional_comments?: string }
Response: { success: boolean }
```

### File Endpoints
```typescript
POST /api/rfis/:id/attachments
Request: FormData with files
Response: { attachments: Attachment[] }

DELETE /api/attachments/:id
Response: { success: boolean }

GET /api/attachments/:id/download
Response: File stream
```

### Notification Endpoints
```typescript
GET /api/notifications
Response: { notifications: Notification[] }

PUT /api/notifications/:id/read
Response: { success: boolean }

PUT /api/notifications/read-all
Response: { success: boolean }
```

## 5. React Component Architecture

```
src/
├── app/
│   ├── layout.tsx                 # Root layout with navigation
│   ├── page.tsx                   # Dashboard (home page)
│   ├── login/
│   │   └── page.tsx              # Login page
│   ├── rfis/
│   │   ├── page.tsx              # RFI list/dashboard
│   │   ├── create/
│   │   │   └── page.tsx          # Create new RFI
│   │   ├── [id]/
│   │   │   ├── page.tsx          # View/edit RFI
│   │   │   └── edit/
│   │   │       └── page.tsx      # Edit RFI form
│   │   └── link/
│   │       └── [token]/
│   │           └── page.tsx      # Public RFI response form
│   ├── projects/
│   │   ├── page.tsx              # Project management
│   │   └── create/
│   │       └── page.tsx          # Create project
│   └── notifications/
│       └── page.tsx              # Notifications center
├── components/
│   ├── ui/
│   │   ├── Button.tsx            # Reusable button component
│   │   ├── Input.tsx             # Form input component
│   │   ├── Select.tsx            # Dropdown component
│   │   ├── TextArea.tsx          # Text area component
│   │   ├── Badge.tsx             # Status badges
│   │   ├── Table.tsx             # Data table component
│   │   ├── Modal.tsx             # Modal dialog
│   │   ├── LoadingSpinner.tsx    # Loading indicator
│   │   └── Alert.tsx             # Alert/notification component
│   ├── layout/
│   │   ├── Navigation.tsx        # Main navigation bar
│   │   ├── Header.tsx            # Page header component
│   │   └── Footer.tsx            # Footer component
│   ├── rfi/
│   │   ├── RFIForm.tsx           # Main RFI creation/edit form
│   │   ├── RFITable.tsx          # Dashboard RFI table
│   │   ├── RFICard.tsx           # RFI summary card
│   │   ├── RFIStatusBadge.tsx    # Status indicator
│   │   ├── AttachmentUpload.tsx  # File upload component
│   │   ├── AttachmentViewer.tsx  # Inline file viewer
│   │   └── ResponseForm.tsx      # Recipient response form
│   ├── project/
│   │   ├── ProjectSelect.tsx     # Project dropdown
│   │   ├── ProjectForm.tsx       # Create/edit project
│   │   └── ProjectCard.tsx       # Project summary
│   └── notifications/
│       ├── NotificationBell.tsx  # Header notification icon
│       ├── NotificationList.tsx  # Notification list
│       └── NotificationItem.tsx  # Individual notification
├── lib/
│   ├── supabase.ts              # Supabase client configuration
│   ├── auth.ts                  # Authentication utilities
│   ├── api.ts                   # API client functions
│   ├── utils.ts                 # General utility functions
│   ├── validations.ts           # Form validation schemas
│   ├── constants.ts             # App constants
│   └── types.ts                 # TypeScript type definitions
├── hooks/
│   ├── useAuth.ts               # Authentication hook
│   ├── useRFIs.ts               # RFI data management
│   ├── useProjects.ts           # Project data management
│   ├── useNotifications.ts      # Notification management
│   ├── useFileUpload.ts         # File upload handling
│   └── useLocalStorage.ts       # Local storage utilities
└── styles/
    └── globals.css              # Global styles and Tailwind imports
```

## 6. Environment Configuration

```bash
# .env.local template
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Authentication
JWT_SECRET=your_jwt_secret_key_here
SESSION_TIMEOUT=28800  # 8 hours in seconds

# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB in bytes
MAX_FILES_PER_RFI=5
ALLOWED_FILE_TYPES=application/pdf,image/jpeg,image/jpg,image/png

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NOTIFICATION_POLL_INTERVAL=300000  # 5 minutes in milliseconds

# Default Authentication (MVP)
DEFAULT_USERNAME=admin
DEFAULT_PASSWORD=rfiware2025

# Storage Configuration
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=rfi-attachments
```

## 7. Cursor Rules File (.cursorrules)

```
# RFI Ware Development Standards

## TypeScript Requirements
- Use TypeScript strict mode with no any types
- Define interfaces for all API responses and request bodies
- Use proper typing for React components with Props interfaces
- Implement proper error boundaries with typed error handling

## React Patterns
- Use functional components with hooks exclusively
- Implement proper loading and error states for all async operations
- Use React.memo for performance optimization on list components
- Follow the component composition pattern for reusability

## Code Organization
- Keep components under 200 lines; extract smaller components if larger
- Use custom hooks for data fetching and state management
- Implement proper separation of concerns (UI, business logic, API calls)
- Use absolute imports with proper path mapping

## Error Handling Standards
- Wrap all API calls in try-catch blocks
- Provide user-friendly error messages for all failure scenarios
- Implement proper error boundaries for React components
- Log errors appropriately without exposing sensitive information

## Security Rules
- Never expose sensitive environment variables to client-side
- Validate all user inputs on both client and server side
- Implement proper authentication checks for protected routes
- Sanitize file uploads and validate file types/sizes

## Performance Guidelines
- Implement proper loading states and skeleton screens
- Use React.lazy for code splitting on route level
- Optimize images and implement proper caching strategies
- Minimize API calls with proper caching and state management

## File Naming Conventions
- Use PascalCase for React components (Button.tsx, RFIForm.tsx)
- Use camelCase for utilities and hooks (useAuth.ts, apiClient.ts)
- Use kebab-case for pages and API routes (create-rfi, auth/login)
- Use descriptive names that clearly indicate component purpose

## Testing Standards
- Write unit tests for all utility functions
- Implement integration tests for critical user flows
- Test error scenarios and edge cases
- Maintain test coverage above 80% for business logic

## Database Interaction
- Use Supabase client with proper error handling
- Implement proper data validation before database operations
- Use transactions for operations that modify multiple tables
- Handle database connection errors gracefully

## Form Handling
- Use controlled components for all form inputs
- Implement proper form validation with user feedback
- Handle file uploads with progress indicators
- Provide clear success/error feedback for form submissions

## State Management
- Use useState for component-level state
- Implement custom hooks for shared state logic
- Use proper dependency arrays in useEffect hooks
- Avoid prop drilling; use context for deeply nested state
```

## 8. Testing Strategy

### Testing Framework Setup
```json
// package.json dev dependencies
{
  "jest": "^29.7.0",
  "@testing-library/react": "^13.4.0",
  "@testing-library/jest-dom": "^5.16.5",
  "@testing-library/user-event": "^14.4.3",
  "jest-environment-jsdom": "^29.7.0"
}
```

### Component Testing Patterns
```typescript
// Example test structure
describe('RFIForm Component', () => {
  beforeEach(() => {
    // Setup test data and mocks
  });

  test('renders all required fields', () => {
    // Test component rendering
  });

  test('validates form inputs correctly', () => {
    // Test form validation
  });

  test('handles file upload', () => {
    // Test file upload functionality
  });

  test('submits form with correct data', () => {
    // Test form submission
  });
});
```

### API Testing Approach
- Use MSW (Mock Service Worker) for API mocking
- Test all CRUD operations for RFIs and Projects
- Verify proper error handling for network failures
- Test authentication flows and protected routes

### Mock Strategies
```typescript
// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}));

// Mock file upload
const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
```

## 9. Detailed Development Checklist

### Phase 1: Foundation Setup
**Project Initialization:**
- [ ] Run `npx create-next-app@latest rfi-ware --typescript --tailwind --eslint --app`
- [ ] Install dependencies: `@supabase/supabase-js`, `lucide-react`, `react-hook-form`, `@hookform/resolvers`, `zod`, `date-fns`
- [ ] Install dev dependencies: testing libraries and jest
- [ ] Create folder structure as outlined in Section 5
- [ ] Configure TypeScript with strict mode
- [ ] Set up ESLint and Prettier configuration

**Supabase Configuration:**
- [ ] Create new Supabase project
- [ ] Copy project URL and anon key to environment variables
- [ ] Create `.env.local` file with all environment variables from Section 6
- [ ] Run complete database schema from Section 3 in Supabase SQL editor
- [ ] Create storage bucket named `rfi-attachments` with public access
- [ ] Test database connection with a simple query
- [ ] Create `src/lib/supabase.ts` with Supabase client configuration

**Basic Authentication:**
- [ ] Create `src/lib/auth.ts` with authentication utilities
- [ ] Build `src/app/login/page.tsx` with simple username/password form
- [ ] Implement session management with JWT tokens
- [ ] Create `src/hooks/useAuth.ts` for authentication state management
- [ ] Add authentication middleware for protected routes
- [ ] Create logout functionality
- [ ] Test login/logout flow completely

**Core UI Components:**
- [ ] Create `src/components/ui/Button.tsx` with variants (primary, secondary, danger)
- [ ] Create `src/components/ui/Input.tsx` with validation states
- [ ] Create `src/components/ui/Select.tsx` with proper keyboard navigation
- [ ] Create `src/components/ui/TextArea.tsx` with character count
- [ ] Create `src/components/ui/Badge.tsx` for status indicators
- [ ] Create `src/components/ui/LoadingSpinner.tsx`
- [ ] Create `src/components/ui/Alert.tsx` for error/success messages
- [ ] Create `src/components/ui/Modal.tsx` for confirmations

**Navigation & Layout:**
- [ ] Create `src/app/layout.tsx` with main application layout
- [ ] Build `src/components/layout/Navigation.tsx` with menu items
- [ ] Create `src/components/layout/Header.tsx` with user info and notifications
- [ ] Implement responsive navigation for different screen sizes
- [ ] Add active state indicators for navigation items
- [ ] Create logout button in navigation
- [ ] Test navigation between all planned pages

### Phase 2: Core RFI Functionality
**Project Management:**
- [ ] Create `src/lib/types.ts` with Project and RFI interfaces
- [ ] Build `src/app/projects/page.tsx` for project listing
- [ ] Create `src/app/projects/create/page.tsx` for new projects
- [ ] Implement `src/components/project/ProjectForm.tsx`
- [ ] Create `src/components/project/ProjectSelect.tsx` dropdown
- [ ] Build `src/hooks/useProjects.ts` for project data management
- [ ] Create API routes: `/api/projects` (GET, POST, PUT, DELETE)
- [ ] Test complete project CRUD operations
- [ ] Add project validation with Zod schemas

**RFI Data Models & API:**
- [ ] Define complete RFI TypeScript interfaces in `src/lib/types.ts`
- [ ] Create `src/lib/validations.ts` with Zod schemas for RFI validation
- [ ] Build `/api/rfis` route with GET (list), POST (create)
- [ ] Build `/api/rfis/[id]` route with GET (single), PUT (update), DELETE
- [ ] Implement RFI auto-numbering logic in database trigger
- [ ] Create `src/hooks/useRFIs.ts` for RFI data management
- [ ] Test all CRUD operations with Postman or API client
- [ ] Implement proper error handling for all API routes

**RFI Creation Form:**
- [ ] Create `src/app/rfis/create/page.tsx` for new RFI creation
- [ ] Build comprehensive `src/components/rfi/RFIForm.tsx` with all fields:
  - [ ] Basic info fields (Subject, To, Company, etc.)
  - [ ] Impact fields (Work, Cost, Schedule)
  - [ ] Technical fields (Discipline, System, Sub-System)
  - [ ] Description fields (Reason, Proposed Solution)
  - [ ] Reference fields (Requested By, Reviewed By)
- [ ] Implement form validation with react-hook-form and Zod
- [ ] Add save as draft functionality
- [ ] Create form field auto-save to prevent data loss
- [ ] Add form reset and confirmation dialogs
- [ ] Test form submission and validation thoroughly

**File Upload System:**
- [ ] Create `src/components/rfi/AttachmentUpload.tsx` component
- [ ] Implement drag-and-drop file upload interface
- [ ] Add file type validation (PDF, JPEG, JPG, PNG only)
- [ ] Implement file size validation (10MB max per file, 5 files max)
- [ ] Create `src/hooks/useFileUpload.ts` for upload logic
- [ ] Build `/api/rfis/[id]/attachments` route for file uploads
- [ ] Implement file upload progress indicators
- [ ] Add file preview thumbnails for uploaded files
- [ ] Create file deletion functionality
- [ ] Test file upload with various file types and sizes

### Phase 3: Dashboard & Management
**RFI Dashboard:**
- [ ] Create `src/app/rfis/page.tsx` (main dashboard)
- [ ] Build `src/components/rfi/RFITable.tsx` with sortable columns:
  - [ ] RFI Number (sortable, clickable)
  - [ ] Project Name (with project filter)
  - [ ] Status (with color-coded badges)
  - [ ] Subject (truncated with tooltip)
  - [ ] Date Sent (formatted, sortable)
  - [ ] Days Since Sent (calculated field)
  - [ ] Recipient (contact info)
  - [ ] Actions (View, Edit, Delete buttons)
- [ ] Create `src/components/rfi/RFIStatusBadge.tsx` with color coding
- [ ] Implement filtering by Status, Project, Date Range
- [ ] Add search functionality across RFI fields
- [ ] Create pagination for large RFI lists (50 items per page)
- [ ] Add bulk actions (mark as sent, delete multiple)
- [ ] Test dashboard performance with large datasets

**Status Management:**
- [ ] Implement RFI status transitions (Draft → Sent → Responded)
- [ ] Create status update API endpoints
- [ ] Add automatic status detection based on response submission
- [ ] Implement overdue detection (1 day urgent, 5 days non-urgent)
- [ ] Create automatic status indicators on dashboard
- [ ] Add status change confirmation dialogs
- [ ] Test all status transitions and edge cases

**Secure Link Generation:**
- [ ] Build `/api/rfis/[id]/send` endpoint for link generation
- [ ] Implement UUID-based secure tokens
- [ ] Add 30-day link expiration logic
- [ ] Create link copying functionality with clipboard API
- [ ] Build link expiration warnings and notifications
- [ ] Add link regeneration capability
- [ ] Test link security and expiration handling
- [ ] Create link validation middleware

### Phase 4: Recipient Interface
**Public RFI View:**
- [ ] Create `src/app/rfis/link/[token]/page.tsx` for public access
- [ ] Implement token validation and expiration checking
- [ ] Build read-only RFI display with all fields visible
- [ ] Create `src/components/rfi/AttachmentViewer.tsx` for inline file viewing
- [ ] Implement PDF viewer and image gallery for attachments
- [ ] Add responsive design for various screen sizes
- [ ] Create professional styling for client-facing interface
- [ ] Test public access without authentication

**Response Submission:**
- [ ] Create `src/components/rfi/ResponseForm.tsx` for recipient responses
- [ ] Build response fields:
  - [ ] Client's Response (rich text area)
  - [ ] Response Status dropdown (Approved/Rejected/Needs Clarification)
  - [ ] Additional Comments (optional text area)
- [ ] Implement `/api/rfis/link/[token]/respond` endpoint
- [ ] Add response validation and sanitization
- [ ] Create response submission confirmation
- [ ] Implement automatic status update when response submitted
- [ ] Add response timestamp and tracking
- [ ] Test complete response flow from link to submission

**File Attachment Handling:**
- [ ] Create secure file serving endpoints
- [ ] Implement inline PDF viewing with browser native viewer
- [ ] Add image gallery with zoom functionality
- [ ] Create file download functionality
- [ ] Add file access logging for security
- [ ] Implement proper MIME type handling
- [ ] Test file viewing across different browsers
- [ ] Add fallback for unsupported file types

### Phase 5: Notifications & Tracking
**Notification System:**
- [ ] Create `src/app/notifications/page.tsx` for notification center
- [ ] Build `src/components/notifications/NotificationList.tsx`
- [ ] Create `src/components/notifications/NotificationBell.tsx` for header
- [ ] Implement `/api/notifications` endpoints (GET, PUT for read status)
- [ ] Create notification polling system (every 5 minutes)
- [ ] Add notification types: response received, overdue reminder
- [ ] Implement `src/hooks/useNotifications.ts` for state management
- [ ] Create notification sound/visual indicators
- [ ] Add mark as read/unread functionality
- [ ] Test notification timing and reliability

**Overdue Detection:**
- [ ] Create database function for overdue RFI detection
- [ ] Implement automatic overdue status updates
- [ ] Add overdue highlighting on dashboard
- [ ] Create overdue reminder notifications
- [ ] Build overdue RFI reporting
- [ ] Add urgency-based overdue thresholds (1 day urgent, 5 days non-urgent)
- [ ] Test overdue detection accuracy
- [ ] Create manual overdue override functionality

**Data Retention & Cleanup:**
- [ ] Implement 1-year data retention policy
- [ ] Create deletion warning notifications (30 days before)
- [ ] Build data archival system
- [ ] Add manual data export functionality
- [ ] Create cleanup confirmation dialogs
- [ ] Implement soft delete for important records
- [ ] Test data retention workflows
- [ ] Add data recovery functionality for recent deletions

### Phase 6: Polish & Testing
**Error Handling:**
- [ ] Implement global error boundary in `src/app/layout.tsx`
- [ ] Create comprehensive error pages (404, 500, etc.)
- [ ] Add API error handling with user-friendly messages
- [ ] Implement form validation error displays
- [ ] Create network error detection and retry logic
- [ ] Add file upload error handling (size, type, network)
- [ ] Test all error scenarios systematically
- [ ] Create error logging and monitoring

**Performance Optimization:**
- [ ] Implement React.memo for expensive list components
- [ ] Add code splitting for routes with React.lazy
- [ ] Optimize database queries with proper indexing
- [ ] Implement image optimization for attachments
- [ ] Add caching for frequently accessed data
- [ ] Create loading skeletons for all async operations
- [ ] Test page load times and optimize bottlenecks
- [ ] Implement proper pagination to handle large datasets

**Testing Suite:**
- [ ] Create unit tests for all utility functions in `src/lib/`
- [ ] Build component tests for all UI components
- [ ] Implement integration tests for critical user flows
- [ ] Create API endpoint tests with mock data
- [ ] Test file upload/download functionality
- [ ] Add form validation testing
- [ ] Create authentication flow tests
- [ ] Test error scenarios and edge cases
- [ ] Achieve 80%+ test coverage for business logic

**UI/UX Polish:**
- [ ] Implement consistent spacing and typography
- [ ] Add hover effects and micro-interactions
- [ ] Create loading states for all async operations
- [ ] Add confirmation dialogs for destructive actions
- [ ] Implement proper focus management for accessibility
- [ ] Add keyboard shortcuts for power users
- [ ] Create tooltip help text for complex fields
- [ ] Test UI across different screen sizes and browsers

### Phase 7: Deployment & Production
**Vercel Deployment:**
- [ ] Install Vercel CLI and configure project
- [ ] Set up production environment variables in Vercel dashboard
- [ ] Configure build and deployment settings
- [ ] Test production build locally with `npm run build`
- [ ] Deploy to Vercel and test live application
- [ ] Set up custom domain if required
- [ ] Configure SSL and security headers
- [ ] Test production performance and functionality

**Production Testing:**
- [ ] Test complete RFI creation and submission flow
- [ ] Verify file upload and viewing in production
- [ ] Test secure link generation and access
- [ ] Confirm notification system works in production
- [ ] Test dashboard performance with real data
- [ ] Verify authentication and security measures
- [ ] Test error handling in production environment
- [ ] Confirm backup and data retention policies

**Documentation & Handoff:**
- [ ] Create user guide for RFI creation and management
- [ ] Document administrative functions and maintenance
- [ ] Create troubleshooting guide for common issues
- [ ] Document API endpoints for future development
- [ ] Create deployment and environment setup guide
- [ ] Document database schema and relationships
- [ ] Create security and backup procedures
- [ ] Prepare training materials if needed

## 10. Implementation Guidelines for Cursor AI

### Project Setup Commands
```bash
# Initialize Next.js project
npx create-next-app@latest rfi-ware --typescript --tailwind --eslint --app

# Navigate to project directory
cd rfi-ware

# Install additional dependencies
npm install @supabase/supabase-js
npm install @types/node @types/react @types/react-dom
npm install lucide-react  # For icons
npm install react-hook-form @hookform/resolvers zod  # For forms
npm install date-fns  # For date handling

# Install development dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev jest jest-environment-jsdom

# Create initial directory structure
mkdir -p src/components/ui src/components/layout src/components/rfi src/components/project src/components/notifications
mkdir -p src/lib src/hooks src/styles
mkdir -p __tests__/components __tests__/lib __tests__/hooks
```

### Code Quality Standards
- Implement TypeScript strict mode from project start
- Use ESLint and Prettier for consistent code formatting
- Follow React best practices with proper component lifecycle
- Implement proper error boundaries for production stability

### Testing Requirements
- Maintain 80%+ test coverage for business logic
- Write integration tests for critical user flows
- Mock external dependencies (Supabase, file system)
- Test both success and error scenarios

## 11. Deployment Configuration

### Vercel Deployment Setup
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel

# Configure environment variables in Vercel dashboard:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - JWT_SECRET
```

### Supabase Configuration
1. Create new Supabase project
2. Run database schema from Section 3
3. Create storage bucket: `rfi-attachments`
4. Configure storage policies for public access
5. Set up environment variables

### Domain and SSL
- Configure custom domain in Vercel dashboard
- SSL automatically handled by Vercel
- Set up proper redirects for www and non-www versions

## 12. Security Implementation

### Authentication Security
- Use bcrypt for password hashing (future multi-user)
- Implement JWT tokens with proper expiration
- Session timeout after 8 hours of inactivity
- Secure cookie configuration

### Data Validation
```typescript
// Example validation schema with Zod
const RFISchema = z.object({
  subject: z.string().min(1, "Subject is required").max(500),
  reason_for_rfi: z.string().min(1, "Reason is required"),
  to_recipient: z.string().min(1, "Recipient is required"),
  urgency: z.enum(["urgent", "non-urgent"]),
  // ... other fields
});
```

### File Upload Security
- Validate file types using MIME type checking
- Scan uploaded files for malicious content
- Implement proper file size limits
- Use secure file storage with access controls

### API Security
- Implement rate limiting on API endpoints
- Validate all input parameters
- Use parameterized queries to prevent SQL injection
- Implement proper CORS configuration

## 13. Performance Requirements

### Page Load Targets
- Initial page load: < 2 seconds
- Dashboard refresh: < 1 second
- File upload: Progress indication with < 30 seconds for 10MB
- Form submission: < 3 seconds with loading feedback

### Database Optimization
- Implement proper indexing on frequently queried fields
- Use pagination for large data sets (50 items per page)
- Optimize query performance with proper JOINs
- Cache frequently accessed data

### Frontend Performance
- Implement code splitting at route level
- Use React.memo for expensive list components
- Lazy load images and large components
- Minimize bundle size with tree shaking

## 14. Error Handling & Monitoring

### Error Boundary Implementation
```typescript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### User-Friendly Error Messages
- Network errors: "Connection problem. Please check your internet."
- File upload errors: "File too large. Maximum size is 10MB."
- Form validation: Specific field-level error messages
- Database errors: "Something went wrong. Please try again."

### Logging and Monitoring
- Use console.error for client-side error logging
- Implement structured logging for server-side errors
- Monitor file upload success/failure rates
- Track RFI completion and response times

## 15. Future Scalability Considerations

### Database Scaling
- Implement database connection pooling
- Consider read replicas for heavy reporting
- Plan for data archiving strategy
- Implement proper backup and recovery procedures

### Component Architecture for Growth
- Design components for reusability across features
- Implement proper state management for complex flows
- Plan for internationalization support
- Design API versioning strategy

### Feature Flag Implementation
```typescript
// Feature flag system for gradual rollouts
const FeatureFlags = {
  EMAIL_NOTIFICATIONS: false,
  MULTI_USER_SUPPORT: false,
  ADVANCED_REPORTING: false,
  API_V2: false,
};

export const useFeatureFlag = (flag: keyof typeof FeatureFlags) => {
  return FeatureFlags[flag];
};
```

### Multi-User Preparation
- Design database schema to support multiple users
- Plan role-based access control (RBAC)
- Implement proper data isolation between users
- Design invitation and user management flows

---

## Quick Start Checklist for Cursor AI

1. **Setup Phase:**
   - [ ] Run project setup commands
   - [ ] Create Supabase project and configure environment
   - [ ] Run database schema setup
   - [ ] Configure storage bucket

2. **Core Implementation:**
   - [ ] Build authentication system
   - [ ] Create RFI form components
   - [ ] Implement file upload functionality
   - [ ] Build dashboard with table view

3. **Integration Phase:**
   - [ ] Connect all API endpoints
   - [ ] Implement notification system
   - [ ] Add comprehensive error handling
   - [ ] Complete testing suite

4. **Deployment:**
   - [ ] Configure Vercel deployment
   - [ ] Set up environment variables
   - [ ] Test production deployment
   - [ ] Verify all features work end-to-end

This specification provides everything needed to build RFI Ware from start to finish, with clear implementation guidelines and comprehensive technical details for Cursor AI to follow.