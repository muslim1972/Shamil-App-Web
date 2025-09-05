
-- تعديل دالة get_user_conversations لتستثني المحادثات المخفية
CREATE OR REPLACE FUNCTION public.get_user_conversations()
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    other_user_id UUID,
    other_username TEXT,
    other_avatar_url TEXT,
    last_message_content TEXT,
    last_message_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
RETURN QUERY
SELECT
c.id, c.created_at, c.updated_at,
(array_remove(c.participants, auth.uid()))[1] AS other_user_id,
u.username::text AS other_username,
NULL::text AS other_avatar_url,
(SELECT m.content FROM public.messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_content,
(SELECT m.created_at FROM public.messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_created_at
FROM public.conversations c
LEFT JOIN public.users u ON u.id = (array_remove(c.participants, auth.uid()))[1]
LEFT JOIN public.user_conversation_settings ucs ON c.id = ucs.conversation_id AND ucs.user_id = auth.uid()
WHERE c.participants @> ARRAY[auth.uid()] 
AND (ucs.is_archived IS NULL OR ucs.is_archived = FALSE)
AND (ucs.is_hidden IS NULL OR ucs.is_hidden = FALSE)  -- إضافة شرط لاستثناء المحادثات المخفية
ORDER BY last_message_created_at DESC NULLS LAST;
END;
$$;

-- منح الصلاحيات اللازمة
GRANT EXECUTE ON FUNCTION public.get_user_conversations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_conversations() TO service_role;

-- التحقق من تحديث الدالة بنجاح
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'get_user_conversations') THEN
        RAISE NOTICE 'Function get_user_conversations updated successfully.';
    ELSE
        RAISE NOTICE 'Failed to update function get_user_conversations.';
    END IF;
END $$;
