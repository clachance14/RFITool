-- Populate RFI-003 with enhanced data for testing
UPDATE rfis 
SET 
  work_impact = 'This work will require coordination with electrical and plumbing trades. May impact adjacent areas.',
  cost_impact = 2300.00,  -- Numeric value instead of text
  schedule_impact = 'May delay completion by 2-3 days depending on material availability.',
  contractor_proposed_solution = 'Recommend using specified paint system from architectural drawings. Will coordinate with architect for final color selection.',
  
  -- Cost tracking
  actual_labor_cost = 1250.00,
  actual_material_cost = 850.00,
  actual_equipment_cost = 200.00,
  actual_labor_hours = 16,
  exclude_from_cost_tracking = false,
  
  -- Field work
  requires_field_work = true,
  field_work_description = 'Field verification of existing paint condition and substrate preparation required before proceeding with new paint application.',
  field_work_approved = null

WHERE rfi_number = 'RFI-003';

-- Verify the update
SELECT 
  rfi_number,
  subject,
  work_impact,
  cost_impact,
  schedule_impact,
  actual_labor_cost,
  actual_material_cost,
  actual_equipment_cost,
  requires_field_work,
  field_work_description
FROM rfis 
WHERE rfi_number = 'RFI-003'; 