-- This script creates a database function to delete old messages and schedules it to run daily.

-- Step 1: Create the function that will perform the deletion.
-- This function is written in simple SQL for efficiency.
-- It deletes all records from the public.messages table where the creation date is older than 72 hours ago.
CREATE OR REPLACE FUNCTION public.delete_old_messages()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.messages
  WHERE created_at < (NOW() - INTERVAL '72 hours');
$$;

-- Step 2: Schedule the function to run automatically using pg_cron.
-- This command tells the database to run the function once every day at midnight (00:00 UTC).
-- We give the job a descriptive name, 'daily-message-cleanup', so we can easily manage it in the future if needed.
SELECT cron.schedule(
  'daily-message-cleanup', -- The unique name for our job
  '0 0 * * *',          -- The schedule: runs at minute 0 of hour 0 every day
  'SELECT public.delete_old_messages()' -- The command to execute
);

-- Verification Notice: This will show up in your query results upon successful execution.
DO $$
BEGIN
    RAISE NOTICE 'SUCCESS: The function "delete_old_messages" has been created and is now scheduled to run automatically every day.';
    RAISE NOTICE 'You can safely delete this script from the SQL Editor now.';
END $$;
