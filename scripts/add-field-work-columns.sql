-- Add field work approval and related columns to rfis table
-- This script adds columns for field work approval functionality

-- Add field work related columns
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS requires_field_work BOOLEAN DEFAULT FALSE;
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS field_work_description TEXT;
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS field_work_approved BOOLEAN DEFAULT FALSE;

-- Add cost tracking columns if they don't exist
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS actual_labor_cost NUMERIC(12,2);
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS actual_material_cost NUMERIC(12,2);
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS actual_equipment_cost NUMERIC(12,2);
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS actual_labor_hours NUMERIC(8,2);
ALTER TABLE rfis ADD COLUMN IF NOT EXISTS exclude_from_cost_tracking BOOLEAN DEFAULT FALSE;

-- Verify the columns were added
SELECT 
    'Checking field work columns' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'rfis' 
AND column_name IN (
    'requires_field_work', 
    'field_work_description', 
    'field_work_approved',
    'actual_labor_cost',
    'actual_material_cost', 
    'actual_equipment_cost',
    'actual_labor_hours',
    'exclude_from_cost_tracking'
)
ORDER BY column_name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Field work and cost tracking columns added successfully!';
    RAISE NOTICE '🔧 Added requires_field_work, field_work_description, field_work_approved';
    RAISE NOTICE '💰 Added cost tracking columns for labor, materials, equipment';
    RAISE NOTICE '📊 Client response portal now supports complete RFI information';
END $$; 