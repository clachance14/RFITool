# RFITrak Application Flow & Architecture Reference

## Purpose
This document serves as a comprehensive technical reference for understanding the complete RFITrak application architecture, user flows, and implementation details. It is designed specifically for AI coding assistance to make informed development decisions.

## Table of Contents
1. [Application Overview](#application-overview)
2. [Architecture Stack](#architecture-stack)
3. [User Role System](#user-role-system)
4. [Authentication & Authorization Flow](#authentication--authorization-flow)
5. [Application Entry Points](#application-entry-points)
6. [Core User Journeys](#core-user-journeys)
7. [Component Architecture](#component-architecture)
8. [Data Flow Architecture](#data-flow-architecture)
9. [API Architecture](#api-architecture)
10. [Database Design](#database-design)
11. [Security Implementation](#security-implementation)
12. [Client Workflow System](#client-workflow-system)
13. [Notification System](#notification-system)
14. [Cost Tracking System](#cost-tracking-system)
15. [File Structure Reference](#file-structure-reference)

---

## Application Overview

**RFITrak** is a multi-tenant SaaS application for managing RFIs (Requests for Information) in the construction industry. It enables general contractors to create, manage, and collaborate on RFIs with clients through secure workflows.

### Core Features
- **Multi-tenant Architecture**: Company-based data isolation
- **Role-based Access Control**: 6-tier permission system
- **RFI Lifecycle Management**: Draft → Active → Closed workflow
- **Client Collaboration**: Secure external client access
- **Project Management**: Project-centric organization
- **Document Management**: File attachments and templates
- **Real-time Notifications**: Comprehensive notification system with email integration
- **Cost Tracking**: Timesheet-based cost tracking with automatic calculations
- **Reporting & Analytics**: Data export and reporting

### Target Users
- **Internal Users**: Contractors, project managers, admins
- **External Users**: Clients, stakeholders, collaborators

---

## Architecture Stack

```
Frontend: Next.js 14 (App Router)
├── React 18 (Server Components + Client Components)
├── TypeScript
├── Tailwind CSS
├── Lucide Icons
├── React Hot Toast
└── Real-time Notification System

Backend: Supabase
├── PostgreSQL Database
├── Authentication (Supabase Auth)
├── Row Level Security (RLS)
├── Real-time subscriptions
├── Storage (file uploads)
├── Notification System (notifications table)
└── Cost Tracking System (timesheet tables)

New Systems:
├── Notification Service (NotificationService)
├── Timesheet Tracking (RFI Timesheet Entries)
├── Email Integration (Mock/Real email services)
└── Cost Calculation Engine

Deployment: [Not specified in codebase]
```

---

## User Role System

### Role Hierarchy (6-Tier System)

```
Role ID | Role Name           | Access Level        | Primary Use Case
--------|--------------------|--------------------|------------------
   0    | app_owner          | System-wide        | Platform admin
   1    | super_admin        | Company-wide       | Company owner
   2    | admin              | Project-scoped     | Project manager
   3    | rfi_user           | Standard user      | RFI creator/editor
   4    | view_only          | Read-only          | Stakeholder viewer
   5    | client_collaborator| External client    | Client responses
```

### Permission Matrix

```
Permission               | App Owner | Super Admin | Admin | RFI User | View Only | Client
------------------------|-----------|-------------|-------|----------|-----------|--------
create_rfi              |    ✅     |     ✅      |   ✅   |    ✅    |    ❌     |   ❌
edit_rfi                |    ✅     |     ✅      |   ✅   |    ✅    |    ❌     |   ❌
create_project          |    ✅     |     ✅      |   ✅   |    ❌    |    ❌     |   ❌
edit_project            |    ✅     |     ✅      |   ✅   |    ❌    |    ❌     |   ❌
access_admin            |    ✅     |     ✅      |   ✅   |    ❌    |    ❌     |   ❌
view_rfis               |    ✅     |     ✅      |   ✅   |    ✅    |    ✅     |   ✅
view_projects           |    ✅     |     ✅      |   ✅   |    ✅    |    ✅     |   ✅
view_reports            |    ✅     |     ✅      |   ✅   |    ✅    |    ✅     |   ✅
generate_client_link    |    ✅     |     ✅      |   ✅   |    ✅    |    ❌     |   ❌
print_rfi               |    ✅     |     ✅      |   ✅   |    ✅    |    ❌     |   ❌
submit_rfi              |    ✅     |     ✅      |   ✅   |    ✅    |    ❌     |   ❌
respond_to_rfi          |    ✅     |     ✅      |   ✅   |    ✅    |    ❌     |   ✅
close_rfi               |    ✅     |     ✅      |   ✅   |    ✅    |    ❌     |   ❌
delete_rfi              |    ✅     |     ✅      |   ✅   |    ❌    |    ❌     |   ❌
export_data             |    ✅     |     ✅      |   ✅   |    ❌    |    ❌     |   ✅
create_user             |    ✅     |     ✅      |   ✅   |    ❌    |    ❌     |   ❌
edit_user_roles         |    ✅     |     ❌      |   ❌   |    ❌    |    ❌     |   ❌
delete_user             |    ✅     |     ❌      |   ❌   |    ❌    |    ❌     |   ❌
```

**Implementation Location**: `src/hooks/useUserRole.ts` - `hasPermission()` function

---

## Authentication & Authorization Flow

### Authentication Process

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Access   │ -> │  AuthGuard      │ -> │ LayoutWrapper   │
│   Application   │    │  Component      │    │ Component       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         v                       v                       v
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Check Auth      │    │ Route           │    │ Role-based      │
│ Status          │    │ Protection      │    │ Layout          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Route Protection Logic

**File**: `src/components/AuthGuard.tsx`

```typescript
// Public Routes (no auth required)
const publicRoutes = ['/login', '/auth/callback', '/client/logged-out']

// Client Routes (separate auth logic)
const clientRoutes = ['/client/', '/rfi/']

// Protected Routes (require authentication)
// All other routes require authentication
```

### User Session Management

```
1. User visits application
   ↓
2. AuthGuard checks authentication status
   ↓
3. If not authenticated → Redirect to /login
   ↓
4. If authenticated → Check user role
   ↓
5. Apply role-based routing and UI rendering
```

**Implementation Files**:
- `src/contexts/AuthContext.tsx` - Authentication state management
- `src/components/AuthGuard.tsx` - Route protection
- `src/hooks/useUserRole.ts` - Role management and permissions

---

## Application Entry Points

### Root Layout Structure

**File**: `src/app/layout.tsx`

```
RootLayout
├── AuthProvider (Authentication Context)
│   └── AuthGuard (Route Protection)
│       └── RFIProvider (RFI Data Context)
│           └── LayoutWrapper (Role-based Layout)
│               └── [Page Content]
│               └── Toaster (Notifications)
```

### Layout Wrapper Logic

**File**: `src/components/LayoutWrapper.tsx`

```typescript
// Layout decision tree:
if (!user || loading) return children; // No layout for unauthenticated

if (role === 'client_collaborator') {
  // Client Layout: Simplified navigation
  return <ClientLayout />;
}

// Standard Layout: Full navigation
return <StandardLayout />;
```

---

## Core User Journeys

### 1. Internal User Journey (Admin/RFI User)

```
Login (/login)
    ↓
Dashboard (/)
    ↓
┌─────────────────┬─────────────────┬─────────────────┐
│   Projects      │    RFI Log      │     Admin       │
│   (/projects)   │  (/rfi-log)     │   (/admin)      │
└─────────────────┴─────────────────┴─────────────────┘
    ↓                    ↓                    ↓
Create/Edit         Create/Edit RFI      User Management
Project             (/rfis/create)       Role Management
    ↓                    ↓                    ↓
RFI Management      RFI Detail           System Settings
                    (/rfis/[id])
    ↓                    ↓
Generate Client     Workflow Actions:
Link                - Submit RFI
                    - Generate Link
                    - Print RFI
                    - Close RFI
```

### 2. Client User Journey (External)

```
Secure Link Access (/client/[token])
    ↓
Client Authentication
    ↓
RFI Log (client view) (/rfi-log)
    ↓
RFI Detail (client view) (/rfis/[id])
    ↓
┌─────────────────┬─────────────────┐
│   View RFI      │   Respond to    │
│   Details       │   RFI           │
└─────────────────┴─────────────────┘
    ↓                    ↓
Export Reports      Submit Response
(/reports)              ↓
    ↓              Response Recorded
Logout                  ↓
(/client/logged-out)   Email Notification
```

### 3. Admin Management Journey

```
Admin Panel (/admin)
    ↓
┌─────────────────┬─────────────────┬─────────────────┐
│ User Management │ Role Preview    │ System Settings │
└─────────────────┴─────────────────┴─────────────────┘
    ↓                    ↓                    ↓
Create/Edit Users   Preview Role        Configure System
Assign Roles        Permissions         Export Data
Invite Users        Test Access         Manage Templates
Delete Users        levels
```

**Key Navigation Files**:
- `src/components/layout/Navigation.tsx` - Main navigation logic
- `src/components/layout/Header.tsx` - Header with user info
- `src/components/layout/ClientLayout.tsx` - Client-specific layout

---

## Component Architecture

### Component Hierarchy

```
App Root
├── Layout Components
│   ├── LayoutWrapper (Role-based layout selection)
│   ├── Navigation (Main navigation sidebar)
│   ├── Header (Top bar with user info)
│   └── ClientLayout (Simplified client layout)
│
├── Page Components
│   ├── HomePage (Dashboard)
│   ├── AdminPage (Admin panel)
│   ├── RFIListPage (RFI log)
│   ├── RFIDetailPage (Individual RFI)
│   ├── ProjectsPage (Project management)
│   └── ReportsPage (Analytics and exports)
│
├── Feature Components
│   ├── RFI Components
│   │   ├── RFIWorkflowView (Internal RFI view)
│   │   ├── RFIFormalView (Client RFI view)
│   │   ├── RFILog (RFI listing)
│   │   └── RFIStatusDisplay (Status indicators)
│   │
│   ├── Admin Components
│   │   ├── RolePreviewSection (Role permission preview)
│   │   ├── ClientAssignmentsTable (Client-project assignments)
│   │   ├── ProjectAssignmentSection (Project assignment management)
│   │   └── CreateReadOnlyUser (User creation)
│   │
│   └── Project Components
│       └── AdminProjectSection (Project management)
│
├── UI Components
│   ├── PermissionGate (Conditional rendering based on permissions)
│   ├── PermissionButton (Permission-aware buttons)
│   └── AuthGuard (Route protection)
│
└── Context Providers
    ├── AuthProvider (Authentication state)
    └── RFIProvider (RFI data state)
```

### Permission-Based Component Rendering

**Key Pattern**: Components use `PermissionGate` and `PermissionButton` for conditional rendering

```typescript
// Example from Navigation.tsx
<PermissionGate permission="access_admin">
  <AdminNavItem />
</PermissionGate>

// Example from RFI components
<PermissionButton 
  permission="edit_rfi"
  onClick={handleEdit}
>
  Edit RFI
</PermissionButton>
```

**Implementation Files**:
- `src/components/PermissionGate.tsx` - Permission-based conditional rendering
- `src/hooks/useUserRole.ts` - Permission checking logic

---

## Data Flow Architecture

### State Management Pattern

```
Database (Supabase)
    ↓
Supabase Client
    ↓
Custom Hooks (useRFIs, useProjects, useUserRole)
    ↓
Context Providers (AuthProvider, RFIProvider)
    ↓
Components (consume via hooks)
```

### Key Data Hooks

**File Locations and Purposes**:

1. **`src/hooks/useUserRole.ts`**
   - Manages user role and permissions
   - Provides `hasPermission()` function
   - Caches role data per session

2. **`src/hooks/useRFIs.ts`**
   - RFI CRUD operations
   - RFI status management
   - Client link generation

3. **`src/hooks/useProjects.ts`**
   - Project management
   - Project-user assignments
   - Company-scoped project access

4. **`src/hooks/useProjectAssignments.ts`**
   - Client-project assignment management
   - User-project relationship handling

### Data Flow Example: RFI Creation

```
1. User clicks "Create RFI" (permission checked)
   ↓
2. Navigate to /rfis/create
   ↓
3. AuthGuard validates route access
   ↓
4. useUserRole checks create_rfi permission
   ↓
5. Form component renders (if permitted)
   ↓
6. User submits form
   ↓
7. useRFIs.createRFI() called
   ↓
8. API call to /api/rfis (POST)
   ↓
9. Supabase insert with RLS validation
   ↓
10. Real-time update to RFI list
   ↓
11. Navigate to new RFI detail page
```

---

## API Architecture

### API Route Structure

```
/api/
├── rfis/
│   ├── route.ts (GET, POST - list/create RFIs)
│   └── [id]/route.ts (GET, PUT, DELETE - individual RFI)
│
├── projects/
│   ├── route.ts (GET, POST - list/create projects)
│   └── [id]/route.ts (GET, PUT, DELETE - individual project)
│
├── admin/
│   ├── invite-user/route.ts (POST - user invitations)
│   ├── create-company/route.ts (POST - company creation)
│   └── create-readonly-user/route.ts (POST - read-only user creation)
│
└── auth/
    └── callback/page.tsx (Supabase auth callback)
```

### API Security Pattern

All API routes implement:
1. **Authentication Check**: Verify user session
2. **Authorization Check**: Validate user permissions  
3. **Company Scope**: Ensure data access within user's company
4. **RLS Enforcement**: Database-level security validation

**Example API Structure**:
```typescript
// Standard API route pattern
export async function GET(request: NextRequest) {
  // 1. Get authenticated user
  const { user, error } = await getUser();
  if (error) return unauthorized();
  
  // 2. Check permissions
  if (!hasPermission(user, 'view_rfis')) return forbidden();
  
  // 3. Database query (RLS enforced)
  const data = await supabase.from('rfis').select('*');
  
  return NextResponse.json(data);
}
```

---

## Database Design

### Core Tables

```
companies
├── id (uuid, primary key)
├── name (text)
├── created_at (timestamp)
└── settings (jsonb)

users
├── id (uuid, primary key, references auth.users)
├── email (text)
├── full_name (text)
├── status (text: active/inactive)
└── created_at (timestamp)

company_users (junction table)
├── user_id (uuid, references users.id)
├── company_id (uuid, references companies.id)
├── role_id (integer, references roles.id)
└── created_at (timestamp)

projects
├── id (uuid, primary key)
├── name (text)
├── company_id (uuid, references companies.id)
├── client_company_name (text)
├── created_by (uuid, references users.id)
└── created_at (timestamp)

rfis
├── id (uuid, primary key)
├── rfi_number (text)
├── project_id (uuid, references projects.id)
├── title (text)
├── description (text)
├── status (text: draft/active/closed)
├── stage (text: workflow stages)
├── created_by (uuid, references users.id)
└── created_at (timestamp)

project_users (client assignments)
├── project_id (uuid, references projects.id)
├── user_id (uuid, references users.id)
├── role (text: viewer/collaborator/editor)
└── assigned_at (timestamp)
```

### Row Level Security (RLS)

**Core Security Pattern**: All tables use company-scoped RLS policies

```sql
-- Example RLS policy for projects table
CREATE POLICY "users_can_access_company_projects" ON projects
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id());
```

**Key RLS Functions**:
- `get_user_company_id()` - Returns user's company ID
- `is_app_owner()` - Checks if user is app owner (cross-company access)
- `get_user_projects()` - Returns user's accessible projects

**Implementation File**: `scripts/fix-rls-complete.sql`

---

## Security Implementation

### Multi-layered Security

```
1. Route Level (AuthGuard)
   ↓
2. Component Level (PermissionGate)
   ↓  
3. API Level (Authentication + Authorization)
   ↓
4. Database Level (RLS Policies)
```

### Security Features

1. **Authentication**: Supabase Auth with email/password
2. **Session Management**: Secure session handling with automatic refresh
3. **RBAC**: Role-based access control with granular permissions
4. **RLS**: Row-level security for multi-tenant data isolation
5. **Client Sessions**: Secure client access with time-limited tokens
6. **CORS**: Proper CORS configuration for API endpoints

### Client Security (External Access)

**Pattern**: Secure client links for external RFI access

```
1. Internal user generates client link for RFI
   ↓
2. Secure token created in client_sessions table
   ↓
3. Client accesses /client/[token] URL
   ↓
4. Token validated and RFI access granted
   ↓
5. Client sees simplified view with response capability
   ↓
6. Session expires after configured time
```

**Implementation**: `src/components/layout/ClientLayout.tsx`

---

## Client Workflow System

### Client Access Flow

```
Internal User (RFI Creator)
    ↓
Generate Client Link (PermissionGate: generate_client_link)
    ↓
Send Secure Link to Client
    ↓
Client Accesses Link (/client/[token])
    ↓
Client Authentication/Validation
    ↓
Client RFI View (RFIFormalView component)
    ↓
Client Response/Actions
    ↓
Response Recorded & Notifications Sent
    ↓
Client Session Expires/Logout
```

### Client vs Internal Views

**Internal View** (`RFIWorkflowView`):
- Full workflow controls
- Edit capabilities
- Status management
- File uploads
- Client link generation
- Print/export functions

**Client View** (`RFIFormalView`):
- Read-only RFI details
- Response submission
- Limited file access
- Export reports only
- Simplified navigation

**File Locations**:
- `src/components/rfi/RFIWorkflowView.tsx` - Internal view
- `src/components/rfi/RFIFormalView.tsx` - Client view
- `src/app/rfis/[id]/page.tsx` - View selection logic

---

## Notification System

### Notification Flow

```
Internal User (RFI Creator)
    ↓
Create Notification (useRFIs.createNotification())
    ↓
Notification Sent to All Project Users
    ↓
Client Receives Notification
    ↓
Notification Read Status
    ↓
Notification Archive
```

### Notification Types

- **RFI Creation**: Notify all project users about a new RFI
- **RFI Update**: Notify users about changes to an existing RFI
- **Project Update**: Notify users about changes to a project
- **Cost Update**: Notify users about changes to project costs

### Notification Implementation

**File**: `src/components/notifications/NotificationService.ts`

```typescript
// Example notification service implementation
export async function createNotification(rfi: RFI): Promise<void> {
  // Implementation logic to create a notification
}

export async function sendNotification(notification: Notification): Promise<void> {
  // Implementation logic to send a notification
}

export async function markNotificationRead(notification: Notification): Promise<void> {
  // Implementation logic to mark a notification as read
}

export async function archiveNotification(notification: Notification): Promise<void> {
  // Implementation logic to archive a notification
}
```

---

## Cost Tracking System

### Cost Tracking Flow

```
Internal User (RFI Creator)
    ↓
Create Cost Entry (useRFIs.createCostEntry())
    ↓
Cost Calculation (useRFIs.calculateCost())
    ↓
Cost Updated Notification
    ↓
Client Receives Cost Update
    ↓
Cost Archive
```

### Cost Types

- **RFI Cost**: Cost associated with an RFI
- **Project Cost**: Cost associated with a project

### Cost Tracking Implementation

**File**: `src/components/costs/CostTrackingService.ts`

```typescript
// Example cost tracking service implementation
export async function createCostEntry(rfi: RFI): Promise<void> {
  // Implementation logic to create a cost entry
}

export async function calculateCost(rfi: RFI): Promise<void> {
  // Implementation logic to calculate cost
}

export async function updateCost(rfi: RFI): Promise<void> {
  // Implementation logic to update cost
}

export async function archiveCost(rfi: RFI): Promise<void> {
  // Implementation logic to archive cost
}
```

---

## Notification System

### Architecture Overview

The notification system provides real-time updates for RFI activities through a comprehensive notification framework:

```
Client Response → API Route → NotificationService → Database → Real-time UI Update
                                     ↓
                              Email Service → Team Members
```

### Key Components

#### NotificationService (`src/services/notificationService.ts`)
- Core service for all notification operations
- Handles creation, delivery, and management of notifications
- Integrates with email services for external notifications

#### NotificationBell Component (`src/components/notifications/NotificationBell.tsx`)
- Header notification icon with unread count
- Dropdown preview of recent notifications
- Real-time polling for new notifications (30-second intervals)
- Integrated into main layout header

#### Notifications Page (`src/app/notifications/page.tsx`)
- Full notification management interface
- Search and filtering capabilities
- Bulk actions (mark as read, clear notifications)
- Detailed notification history and statistics

### Notification Types

1. **Response Received** (`response_received`)
   - Triggered when clients submit RFI responses
   - Notifies project team members
   - Includes response status and client information

2. **Status Changed** (`status_changed`)
   - Triggered when RFI status is updated
   - Notifies relevant team members based on workflow rules

3. **Overdue Reminder** (`overdue_reminder`)
   - Automated reminders for overdue RFIs
   - Escalation notifications to project managers

4. **Link Generated** (`link_generated`)
   - Notifies when secure client links are created
   - Sent to client contacts with access instructions

### Database Schema

```sql
-- Notifications table
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rfi_id UUID NOT NULL REFERENCES rfis(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Integration Points

- **Client Response Flow**: Triggers notifications when responses are submitted
- **RFI Workflow**: Integrated into status transitions and workflow actions
- **Email System**: Sends email notifications to team members
- **Real-time Updates**: Polls for new notifications every 30 seconds

---

## Cost Tracking System

### Architecture Overview

The timesheet cost tracking system enables detailed cost management for RFIs:

```
User Input → TimesheetTracker → API Routes → Database → Cost Calculations
                                    ↓
                             Summary Views → Reports
```

### Key Components

#### TimesheetTracker Component (`src/components/rfi/TimesheetTracker.tsx`)
- User interface for timesheet entry creation and management
- Form validation and error handling
- Real-time cost calculations and summaries
- Integrated into RFI workflow views

#### Timesheet API Routes (`src/app/api/rfis/[id]/timesheet-entries/`)
- Full CRUD operations for timesheet entries
- Data validation and business logic
- Cost calculation and summary generation
- Error handling and database migration checks

#### useTimesheetEntries Hook (`src/hooks/useTimesheetEntries.ts`)
- React hook for timesheet data management
- Loading states and error handling
- Automatic data refresh after operations
- Optimistic updates for better UX

### Cost Categories

1. **Labor Costs**
   - Hours worked and associated hourly rates
   - Labor cost calculations

2. **Material Costs**
   - Material expenses per RFI
   - Material cost tracking

3. **Subcontractor Costs**
   - External contractor expenses
   - Subcontractor cost management

4. **Equipment Costs**
   - Equipment usage and rental costs
   - Equipment cost tracking

### Database Schema

```sql
-- Main timesheet entries table
CREATE TABLE rfi_timesheet_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rfi_id UUID NOT NULL REFERENCES rfis(id) ON DELETE CASCADE,
    timesheet_number VARCHAR(100) NOT NULL,
    labor_hours DECIMAL(10,2) DEFAULT 0,
    labor_cost DECIMAL(12,2) DEFAULT 0,
    material_cost DECIMAL(12,2) DEFAULT 0,
    subcontractor_cost DECIMAL(12,2) DEFAULT 0,
    equipment_cost DECIMAL(12,2) DEFAULT 0,
    description TEXT,
    entry_date DATE NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Summary view for cost aggregation
CREATE VIEW rfi_timesheet_summary AS
SELECT 
    rfi_id,
    COUNT(*) as total_entries,
    SUM(labor_hours) as total_labor_hours,
    SUM(labor_cost) as total_labor_cost,
    SUM(material_cost) as total_material_cost,
    SUM(subcontractor_cost) as total_subcontractor_cost,
    SUM(equipment_cost) as total_equipment_cost,
    SUM(labor_cost + material_cost + subcontractor_cost + equipment_cost) as total_cost
FROM rfi_timesheet_entries
GROUP BY rfi_id;
```

### Integration Points

- **RFI Workflow**: Embedded in RFIWorkflowView, RFIFormalView, and RfiDetailView
- **Project Management**: Links actual costs to RFI and project budgets
- **Reporting**: Provides cost data for project analytics and reports
- **Security**: Protected by Row Level Security (RLS) policies

### Features

- **Unique Timesheet Numbers**: Prevents duplicate entries per RFI
- **Automatic Calculations**: Real-time cost summaries and totals
- **Audit Trail**: Complete history of cost entries and modifications
- **Form Validation**: Ensures data integrity and prevents errors
- **Cost Summaries**: Visual display of total costs and breakdowns

---

## File Structure Reference

### Key Directories

```
src/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Auth-related routes
│   ├── admin/                    # Admin panel
│   ├── api/                      # API routes
│   ├── client/                   # Client access routes
│   ├── projects/                 # Project management
│   ├── rfis/                     # RFI management
│   ├── reports/                  # Reporting and analytics
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home/dashboard page
│
├── components/                   # React components
│   ├── admin/                    # Admin-specific components
│   ├── layout/                   # Layout components
│   ├── project/                  # Project components
│   ├── rfi/                      # RFI components
│   ├── ui/                       # UI primitives
│   ├── AuthGuard.tsx             # Route protection
│   ├── LayoutWrapper.tsx         # Role-based layouts
│   └── PermissionGate.tsx        # Permission-based rendering
│
├── contexts/                     # React contexts
│   ├── AuthContext.tsx           # Authentication state
│   └── RFIContext.tsx            # RFI data state
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Authentication hook
│   ├── useProjectAssignments.ts  # Project assignment management
│   ├── useProjects.ts            # Project data management
│   ├── useRFIs.ts                # RFI data management
│   └── useUserRole.ts            # Role and permission management
│
├── lib/                          # Utility libraries
│   ├── supabase.ts               # Supabase client configuration
│   ├── types.ts                  # TypeScript type definitions
│   └── utils.ts                  # Utility functions
│
└── styles/                       # Styling
    └── globals.css               # Global styles
```

### Critical Files for Code Changes

**Authentication & Authorization**:
- `src/contexts/AuthContext.tsx`
- `src/components/AuthGuard.tsx`
- `src/hooks/useUserRole.ts`

**Layout & Navigation**:
- `src/components/LayoutWrapper.tsx`
- `src/components/layout/Navigation.tsx`
- `src/components/layout/Header.tsx`

**Permission System**:
- `src/components/PermissionGate.tsx`
- `src/hooks/useUserRole.ts` (hasPermission function)

**RFI System**:
- `src/hooks/useRFIs.ts`
- `src/components/rfi/RFIWorkflowView.tsx`
- `src/components/rfi/RFIFormalView.tsx`

**Admin System**:
- `src/app/admin/page.tsx`
- `src/components/admin/` (all files)

**Database & Security**:
- `scripts/fix-rls-complete.sql`
- `src/lib/supabase.ts`

---

## Development Patterns

### Common Code Patterns

1. **Permission Checking**:
```typescript
const { hasPermission, role } = useUserRole();
if (hasPermission('create_rfi')) {
  // Show create functionality
}
```

2. **Role-based Component Rendering**:
```typescript
<PermissionGate permission="access_admin">
  <AdminComponent />
</PermissionGate>
```

3. **API Route Protection**:
```typescript
const { user } = await getUser();
if (!user) return unauthorized();
if (!hasPermission(user, 'create_rfi')) return forbidden();
```

4. **Client vs Internal Views**:
```typescript
const isClientUser = role === 'client_collaborator';
if (isClientUser) {
  return <RFIFormalView rfi={rfi} isClientView={true} />;
}
return <RFIWorkflowView rfi={rfi} />;
```

### Error Handling Patterns

1. **Loading States**: All data hooks provide loading state
2. **Error Boundaries**: Components handle errors gracefully
3. **Permission Errors**: Redirect to appropriate pages
4. **Authentication Errors**: Redirect to login

---

## Change Impact Analysis

### When Making Changes to:

**User Roles/Permissions**:
- Update `src/hooks/useUserRole.ts` hasPermission function
- Check all `PermissionGate` components for consistency
- Update documentation in `docs/SETTINGS_REFERENCE.md`
- Test with different role combinations

**Navigation/Routing**:
- Update `src/components/layout/Navigation.tsx`
- Check `src/components/AuthGuard.tsx` route protection
- Verify role-based navigation hiding
- Test client vs internal user flows

**RFI Workflow**:
- Consider impact on both internal and client views
- Update both `RFIWorkflowView` and `RFIFormalView` as needed
- Check client access permissions
- Verify client link generation still works

**Database Schema**:
- Update RLS policies in `scripts/fix-rls-complete.sql`
- Update TypeScript types in `src/lib/types.ts`
- Test with different user roles
- Verify multi-tenant security

This document serves as the definitive reference for understanding RFITrak's architecture and making informed development decisions. 