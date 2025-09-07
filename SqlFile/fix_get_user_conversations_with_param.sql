
-- سكربت لتعديل دالة get_user_conversations (التي تأخذ معرف المستخدم كمعامل)
-- لإضافة شرط استبعاد المحادثات المؤرشفة

-- 1. حفظ نسخة احتياطية من الدالة الحالية
DO $$
DECLARE
    current_function TEXT;
BEGIN
    SELECT routine_definition INTO current_function
    FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_name = 'get_user_conversations'
    AND routine_type = 'FUNCTION' AND external_language = 'plpgsql'
    AND routine_definition LIKE '%p_user_id%';

    -- حفظ الدالة الحالية في جدول مؤقت
    CREATE TEMP TABLE IF NOT EXISTS backup_functions AS
    SELECT 'get_user_conversations_with_param' as function_name, current_function as function_definition;

    RAISE NOTICE 'تم حفظ نسخة احتياطية من الدالة الحالية';
END $$;

-- 2. تعديل الدالة التي تأخذ معرف المستخدم كمعامل
DROP FUNCTION IF EXISTS public.get_user_conversations(UUID);

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
        AND (ucs.is_hidden = FALSE OR lm.last_message_created_at > ucs.hidden_at)
        AND (ucs.is_archived IS NULL OR ucs.is_archived = FALSE)  -- إضافة شرط لاستبعاد المحادثات المؤرشفة
    ORDER BY
        COALESCE(lm.last_message_created_at, c.updated_at) DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- منح الصلاحيات اللازمة
GRANT EXECUTE ON FUNCTION public.get_user_conversations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_conversations(UUID) TO service_role;

-- 3. إنشاء دالة للتراجع عن التغيير
CREATE OR REPLACE FUNCTION public.restore_get_user_conversations_with_param()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    backup_function TEXT;
BEGIN
    -- استعادة الدالة الأصلية من النسخة الاحتياطية
    SELECT function_definition INTO backup_function
    FROM backup_functions
    WHERE function_name = 'get_user_conversations_with_param';

    -- حذف الدالة الحالية
    DROP FUNCTION IF EXISTS public.get_user_conversations(UUID);

    -- تنفيذ الدالة الأصلية
    EXECUTE backup_function;

    -- منح الصلاحيات
    GRANT EXECUTE ON FUNCTION public.get_user_conversations(UUID) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.get_user_conversations(UUID) TO service_role;

    RAISE NOTICE 'تم استعادة الدالة الأصلية بنجاح';
END;
$$;

-- 4. التحقق من التعديل
DO $$
DECLARE
    function_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'get_user_conversations'
        AND routine_definition LIKE '%p_user_id%'
        AND routine_definition LIKE '%ucs.is_archived%'
    ) INTO function_exists;

    IF function_exists THEN
        RAISE NOTICE 'تم تعديل الدالة التي تأخذ معرف المستخدم كمعامل بنجاح';
        RAISE NOTICE 'للتراجع عن التغيير، قم بتنفيذ: SELECT public.restore_get_user_conversations_with_param();';
    ELSE
        RAISE NOTICE 'فشل في تعديل الدالة، يرجى التحقق من الأخطاء';
    END IF;
END $$;
