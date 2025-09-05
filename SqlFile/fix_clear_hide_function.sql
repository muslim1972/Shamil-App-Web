
-- تعديل دالة clear_and_hide_conversation لضمان عملها بشكل صحيح
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

    -- تحديث جدول user_conversation_settings لإخفاء المحادثة للمستخدم الحالي
    -- استخدام INSERT ON CONFLICT لتحديث السجل إذا كان موجودًا أو إنشاؤه إذا لم يكن موجودًا
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

-- التحقق من إنشاء الدالة بنجاح
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'clear_and_hide_conversation') THEN
        RAISE NOTICE 'Function clear_and_hide_conversation updated successfully.';
    ELSE
        RAISE NOTICE 'Failed to update function clear_and_hide_conversation.';
    END IF;
END $$;
