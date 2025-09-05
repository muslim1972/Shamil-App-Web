
-- حل مشكلة عدم تطابق بنية الاستعلام مع النتيجة المتوقعة

-- 1. حذف الدوال القديمة
DROP FUNCTION IF EXISTS public.get_user_conversations();
DROP FUNCTION IF EXISTS public.has_user_conversations();

-- 2. إنشاء دالة لجلب محادثات المستخدم (مع ضمان تطابق بنية الجدول)
CREATE OR REPLACE FUNCTION public.get_user_conversations()
RETURNS TABLE (
    id UUID,
    name CHARACTER VARYING,
    is_group BOOLEAN,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.name, c.is_group, c.created_by, c.created_at, c.updated_at, c.type
    FROM public.conversations c
    JOIN public.conversation_members cm ON c.id = cm.conversation_id
    WHERE cm.user_id = auth.uid()
    ORDER BY c.updated_at DESC;
END;
$$;

-- 3. إنشاء دالة للتحقق من وجود محادثات للمستخدم
CREATE OR REPLACE FUNCTION public.has_user_conversations()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    conversation_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO conversation_count
    FROM public.conversations c
    JOIN public.conversation_members cm ON c.id = cm.conversation_id
    WHERE cm.user_id = auth.uid();

    RETURN conversation_count > 0;
END;
$$;
