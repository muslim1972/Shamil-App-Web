
-- تطبيق تعديل على دالة جلب المحادثات لاستبعاد المحادثات المؤرشفة
-- هذا التعديل يضمن أن المحادثات المؤرشفة لا تظهر في قائمة المحادثات الرئيسية

-- Drop the old function first to allow changing the return type
DROP FUNCTION IF EXISTS public.get_user_conversations(UUID);

-- Recreate the function with the correct return types
CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    other_user_id UUID,
    other_username CHARACTER VARYING,
    other_avatar_url TEXT,
    last_message_content TEXT,
    last_message_created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    WITH last_messages AS (
        SELECT
            m.conversation_id,
            m.content AS last_message_content,
            m.created_at AS last_message_created_at,
            ROW_NUMBER() OVER (PARTITION BY m.conversation_id ORDER BY m.created_at DESC) AS rn
        FROM
            public.messages m
        WHERE
            NOT EXISTS (
                SELECT 1
                FROM public.user_message_visibility umv
                WHERE umv.user_id = p_user_id AND umv.message_id = m.id AND umv.is_hidden = TRUE
            )
    )
    SELECT
        c.id,
        c.created_at,
        c.updated_at,
        (array_remove(c.participants, p_user_id))[1] AS other_user_id,
        u.username AS other_username,
        u.avatar_url AS other_avatar_url,
        lm.last_message_content,
        lm.last_message_created_at
    FROM
        public.conversations c
        JOIN public.user_conversation_settings ucs ON ucs.conversation_id = c.id AND ucs.user_id = p_user_id
        LEFT JOIN public.users u ON u.id = (array_remove(c.participants, p_user_id))[1]
        LEFT JOIN last_messages lm ON lm.conversation_id = c.id AND lm.rn = 1
    WHERE
        c.participants @> ARRAY[p_user_id]
        AND ucs.is_hidden = FALSE
        AND (ucs.is_archived IS NULL OR ucs.is_archived = FALSE)
    ORDER BY
        COALESCE(lm.last_message_created_at, c.updated_at) DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_conversations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_conversations(UUID) TO service_role;

-- Verification
DO $$
BEGIN
    RAISE NOTICE 'Function get_user_conversations(UUID) has been updated to exclude archived conversations.';
END $$;
