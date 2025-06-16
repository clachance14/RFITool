-- Fix workflow stages for RFIs that have client responses but incorrect stages
-- This script updates RFIs that have client_response data but are not in 'response_received' stage

-- Update RFIs that have client responses but are not properly staged
UPDATE rfis 
SET 
  stage = 'response_received',
  updated_at = NOW()
WHERE 
  client_response IS NOT NULL 
  AND client_response != '' 
  AND (stage IS NULL OR stage != 'response_received')
  AND date_responded IS NOT NULL;

-- Also ensure status is 'active' for RFIs with responses (not 'draft' or other states)
UPDATE rfis 
SET 
  status = 'active',
  updated_at = NOW()
WHERE 
  client_response IS NOT NULL 
  AND client_response != '' 
  AND stage = 'response_received'
  AND status NOT IN ('active', 'closed');

-- Display the updated RFIs for verification
SELECT 
  id,
  rfi_number,
  subject,
  status,
  stage,
  date_responded,
  LENGTH(client_response) as response_length
FROM rfis 
WHERE stage = 'response_received' 
ORDER BY date_responded DESC; 