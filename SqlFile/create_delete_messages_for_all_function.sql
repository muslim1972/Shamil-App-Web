-- Creates the function to delete messages for all participants
CREATE OR REPLACE FUNCTION public.delete_messages_for_all(p_message_ids uuid[])
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    message_count integer;
    user_message_count integer;
BEGIN
    -- Count how many of the provided message IDs actually exist and belong to the user.
    -- This prevents users from deleting messages they did not send.
    SELECT count(*)
    INTO user_message_count
    FROM public.messages
    WHERE id = ANY(p_message_ids) AND sender_id = auth.uid();

    -- Get the total number of message IDs passed to the function.
    SELECT array_length(p_message_ids, 1) INTO message_count;

    -- If the number of messages owned by the user does not match the number of messages requested for deletion,
    -- it means they are trying to delete messages that are not theirs. Raise an exception.
    IF user_message_count IS NULL OR user_message_count < message_count THEN
        RAISE EXCEPTION 'User is not authorized to delete all specified messages.';
    END IF;

    -- If the check passes, proceed with deletion.
    DELETE FROM public.messages
    WHERE id = ANY(p_message_ids);

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        -- In case of any error, return false.
        RETURN FALSE;
END;
$function$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.delete_messages_for_all(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_messages_for_all(uuid[]) TO service_role;

-- Verification
DO $$
BEGIN
    RAISE NOTICE 'Function delete_messages_for_all has been created successfully.';
END $$;
