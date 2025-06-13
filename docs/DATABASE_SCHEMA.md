# RFITrak Database Schema Documentation

## Overview
RFITrak uses a PostgreSQL database with a well-structured schema designed for multi-tenant RFI (Request for Information) management. The system supports companies, users, projects, and the complete RFI lifecycle including client interactions.

## Database Structure Overview

```
Companies & Users
├── companies (Company information)
├── users (User profiles)
├── company_users (User-company relationships)
├── roles (User roles)
├── permissions (System permissions)
└── role_permissions (Role-permission mapping)

Projects & RFIs
├── projects (Construction projects)
├── rfis (Request for Information records)
├── rfi_revisions (RFI version history)
├── rfi_attachments (File attachments)
├── rfi_cost_items (Cost tracking)
├── rfi_activity (Activity logs)
└── rfi_status_logs (Status change history)

Client Access
├── client_sessions (Secure client access tokens)
└── Subscription Management
    ├── plans (Subscription plans)
    └── company_subscriptions (Company billing)
```

---

## Core Tables

### 1. Users & Companies

#### `users`
**Purpose**: Stores user account information
```sql
Key Fields:
- id (uuid) - Primary key, links to Supabase auth
- full_name (text) - User's display name
- email (text) - Unique email address
- avatar_url (text) - Profile picture URL
- status (varchar) - Account status (active/inactive)
```

#### `companies`
**Purpose**: Represents construction companies/organizations
```sql
Key Fields:
- id (uuid) - Primary key
- name (varchar) - Company name
- logo_url (text) - Company logo
- created_at/updated_at - Timestamps
```

#### `company_users`
**Purpose**: Links users to companies with roles
```sql
Key Fields:
- company_id (uuid) - References companies.id
- user_id (uuid) - References users.id
- role_id (integer) - References roles.id
```

### 2. Projects

#### `projects`
**Purpose**: Construction project information
```sql
Key Fields:
- id (uuid) - Primary key
- company_id (uuid) - Owner company
- project_name (varchar) - Project title
- job_contract_number (varchar) - Contract identifier
- client_company_name (varchar) - Client organization
- client_contact_name (varchar) - Primary client contact
- project_manager_contact (varchar) - PM email
- location (text) - Project location
- project_type (enum) - Type of construction
- contract_value (numeric) - Project value
- start_date/expected_completion (date) - Timeline
- default_urgency (enum) - Default RFI urgency
- standard_recipients (array) - Default email list
- project_disciplines (array) - Involved trades
```

### 3. RFIs (Requests for Information)

#### `rfis`
**Purpose**: Main RFI records with full lifecycle tracking
```sql
Key Fields:
- id (uuid) - Primary key
- project_id (uuid) - References projects.id
- rfi_number (varchar) - Human-readable identifier
- subject (varchar) - RFI title/summary
- contractor_question (text) - The actual question
- contractor_proposed_solution (text) - Suggested solution
- client_response (text) - Client's answer
-
Status & Workflow:
- status (enum) - Current status
- stage (enum) - Current workflow stage
- urgency (enum) - Priority level
- due_date (date) - Response deadline
- date_sent/date_responded - Key timestamps
- 
Cost & Schedule Impact:
- work_impact (varchar) - Impact description
- cost_impact (numeric) - Financial impact
- schedule_impact (text) - Timeline impact
- exclude_from_cost_tracking (boolean)
- actual_labor_hours/cost - Tracking fields
- actual_material_cost/equipment_cost
- 
Workflow States:
- rejection_type/reason - If rejected
- voided_reason/by/at - If cancelled
- reopened_reason/by/at - If reopened
- superseded_by/at - If replaced
```

#### `rfi_revisions`
**Purpose**: Version history for RFI changes
```sql
Key Fields:
- id (uuid) - Primary key
- rfi_id (uuid) - References rfis.id
- revision_number (integer) - Version number
- subject/description/reason_for_rfi - Content fields
- contractor_question/proposed_solution
- changes_summary (text) - What changed
- created_by/created_at - Audit fields
```

#### `rfi_attachments`
**Purpose**: File attachments for RFIs with client support
```sql
Key Fields:
- id (uuid) - Primary key
- rfi_id (uuid) - References rfis.id
- file_name/file_path/public_url - File info
- file_type/file_size_bytes - Metadata
- 
Upload Tracking:
- uploaded_by (uuid) - References users.id
- uploaded_by_type (varchar) - 'contractor' or 'client'
- client_session_token (varchar) - For client uploads
- client_uploaded_by (varchar) - Client identifier
- 
Organization:
- attachment_category (varchar) - File category
- is_visible_to_client (boolean) - Visibility control
```

#### `rfi_cost_items`
**Purpose**: Detailed cost breakdown for RFIs
```sql
Key Fields:
- rfi_id (uuid) - References rfis.id
- description (text) - Cost item description
- cost_type (enum) - Type of cost
- quantity/unit/unit_cost - Calculation fields
```

### 4. Activity Tracking

