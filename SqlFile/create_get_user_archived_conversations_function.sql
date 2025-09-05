
-- إنشاء دالة جديدة لجلب المحادثات المؤرشفة مع اسم المستخدم الآخر

-- 1. حذف الدالة إذا كانت موجودة مسبقاً
DROP FUNCTION IF EXISTS public.get_user_archived_conversations() CASCADE;

-- 2. إنشاء الدالة الجديدة
CREATE OR REPLACE FUNCTION public.get_user_archived_conversations()
RETURNS TABLE(
    id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    other_user_id UUID,
    other_username TEXT,
    other_avatar_url TEXT,
    last_message_content TEXT,
    last_message_created_at TIMESTAMP WITH TIME ZONE,
    is_archived BOOLEAN,
    archived_at TIMESTAMP WITH TIME ZONE
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
        u.username::text AS other_username,
        NULL::text AS other_avatar_url,
        (SELECT m.content FROM public.messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_content,
        (SELECT m.created_at FROM public.messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_created_at,
        true AS is_archived,
        ucs.archived_at
    FROM
        public.conversations c
    LEFT JOIN
        public.users u ON u.id = (array_remove(c.participants, auth.uid()))[1]
    INNER JOIN
        public.user_conversation_settings ucs ON ucs.conversation_id = c.id AND ucs.user_id = auth.uid()
    WHERE
        c.participants @> ARRAY[auth.uid()] AND
        ucs.archived_at IS NOT NULL
    ORDER BY
        last_message_created_at DESC NULLS LAST;
END;
$$;

-- 3. منح الصلاحيات اللازمة
GRANT EXECUTE ON FUNCTION public.get_user_archived_conversations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_archived_conversations() TO service_role;

-- 4. التحقق من إنشاء الدالة بنجاح
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'get_user_archived_conversations') THEN
        RAISE NOTICE 'Function get_user_archived_conversations created successfully.';
    ELSE
        RAISE NOTICE 'Failed to create function get_user_archived_conversations.';
    END IF;
END $$;
