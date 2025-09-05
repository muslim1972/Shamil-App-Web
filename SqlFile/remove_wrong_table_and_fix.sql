
-- حذف الجدول الزائد وتصحيح المشكلة

-- 1. حذف الجدول الزائد conversations_members إذا كان موجوداً
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations_members') THEN
        DROP TABLE IF EXISTS public.conversations_members;
        RAISE NOTICE 'تم حذف جدول conversations_members الزائد';
    END IF;
END $$;

-- 2. حذف الدوال القديمة
DROP FUNCTION IF EXISTS public.get_user_conversations();
DROP FUNCTION IF EXISTS public.has_user_conversations();

-- 3. إنشاء دالة لجلب محادثات المستخدم (مصححة تماماً)
CREATE OR REPLACE FUNCTION public.get_user_conversations()
RETURNS TABLE (
    id UUID,
    name TEXT,
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

-- 4. إنشاء دالة للتحقق من وجود محادثات للمستخدم (مصححة تماماً)
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
