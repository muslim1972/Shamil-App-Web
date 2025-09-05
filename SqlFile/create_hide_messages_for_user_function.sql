-- Creates the function to hide messages for a specific user
CREATE OR REPLACE FUNCTION public.hide_messages_for_user(p_message_ids uuid[])
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Insert entries into the visibility table to mark messages as hidden for the current user
    INSERT INTO public.user_message_visibility (user_id, message_id, is_hidden)
    SELECT auth.uid(), unnest(p_message_ids), TRUE
    ON CONFLICT (user_id, message_id) DO UPDATE
    SET is_hidden = TRUE;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        -- In case of any error, return false
        RETURN FALSE;
END;
$function$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.hide_messages_for_user(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hide_messages_for_user(uuid[]) TO service_role;

-- Verification
DO $$
BEGIN
    RAISE NOTICE 'Function hide_messages_for_user has been created successfully.';
END $$;
