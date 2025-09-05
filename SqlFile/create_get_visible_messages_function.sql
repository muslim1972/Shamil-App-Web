-- Creates a function to get messages for a user, excluding those they have hidden.
CREATE OR REPLACE FUNCTION public.get_visible_messages(p_conversation_id UUID)
RETURNS SETOF messages AS $$
BEGIN
    RETURN QUERY
    SELECT m.*
    FROM public.messages m
    WHERE m.conversation_id = p_conversation_id
      AND NOT EXISTS (
          SELECT 1
          FROM public.user_message_visibility umv
          WHERE umv.message_id = m.id
            AND umv.user_id = auth.uid()
            AND umv.is_hidden = TRUE
      )
    ORDER BY
        m.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to the function
GRANT EXECUTE ON FUNCTION public.get_visible_messages(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_visible_messages(UUID) TO service_role;

-- Verification
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_visible_messages' AND routine_schema = 'public') THEN
        RAISE NOTICE 'Function get_visible_messages created successfully.';
    ELSE
        RAISE NOTICE 'Failed to create function get_visible_messages.';
    END IF;
END $$;
