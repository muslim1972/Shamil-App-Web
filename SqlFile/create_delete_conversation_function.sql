
-- إنشاء دالة لحذف المحادثة للجميع
-- هذه الدالة غير موجودة حالياً في قاعدة البيانات وهي مطلوبة للتطبيق

-- 1. حذف الدالة إذا كانت موجودة مسبقاً (للتأكد)
DROP FUNCTION IF EXISTS public.delete_conversation_for_all(p_conversation_id UUID) CASCADE;

-- 2. إنشاء الدالة الجديدة
CREATE OR REPLACE FUNCTION public.delete_conversation_for_all(p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- التحقق من أن المستخدم الحالي مشارك في المحادثة
    IF NOT EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = p_conversation_id AND c.participants @> ARRAY[auth.uid()]
    ) THEN
        RAISE EXCEPTION 'User is not a participant in this conversation';
    END IF;

    -- حذف جميع الرسائل المرتبطة بالمحادثة
    DELETE FROM public.messages 
    WHERE conversation_id = p_conversation_id;

    -- حذف إعدادات المحادثة للمستخدمين
    DELETE FROM public.user_conversation_settings 
    WHERE conversation_id = p_conversation_id;

    -- حذف المحادثة نفسها
    DELETE FROM public.conversations 
    WHERE id = p_conversation_id;

    -- إرجاع true للإشارة إلى نجاح العملية
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        -- في حالة حدوث أي خطأ، إرجاع false
        RETURN FALSE;
END;
$$;

-- 3. منح الصلاحيات اللازمة
GRANT EXECUTE ON FUNCTION public.delete_conversation_for_all(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_conversation_for_all(UUID) TO service_role;

-- 4. التحقق من إنشاء الدالة بنجاح
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'delete_conversation_for_all') THEN
        RAISE NOTICE 'Function delete_conversation_for_all created successfully.';
    ELSE
        RAISE NOTICE 'Failed to create function delete_conversation_for_all.';
    END IF;
END $$;
