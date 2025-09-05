
-- الجزء 5 المعدل: الدوال المتقدمة
-- مع حذف الدوال الموجودة أولاً

-- حذف الدوال الموجودة إذا كانت موجودة
DROP FUNCTION IF EXISTS public.get_user_conversations();
DROP FUNCTION IF EXISTS public.get_conversation_messages(UUID);
DROP FUNCTION IF EXISTS public.get_conversation_messages_with_read_status(UUID);
DROP FUNCTION IF EXISTS public.mark_messages_as_read(UUID);

-- دالة للحصول على محادثات المستخدم
CREATE OR REPLACE FUNCTION public.get_user_conversations()
RETURNS TABLE(
    id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    other_user_id UUID,
    other_username TEXT,
    other_avatar_url TEXT,
    last_message_content TEXT,
    last_message_created_at TIMESTAMP WITH TIME ZONE,
    unread_count INTEGER
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
        CASE 
            WHEN cm1.user_id = auth.uid() THEN cm2.user_id
            ELSE cm1.user_id
        END AS other_user_id,
        CASE 
            WHEN cm1.user_id = auth.uid() THEN u2.username
            ELSE u1.username
        END AS other_username,
        CASE 
            WHEN cm1.user_id = auth.uid() THEN u2.avatar_url
            ELSE u1.avatar_url
        END AS other_avatar_url,
        (
            SELECT m.content
            FROM public.messages m
            WHERE m.conversation_id = c.id
            ORDER BY m.created_at DESC
            LIMIT 1
        ) AS last_message_content,
        (
            SELECT m.created_at
            FROM public.messages m
            WHERE m.conversation_id = c.id
            ORDER BY m.created_at DESC
            LIMIT 1
        )_message_created_at,
        (
            SELECT COUNT(*)
            FROM public.messages m
            LEFT JOIN public.message_reads mr ON m.id = mr.message_id AND mr.user_id = auth.uid()
            WHERE m.conversation_id = c.id
            AND m.user_id != auth.uid()
            AND mr.message_id IS NULL
        ) AS unread_count
    FROM public.conversations c
    JOIN public.conversation_members cm1 ON c.id = cm1.conversation_id AND cm1.user_id = auth.uid()
    JOIN public.conversation_members cm2 ON c.id = cm2.conversation_id AND cm2.user_id != auth.uid()
    LEFT JOIN public.users u1 ON cm1.user_id = u1.id
    LEFT JOIN public.users u2 ON cm2.user_id = u2.id
    ORDER BY last_message_created_at DESC NULLS LAST;
END;
$$;

-- دالة للحصول على رسائل محادثة معينة
CREATE OR REPLACE FUNCTION public.get_conversation_messages(p_conversation_id UUID)
RETURNS TABLE(
    id UUID conversation_id UUID,
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.conversation_id m.user_id,
        u.username,
        u.avatar_url,
        m.content,
        m.created_at,
        m.updated_at
    FROM public.messages m
    JOIN public.users u ON m.user_id = u.id
    WHERE m.conversation_id = p_conversation_id
    AND EXISTS (
        SELECT 1 FROM public.conversation_members
        WHERE conversation_id = p_conversation_id
        AND user_id = auth.uid()
    )
    ORDER BY m.created_at ASC;
END;
$$;

-- دالة للحصول على رسائل المحادثة مع التحقق من قراءتها
CREATE OR REPLACE FUNCTION public.get_conversation_messages_with_read_status(p_conversation_id UUID)
RETURNS TABLE(
    id UUID,
    conversation_id UUID,
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    is_read BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.conversation_id,
        m.user_id,
        u.username,
        u.avatar_url,
        m.content,
        m.created_at,
        m.updated_at,
        CASE WHEN mr.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_read
    FROM public.messages m
    JOIN public.users u ON m.user_id = u.id
    LEFT JOIN public.message_reads mr ON m.id = mr.message_id AND mr.user_id = auth.uid()
    WHERE m.conversation_id = p_conversation_id
    AND EXISTS (
        SELECT 1 FROM public.conversation_members
        WHERE conversation_id = p_conversation_id
        AND user_id = auth.uid()
    )
    ORDER BY m.created_at ASC;
END;
$$;

-- دالة لتسجيل قراءة الرسائل
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(p_conversation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- إدراج سجلات قراءة للرسائل غير المقروءة
    INSERT INTO public.message_reads (user_id, message_id, read_at)
    SELECT 
        auth.uid(),
        m.id,
        now()
    FROM public.messages m
    LEFT JOIN public.message_reads mr ON m.id = mr.message_id AND mr.user_id = auth.uid()
    WHERE m.conversation_id = p_conversation_id
    AND m.user_id != auth.uid()
    AND mr.message_id IS NULL;
END;
$$;
