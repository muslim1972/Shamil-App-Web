-- This script updates the clear_and_hide_conversation function to properly hide all messages before hiding the conversation.

CREATE OR REPLACE FUNCTION public.clear_and_hide_conversation(p_conversation_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Verify that the current user is a participant in the conversation
    IF NOT EXISTS (
        SELECT 1 FROM public.conversation_participants cp
        WHERE cp.conversation_id = p_conversation_id AND cp.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'User is not a participant in this conversation';
    END IF;

    -- Mark all current messages in the conversation as hidden for the user
    -- This will add a record for each message in the visibility table, or update it if it already exists.
    INSERT INTO public.user_message_visibility (user_id, message_id, is_hidden)
    SELECT auth.uid(), id, TRUE
    FROM public.messages
    WHERE public.messages.conversation_id = p_conversation_id
    ON CONFLICT (user_id, message_id) DO UPDATE
    SET is_hidden = TRUE;

    -- Hide the conversation itself for the current user in their settings
    INSERT INTO public.user_conversation_settings (user_id, conversation_id, is_hidden, hidden_at)
    VALUES (auth.uid(), p_conversation_id, TRUE, NOW())
    ON CONFLICT (user_id, conversation_id) DO UPDATE
    SET is_hidden = TRUE, hidden_at = NOW();

    -- Return true to indicate success
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        -- In case of any error, return false
        RETURN FALSE;
END;
$function$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.clear_and_hide_conversation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_and_hide_conversation(uuid) TO service_role;

-- Verification
DO $$
BEGIN
    RAISE NOTICE 'Function clear_and_hide_conversation has been updated successfully.';
END $$;
