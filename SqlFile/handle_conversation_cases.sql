
-- حل مشكلة جلب المحادثات معالجة الحالات بشكل صحيح

-- 1. حذف الدوال القديمة
DROP FUNCTION IF EXISTS public.get_user_conversations();
DROP FUNCTION IF EXISTS public.has_user_conversations();

-- 2. إنشاء دالة لجلب محادثات المستخدم (معالجة الحالات بشكل صحيح)
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

    -- إذا لم يتم العثور على محادثات، ستعيد الدالة مجموعة فارغة بدون خطأ
    -- هذا يسمح للتطبيق بعرض واجهة المحادثات الفارغة
END;
$$;

-- 3. إنشاء دالة للتحقق من وجود محادثات للمستخدم (معالجة الحالات بشكل صحيح)
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

    -- إذا لم يكن هناك محادثات، تعيد الدالة false بدون خطأ
    RETURN conversation_count > 0;
END;
$$;
