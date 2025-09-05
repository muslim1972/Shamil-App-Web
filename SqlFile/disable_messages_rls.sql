-- WARNING: This script temporarily disables Row Level Security (RLS) on the public.messages table.
-- This is for debugging purposes ONLY and is HIGHLY INSECURE for production environments.

BEGIN;

-- Step 1: Drop the current temporary INSERT policy.
DROP POLICY IF EXISTS "TEMP_Allow_Authenticated_Sender_Insert" ON public.messages;

-- Step 2: Disable RLS on the messages table.
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

COMMIT;

SELECT 'RLS on messages table has been temporarily disabled. Try sending a message now.' as result;
