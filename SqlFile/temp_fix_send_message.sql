-- This script applies a temporary, more permissive INSERT RLS policy to unblock message sending.
-- This policy is less secure as it does not check conversation membership.

BEGIN;

-- Step 1: Drop the current INSERT policy.
DROP POLICY IF EXISTS "Users can send messages in their conversations v2" ON public.messages;

-- Step 2: Drop the function, as it won't be used by this temporary policy.
DROP FUNCTION IF EXISTS public.can_send_message(uuid, uuid);

-- Step 3: Create the new, simpler INSERT policy.
CREATE POLICY "TEMP_Allow_Authenticated_Sender_Insert" 
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

COMMIT;

SELECT 'Temporary INSERT policy applied. Please try sending a message now.' as result;
