-- This script refactors the message SELECT policy into a SECURITY DEFINER function
-- in a final attempt to resolve the real-time issue for the receiver.

BEGIN;

-- Step 1: Drop the old, problematic policy.
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;

-- Step 2: Create a wrapper function with SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.can_view_message(p_message_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id uuid;
  is_participant boolean;
BEGIN
  -- Get the conversation_id for the message
  SELECT conversation_id INTO v_conversation_id FROM public.messages WHERE id = p_message_id;

  -- Check if the current user is a participant in that conversation
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE id = v_conversation_id AND auth.uid() = ANY(participants)
  ) INTO is_participant;

  RETURN is_participant;
END;
$$;

-- Step 3: Create the new, simpler policy that calls the function.
CREATE POLICY "Users can view messages in their conversations v2"
ON public.messages FOR SELECT
USING (public.can_view_message(id));

-- Step 4: Grant execute permissions on the new function.
GRANT EXECUTE ON FUNCTION public.can_view_message(uuid) TO authenticated;

COMMIT;

SELECT 'Message SELECT policy has been refactored. This is the final attempt.' as result;
