-- This RPC function fetches users with whom the current user has had conversations.
-- v4: Added display_name to the return table.

-- Drop the function if it exists to allow return type modification
DROP FUNCTION IF EXISTS public.get_contact_users(uuid);

CREATE OR REPLACE FUNCTION public.get_contact_users(p_user_id uuid)
RETURNS TABLE (
    id uuid,
    username character varying,
    email character varying,
    display_name character varying -- Changed type to character varying
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.username,
        u.email,
        u.display_name -- Added display_name
    FROM
        public.users u
    WHERE
        u.id IN (
            SELECT DISTINCT UNNEST(c.participants)
            FROM public.conversations c
            WHERE c.participants @> ARRAY[p_user_id]
        )
        AND u.id != p_user_id; -- Exclude the current user
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_contact_users(uuid) TO authenticated;

SELECT 'RPC function get_contact_users created successfully.' as result;