
-- إنشاء الدوال المفقودة لحذف المحادثات

-- 1. إنشاء دالة delete_conversation_for_all
DROP FUNCTION IF EXISTS public.delete_conversation_for_all(p_conversation_id UUID) CASCADE;

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

-- منح الصلاحيات اللازمة
GRANT EXECUTE ON FUNCTION public.delete_conversation_for_all(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_conversation_for_all(UUID) TO service_role;

-- 2. إنشاء دالة clear_and_hide_conversation
DROP FUNCTION IF EXISTS public.clear_and_hide_conversation(p_conversation_id UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.clear_and_hide_conversation(p_conversation_id UUID)
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

    -- حذف جميع الرسائل للمستخدم الحالي فقط
    -- (نقوم بتحديث جدول user_conversation_settings لإخفاء المحادثة للمستخدم الحالي)
    INSERT INTO public.user_conversation_settings (user_id, conversation_id, is_hidden, hidden_at)
    VALUES (auth.uid(), p_conversation_id, TRUE, NOW())
    ON CONFLICT (user_id, conversation_id) DO UPDATE
    SET is_hidden = TRUE, hidden_at = NOW();

    -- إرجاع true للإشارة إلى نجاح العملية
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        -- في حالة حدوث أي خطأ، إرجاع false
        RETURN FALSE;
END;
$$;

-- منح الصلاحيات اللازمة
GRANT EXECUTE ON FUNCTION public.clear_and_hide_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_and_hide_conversation(UUID) TO service_role;

-- التحقق من إنشاء الدوال بنجاح
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'delete_conversation_for_all') THEN
        RAISE NOTICE 'Function delete_conversation_for_all created successfully.';
    ELSE
        RAISE NOTICE 'Failed to create function delete_conversation_for_all.';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'clear_and_hide_conversation') THEN
        RAISE NOTICE 'Function clear_and_hide_conversation created successfully.';
    ELSE
        RAISE NOTICE 'Failed to create function clear_and_hide_conversation.';
    END IF;
END $$;
