-- Alter the status column type from enum to varchar
ALTER TABLE profile_request 
  ALTER COLUMN status TYPE varchar USING status::varchar;

-- Check if you have any rows in the table and display their statuses
SELECT id, status FROM profile_request LIMIT 10; 