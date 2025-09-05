-- This script fixes the INSERT RLS policy on the messages table that was broken by the last change.

BEGIN;

-- Step 1: Create a function to check if a user can send a message.
CREATE OR REPLACE FUNCTION public.can_send_message(p_conversation_id uuid, p_sender_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the sender is the current user AND if the current user is a participant.
  RETURN p_sender_id = auth.uid() AND EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE id = p_conversation_id AND auth.uid() = ANY(participants)
  );
END;
$$;

-- Step 2: Drop the old, broken INSERT policy.
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;

-- Step 3: Create a new INSERT policy that uses the function.
CREATE POLICY "Users can send messages in their conversations v2"
ON public.messages FOR INSERT
WITH CHECK (public.can_send_message(conversation_id, sender_id));

-- Step 4: Grant execute permissions on the new function.
GRANT EXECUTE ON FUNCTION public.can_send_message(uuid, uuid) TO authenticated;

COMMIT;

SELECT 'The message sending policy has been fixed. Please try sending a message now.' as result;
