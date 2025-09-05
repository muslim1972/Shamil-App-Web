-- This RPC function fetches non-archived conversations for a given user.

CREATE OR REPLACE FUNCTION public.get_non_archived_conversations(p_user_id uuid)
RETURNS TABLE (
    id uuid,
    participants uuid[],
    created_at timestamptz,
    updated_at timestamptz,
    is_archived boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.participants,
        c.created_at,
        c.updated_at,
        COALESCE(ucs.is_archived, FALSE) AS is_archived -- Default to FALSE if no setting exists
    FROM
        public.conversations c
    LEFT JOIN
        public.user_conversation_settings ucs ON c.id = ucs.conversation_id AND ucs.user_id = p_user_id
    WHERE
        c.participants @> ARRAY[p_user_id] AND (ucs.is_archived IS NULL OR ucs.is_archived = FALSE);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_non_archived_conversations(uuid) TO authenticated;

SELECT 'RPC function get_non_archived_conversations created successfully.' as result;
