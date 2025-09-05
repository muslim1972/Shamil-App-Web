-- This is the second step of debugging to isolate the error.

-- 1. Drop the existing function
DROP FUNCTION IF EXISTS public.get_user_conversations() CASCADE;

-- 2. Create a new debug version of the function
CREATE OR REPLACE FUNCTION public.get_user_conversations()
RETURNS TABLE(
    id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    other_user_id UUID,
    other_username TEXT,
    other_avatar_url TEXT,
    last_message_content TEXT,
    last_message_created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.created_at,
        c.updated_at,
        (array_remove(c.participants, auth.uid()))[1] AS other_user_id,
        'Debug User Step 2'::text AS other_username,
        NULL::text AS other_avatar_url,
        (SELECT m.content FROM public.messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_content,
        (SELECT m.created_at FROM public.messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_created_at
    FROM
        public.conversations c
    WHERE
        c.participants @> ARRAY[auth.uid()]
    ORDER BY
        last_message_created_at DESC NULLS LAST;
END;
$$;

-- 3. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_user_conversations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_conversations() TO service_role;

-- 4. Verify that the function has been created successfully
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'get_user_conversations') THEN
        RAISE NOTICE 'Debug function step 2 get_user_conversations created successfully.';
    ELSE
        RAISE NOTICE 'Failed to create debug function step 2 get_user_conversations.';
    END IF;
END $$;
