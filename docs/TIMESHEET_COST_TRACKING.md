# RFI Timesheet Cost Tracking System

## Status: ✅ COMPLETED & FUNCTIONAL

## Overview
The RFI Timesheet Cost Tracking system allows users to track actual costs associated with RFIs through timesheet entries. Each entry captures labor hours, costs, materials, subcontractor expenses, and equipment costs.

## Database Schema

### Tables Created
- `rfi_timesheet_entries` - Main table for timesheet entries
- `rfi_timesheet_summary` - View for aggregated cost data

### Key Features
- Unique timesheet numbers per RFI
- Comprehensive cost tracking (labor, materials, subcontractors, equipment)
- Automatic cost calculations and summaries
- User audit trail with created_by tracking
- Row Level Security (RLS) policies for data access control

## Implementation

### Database Migration
Run the migration script to set up the timesheet tracking tables:
```sql
-- Execute: scripts/add-timesheet-tracking.sql
```

### API Endpoints

#### GET `/api/rfis/[id]/timesheet-entries`
Retrieves all timesheet entries for an RFI with summary data.

**Response:**
```json
{
  "success": true,
  "data": {
    "entries": [...],
    "summary": {
      "total_entries": 3,
      "total_labor_hours": 24,
      "total_labor_cost": 1200.00,
      "total_material_cost": 500.00,
      "total_subcontractor_cost": 0.00,
      "total_equipment_cost": 200.00,
      "total_cost": 1900.00
    }
  }
}
```

#### POST `/api/rfis/[id]/timesheet-entries`
Creates a new timesheet entry.

**Request Body:**
```json
{
  "timesheet_number": "TS-2024-001",
  "labor_hours": 8,
  "labor_cost": 400.00,
  "material_cost": 150.00,
  "subcontractor_cost": 0.00,
  "equipment_cost": 50.00,
  "description": "Initial site work",
  "entry_date": "2024-06-16"
}
```

#### PUT `/api/rfis/[id]/timesheet-entries/[entryId]`
Updates an existing timesheet entry.

#### DELETE `/api/rfis/[id]/timesheet-entries/[entryId]`
Deletes a timesheet entry.

### Frontend Components

#### TimesheetTracker Component
- Location: `src/components/rfi/TimesheetTracker.tsx`
- Features:
  - Add new timesheet entries
  - View existing entries in a table
  - Real-time cost calculations
  - Form validation
  - Error handling

#### useTimesheetEntries Hook
- Location: `src/hooks/useTimesheetEntries.ts`
- Provides:
  - CRUD operations for timesheet entries
  - Loading states
  - Error handling
  - Automatic data refresh

### Integration Points

The TimesheetTracker component is integrated into:
- `src/components/rfi/RFIWorkflowView.tsx` - Main RFI workflow interface

## Data Structure

### RFITimesheetEntry Interface
```typescript
interface RFITimesheetEntry {
  id: string;
  rfi_id: string;
  timesheet_number: string;
  labor_hours: number;
  labor_cost: number;
  material_cost: number;
  subcontractor_cost: number;
  equipment_cost: number;
  description?: string;
  entry_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

### RFITimesheetSummary Interface
```typescript
interface RFITimesheetSummary {
  rfi_id: string;
  total_entries: number;
  total_labor_hours: number;
  total_labor_cost: number;
  total_material_cost: number;
  total_subcontractor_cost: number;
  total_equipment_cost: number;
  total_cost: number;
  first_entry_date: string;
  last_entry_date: string;
}
```

## Security & Permissions

### Row Level Security (RLS)
- Users can only access timesheet entries for RFIs within their company
- Policies enforce company-based access control
- Admin users have elevated permissions

### Authentication
- Currently uses first available user for `created_by` field
- TODO: Implement proper user authentication from session

## Usage

1. Navigate to an RFI in the workflow view
2. Scroll to the "Actual Cost Tracking" section
3. Click "Add Timesheet Entry" to create new entries
4. Fill in the required fields:
   - Timesheet Number (must be unique per RFI)
   - Entry Date
   - Labor Hours and Cost
   - Material, Subcontractor, and Equipment costs (optional)
   - Description (optional)
5. Submit to save the entry
6. View all entries in the table below the form
7. Edit or delete entries as needed

## Future Enhancements

- [ ] Implement proper user authentication
- [ ] Add timesheet entry templates
- [ ] Export functionality for cost reports
- [ ] Integration with external timesheet systems
- [ ] Bulk import/export capabilities
- [ ] Advanced filtering and search
- [ ] Cost approval workflows 