-- Add test impact analysis data to RFI-001
-- This will populate the work_impact, cost_impact, and schedule_impact fields

UPDATE rfis 
SET 
  work_impact = 'Installation of additional instrumentation tray will require removal of existing cable tray supports and installation of new structural supports. Work will need to be coordinated with electrical and instrumentation teams.',
  cost_impact = 'Estimated additional cost: $15,000 for materials and $8,500 for labor. Total impact: $23,500',
  schedule_impact = 'Work will add approximately 3-4 days to the construction schedule. Must be completed before final electrical connections.'
WHERE rfi_number = 'RFI-001';

-- Check the update
SELECT id, rfi_number, work_impact, cost_impact, schedule_impact 
FROM rfis 
WHERE rfi_number = 'RFI-001'; 