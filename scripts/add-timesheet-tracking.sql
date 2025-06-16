-- Migration: Add timesheet tracking for RFI cost management
-- This script adds a new table for tracking detailed timesheet entries for RFIs

-- Create rfi_timesheet_entries table
CREATE TABLE IF NOT EXISTS rfi_timesheet_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rfi_id UUID NOT NULL REFERENCES rfis(id) ON DELETE CASCADE,
    timesheet_number VARCHAR(100) NOT NULL,
    labor_hours NUMERIC(8,2) DEFAULT 0,
    labor_cost NUMERIC(12,2) DEFAULT 0,
    material_cost NUMERIC(12,2) DEFAULT 0,
    subcontractor_cost NUMERIC(12,2) DEFAULT 0,
    equipment_cost NUMERIC(12,2) DEFAULT 0,
    description TEXT,
    entry_date DATE DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on rfi_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_rfi_timesheet_entries_rfi_id ON rfi_timesheet_entries(rfi_id);

-- Create index on timesheet_number for searching
CREATE INDEX IF NOT EXISTS idx_rfi_timesheet_entries_timesheet_number ON rfi_timesheet_entries(timesheet_number);

-- Create index on entry_date for date-based queries
CREATE INDEX IF NOT EXISTS idx_rfi_timesheet_entries_entry_date ON rfi_timesheet_entries(entry_date);

-- Add a unique constraint to prevent duplicate timesheet numbers per RFI
ALTER TABLE rfi_timesheet_entries 
ADD CONSTRAINT uq_rfi_timesheet_entries_rfi_timesheet 
UNIQUE (rfi_id, timesheet_number);

-- Add RLS (Row Level Security) policy
ALTER TABLE rfi_timesheet_entries ENABLE ROW LEVEL SECURITY;

-- Create policy for timesheet entries - users can only see entries for RFIs they have access to
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

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rfi_timesheet_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rfi_timesheet_entries_updated_at
    BEFORE UPDATE ON rfi_timesheet_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_rfi_timesheet_entries_updated_at();

-- Create a view for timesheet summary by RFI
CREATE OR REPLACE VIEW rfi_timesheet_summary AS
SELECT 
    rfi_id,
    COUNT(*) as total_entries,
    SUM(labor_hours) as total_labor_hours,
    SUM(labor_cost) as total_labor_cost,
    SUM(material_cost) as total_material_cost,
    SUM(subcontractor_cost) as total_subcontractor_cost,
    SUM(equipment_cost) as total_equipment_cost,
    SUM(labor_cost + material_cost + subcontractor_cost + equipment_cost) as total_cost,
    MIN(entry_date) as first_entry_date,
    MAX(entry_date) as last_entry_date
FROM rfi_timesheet_entries
GROUP BY rfi_id;

-- Grant access to the view
GRANT SELECT ON rfi_timesheet_summary TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE rfi_timesheet_entries IS 'Stores detailed timesheet entries for RFI cost tracking';
COMMENT ON COLUMN rfi_timesheet_entries.timesheet_number IS 'Reference number for the timesheet entry';
COMMENT ON COLUMN rfi_timesheet_entries.labor_hours IS 'Number of labor hours worked';
COMMENT ON COLUMN rfi_timesheet_entries.labor_cost IS 'Cost of labor for this entry';
COMMENT ON COLUMN rfi_timesheet_entries.material_cost IS 'Cost of materials used';
COMMENT ON COLUMN rfi_timesheet_entries.subcontractor_cost IS 'Cost of subcontractor work';
COMMENT ON COLUMN rfi_timesheet_entries.equipment_cost IS 'Cost of equipment usage';
COMMENT ON COLUMN rfi_timesheet_entries.description IS 'Optional description of work performed';
COMMENT ON COLUMN rfi_timesheet_entries.entry_date IS 'Date when the work was performed'; 