#### `rfi_activity`
**Purpose**: Comprehensive activity log for all RFI actions
```sql
Key Fields:
- rfi_id (uuid) - References rfis.id
- user_id (uuid) - Who performed the action
- activity_type (text) - Type of activity
- details (jsonb) - Additional activity data
- created_at - When it happened
```

#### `rfi_status_logs`
**Purpose**: Specific tracking for status changes
```sql
Key Fields:
- rfi_id (uuid) - References rfis.id
- from_status/to_status (text) - Status transition
- changed_by (uuid) - Who made the change
- reason (text) - Why status changed
- additional_data (jsonb) - Extra context
```

### 5. Client Access System

#### `client_sessions`
**Purpose**: Secure temporary access for clients to view/respond to RFIs
```sql
Key Fields:
- id (uuid) - Primary key
- token (varchar) - Secure access token (unique)
- rfi_id (uuid) - Which RFI they can access
- client_email/client_name - Client identification
- expires_at - Token expiration
- is_active (boolean) - Can be disabled
```

### 6. Permissions & Roles

#### `roles`
**Purpose**: System roles (Admin, Project Manager, etc.)
```sql
Key Fields:
- id (integer) - Primary key
- name (varchar) - Role name (unique)
- description (text) - Role explanation
```

#### `permissions`
**Purpose**: Granular system permissions
```sql
Key Fields:
- id (integer) - Primary key
- name (varchar) - Permission name (unique)
- description (text) - What it allows
```

#### `role_permissions`
**Purpose**: Maps which permissions each role has
```sql
Key Fields:
- role_id (integer) - References roles.id
- permission_id (integer) - References permissions.id
```

### 7. Subscription Management

#### `plans`
**Purpose**: Available subscription tiers
```sql
Key Fields:
- id (integer) - Primary key
- name (varchar) - Plan name
- price_monthly/yearly (integer) - Pricing in cents
- max_projects/users (integer) - Limits
- features (jsonb) - Feature flags
```

#### `company_subscriptions`
**Purpose**: Company billing and plan tracking
```sql
Key Fields:
- company_id (uuid) - References companies.id
- plan_id (integer) - References plans.id
- status (enum) - Subscription status
- current_period_start/end - Billing period
- stripe_subscription_id - Payment processor link
```

---

## Key Relationships

### Company Hierarchy
- Companies → Users (many-to-many via company_users)
- Companies → Projects (one-to-many)
- Companies → Subscriptions (one-to-one)

### Project Structure
- Projects → RFIs (one-to-many)
- RFIs → Attachments (one-to-many)
- RFIs → Cost Items (one-to-many)
- RFIs → Revisions (one-to-many)

### Activity Tracking
- RFIs → Activity Logs (one-to-many)
- RFIs → Status Logs (one-to-many)

### Client Access
- RFIs → Client Sessions (one-to-many)
- Client Sessions → Attachments (via token)

---

## Data Types & Enums

### Custom Enums
- **urgency_enum**: 'low', 'medium', 'high', 'critical'
- **project_type**: Various construction types
- **cost_type**: 'labor', 'material', 'equipment', 'other'
- **rfi_status**: 'draft', 'sent', 'responded', 'closed', etc.
- **rfi_stage**: Workflow stages

### Common Patterns
- **UUIDs**: Primary keys for all major entities
- **Timestamps**: created_at/updated_at on most tables
- **JSONB**: Flexible data storage (features, details, etc.)
- **Arrays**: Multiple values (recipients, disciplines)

---

## Security Features

### ✅ Row Level Security (RLS) - IMPLEMENTED ✅
**Status:** ACTIVE - 100% test success rate (December 2024)

**Security Policies In Place:**
- **Complete company data isolation** - Users can only access their company's data
- **Anonymous access blocked** - All 15 core tables protected
- **Multi-tenant security** - Proper isolation between companies
- **Authenticated-only access** - All queries require valid user authentication
- **Client secure token access** - Limited read access via secure tokens for RFI responses

**Implementation Details:**
- All tables have RLS enabled with company-based isolation
- Helper function `get_user_company_id()` ensures proper company context
- Anonymous role explicitly revoked from all table access
- Comprehensive test suite validates security (15/15 tests passing)

### Audit Trail
- All RFI changes logged in rfi_activity
- Status changes tracked in rfi_status_logs
- User actions traceable

### Client Access
- Time-limited secure tokens
- No permanent client accounts
- Controlled file visibility

---

## Performance Considerations

### Indexes
- Primary keys (automatic)
- Foreign key relationships
- Frequently queried fields (status, dates)
- Client session tokens

### Partitioning Opportunities
- Activity logs by date
- Large attachment tables

---

## Backup & Maintenance

### Critical Tables (High Priority)
1. `companies`, `users`, `company_users`
2. `projects`, `rfis`
3. `rfi_attachments` (metadata; files stored separately)

### Log Tables (Medium Priority)
- `rfi_activity`, `rfi_status_logs`
- Can be archived/truncated periodically

### Session Tables (Low Priority)
- `client_sessions` - temporary data
- Can be cleaned up regularly

---

*Last Updated: $(date)*
*Schema Version: Production* 