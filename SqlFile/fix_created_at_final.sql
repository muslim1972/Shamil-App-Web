-- استعلام نهائي لإصلاح مشكلة created_at غير المحدد

-- 1. حذف الدالة الحالية
DROP FUNCTION IF EXISTS public.get_user_conversations() CASCADE;

-- 2. إنشاء الدالة مع تحديد جميع الأعمدة بشكل صريح
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
    SELECT DISTINCT
        c.id,
        c.created_at,
        c.updated_at,
        ucs.user_id AS other_user_id,
        COALESCE(p.username, u.username, 'مستخدم آخر') AS other_username,
        COALESCE(u.avatar_url, NULL::TEXT) AS other_avatar_url,
        (SELECT m.content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_content,
        (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_created_at
    FROM conversations c
    JOIN user_conversation_settings ucs ON c.id = ucs.conversation_id
    JOIN users u ON ucs.user_id = u.id
    LEFT JOIN profiles p ON u.id = p.id
    WHERE EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = c.id)
    ORDER BY last_message_created_at DESC NULLS LAST;
END;
$$;

-- 3. منح الصلاحيات اللازمة
GRANT EXECUTE ON FUNCTION public.get_user_conversations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_conversations() TO service_role;

-- 4. التحقق من أن الدالة تم إنشاؤها بنجاح
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'get_user_conversations') THEN
        RAISE NOTICE 'تم إنشاء دالة get_user_conversations بنجاح';

        -- اختبار تنفيذ الدالة
        BEGIN
            EXECUTE 'SELECT * FROM public.get_user_conversations() LIMIT 1';
            RAISE NOTICE 'تم اختبار الدالة بنجاح';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'خطأ في اختبار الدالة: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'فشل إنشاء دالة get_user_conversations';
    END IF;
END $$;
