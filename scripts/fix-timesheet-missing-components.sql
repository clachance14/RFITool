-- Fix Missing Timesheet Components
-- This script adds the missing components for timesheet tracking
-- Run this after confirming that rfi_timesheet_entries table exists

-- Add missing indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_rfi_timesheet_entries_rfi_id ON rfi_timesheet_entries(rfi_id);
CREATE INDEX IF NOT EXISTS idx_rfi_timesheet_entries_timesheet_number ON rfi_timesheet_entries(timesheet_number);
CREATE INDEX IF NOT EXISTS idx_rfi_timesheet_entries_entry_date ON rfi_timesheet_entries(entry_date);

-- Add unique constraint to prevent duplicate timesheet numbers per RFI
-- First check if constraint already exists
DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'rfi_timesheet_entries' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name = 'uq_rfi_timesheet_entries_rfi_timesheet'
    ) THEN
        ALTER TABLE rfi_timesheet_entries 
        ADD CONSTRAINT uq_rfi_timesheet_entries_rfi_timesheet 
        UNIQUE (rfi_id, timesheet_number);
        RAISE NOTICE 'Unique constraint added successfully';
    ELSE
        RAISE NOTICE 'Unique constraint already exists, skipping';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Constraint creation failed or already exists: %', SQLERRM;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE rfi_timesheet_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create new one
DROP POLICY IF EXISTS "Users can manage timesheet entries for their company's RFIs" ON rfi_timesheet_entries;

-- Create RLS policy for timesheet entries
CREATE POLICY "Users can manage timesheet entries for their company's RFIs" ON rfi_timesheet_entries
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM rfis r
        JOIN projects p ON r.project_id = p.id
        JOIN company_users cu ON p.company_id = cu.company_id
        WHERE r.id = rfi_timesheet_entries.rfi_id
        AND cu.user_id = auth.uid()
    )
);

-- Drop and recreate the view to handle structure conflicts
DROP VIEW IF EXISTS rfi_timesheet_summary;

-- Create the timesheet summary view
CREATE VIEW rfi_timesheet_summary AS
SELECT 
    rfi_id,
    COUNT(*) as total_entries,
    COALESCE(SUM(labor_hours), 0) as total_labor_hours,
    COALESCE(SUM(labor_cost), 0) as total_labor_cost,
    COALESCE(SUM(material_cost), 0) as total_material_cost,
    COALESCE(SUM(subcontractor_cost), 0) as total_subcontractor_cost,
    COALESCE(SUM(equipment_cost), 0) as total_equipment_cost,
    COALESCE(SUM(labor_cost + material_cost + subcontractor_cost + equipment_cost), 0) as total_cost,
    MIN(entry_date) as first_entry_date,
    MAX(entry_date) as last_entry_date
FROM rfi_timesheet_entries
GROUP BY rfi_id;

-- Grant access to the view
GRANT SELECT ON rfi_timesheet_summary TO authenticated;

-- Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_rfi_timesheet_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS trigger_update_rfi_timesheet_entries_updated_at ON rfi_timesheet_entries;

CREATE TRIGGER trigger_update_rfi_timesheet_entries_updated_at
    BEFORE UPDATE ON rfi_timesheet_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_rfi_timesheet_entries_updated_at();

-- Add helpful comments
COMMENT ON TABLE rfi_timesheet_entries IS 'Stores detailed timesheet entries for RFI cost tracking';
COMMENT ON VIEW rfi_timesheet_summary IS 'Aggregated view of timesheet costs per RFI for dashboard display';

-- Test the view works
SELECT 'SUCCESS: rfi_timesheet_summary view created successfully' as status; 