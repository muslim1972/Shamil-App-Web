-- This function forwards a set of messages to a new conversation.
CREATE OR REPLACE FUNCTION public.forward_messages(
    p_source_message_ids uuid[],
    p_target_conversation_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    source_message record;
BEGIN
    -- Security Check: Ensure the current user is a participant in the target conversation.
    IF NOT EXISTS (
        SELECT 1 FROM public.conversations
        WHERE id = p_target_conversation_id AND participants @> ARRAY[auth.uid()]
    ) THEN
        RAISE EXCEPTION 'User is not a participant in the target conversation.';
    END IF;

    -- Loop through each source message ID and create a new forwarded message.
    FOR source_message IN
        SELECT * FROM public.messages
        WHERE id = ANY(p_source_message_ids)
    LOOP
        INSERT INTO public.messages (
            conversation_id,
            sender_id, -- The user forwarding the message becomes the new sender
            content,
            message_type,
            file_url,
            file_name,
            file_size,
            -- Link back to the original message for tracking, if the column exists
            forwarded_from_message_id 
        )
        VALUES (
            p_target_conversation_id,
            auth.uid(), 
            source_message.content,
            source_message.message_type,
            source_message.file_url,
            source_message.file_name,
            source_message.file_size,
            source_message.id 
        );
    END LOOP;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        -- In case of any error, return false.
        RETURN FALSE;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.forward_messages(uuid[], uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.forward_messages(uuid[], uuid) TO service_role;

-- Verification
DO $$
BEGIN
    RAISE NOTICE 'Function forward_messages has been created successfully.';
END $$;
