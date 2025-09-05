
-- الجزء 4 المعدل: إنشاء الدوال الأساسية اللازمة للتطبيق
-- مع حذف الدوال الموجودة أولاً

-- حذف الدوال الموجودة إذا كانت موجودة مع CASCADE
DROP FUNCTION IF EXISTS public.create_or_get_conversation_with_user(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.ensure_user_exists() CASCADE;

-- دالة لإنشاء أو الحصول على محادثة مع مستخدم آخر
CREATE OR REPLACE FUNCTION public.create_or_get_conversation_with_user(p_other_user_id UUID)
RETURNS TABLE(conversation_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conversation_id UUID;
    v_current_user_id UUID;
BEGIN
    -- الحصول على معرف المستخدم الحالي
    v_current_user_id := auth.uid();

    -- البحث عن محادثة موجودة بين المستخدمين
    SELECT conversation_id INTO v_conversation_id
    FROM public.conversation_members cm1
    JOIN public.conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
    WHERE cm1.user_id = v_current_user_id
    AND cm2.user_id = p_other_user_id
    AND (SELECT COUNT(*) FROM public.conversation_members WHERE conversation_id = cm1.conversation_id) = 2;

    -- إذا لم يتم العثور على محادثة، قم بإنشاء واحدة جديدة
    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO v_conversation_id;

        -- إضافة المستخدم الحالي إلى المحادثة
        INSERT INTO public.conversation_members (conversation_id, user_id)
        VALUES (v_conversation_id, v_current_user_id);

        -- إضافة المستخدم الآخر إلى المحادثة
        INSERT INTO public.conversation_members (conversation_id, user_id)
        VALUES (v_conversation_id, p_other_user_id);
    END IF;

    -- إرجاع معرف المحادثة
    RETURN QUERY SELECT v_conversation_id;
END;
$$;

-- دالة للتحقق من وجود المستخدم وإنشائه إذا لم يكن موجودًا
CREATE OR REPLACE FUNCTION public.ensure_user_exists()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- إدراج المستخدم إذا لم يكن موجودًا
    INSERT INTO public.users (id, username)
    SELECT auth.uid(), COALESCE(
        (SELECT raw_user_meta_data->>'username' FROM auth.users WHERE id = auth.uid()),
        'مستخدم جديد'
    )
    ON CONFLICT (id) DO NOTHING;
END;
$$;
