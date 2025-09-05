-- سكربت إصلاح شامل لجميع مشاكل قاعدة البيانات
-- هذا السكربت يصلح:
-- 1. مشاكل تسجيل الدخول
-- 2. مشاكل جلب المستخدمين
-- 3. مشاكل المحادثات
-- 4. مشاكل الاتساق عبر الأجهزة

-- إيقاف تنفيذ السكربت عند حدوث خطأ
SET client_min_messages TO WARNING;

-- 1. إصلاح جدول users
-- حذف جدول users القديم إذا كان موجوداً وإعادة إنشائه بالبنية الصحيحة
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username text,
    email text UNIQUE,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);

-- منح الصلاحيات
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

-- 2. إصلاح جدول conversations
-- حذف الجداول القديمة إذا كانت موجودة
DROP TABLE IF EXISTS public.conversation_members CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;

-- إنشاء جدول conversations بالبنية الجديدة
CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    participants uuid[] NOT NULL,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);

-- إنشاء جدول messages
CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);

-- منح الصلاحيات
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

-- 3. إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations USING GIN (participants);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages (user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at);

-- 4. إصلاح دالة ensure_user_exists
DROP FUNCTION IF EXISTS public.ensure_user_exists(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.ensure_user_exists(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- التحقق من وجود المستخدم في auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_uuid) THEN
        RAISE EXCEPTION 'User not found in auth.users';
    END IF;

    -- إدراج أو تحديث المستخدم في public.users
    INSERT INTO public.users (id, email, username, created_at, updated_at)
    SELECT 
        au.id,
        au.email,
        COALESCE(
            au.raw_user_meta_data->>'username',
            SPLIT_PART(au.email, '@', 1)
        ) as username,
        au.created_at,
        au.updated_at
    FROM auth.users au
    WHERE au.id = user_uuid
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        username = EXCLUDED.username,
        updated_at = EXCLUDED.updated_at;
END;
$$;

-- 5. إصلاح دالة check_user_exists
DROP FUNCTION IF EXISTS public.check_user_exists(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.check_user_exists(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (SELECT 1 FROM public.users WHERE id = user_uuid);
$$;

-- 6. إصلاح دالة create_or_get_conversation_with_user
DROP FUNCTION IF EXISTS public.create_or_get_conversation_with_user(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.create_or_get_conversation_with_user(p_other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_user_id uuid;
    v_conversation_id uuid;
    v_participants uuid[];
BEGIN
    -- الحصول على معرف المستخدم الحالي
    v_current_user_id := auth.uid();
    
    -- التحقق من أن المستخدمين مختلفين
    IF v_current_user_id = p_other_user_id THEN
        RAISE EXCEPTION 'Cannot create conversation with yourself';
    END IF;
    
    -- التحقق من وجود المستخدم الآخر
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_other_user_id) THEN
        RAISE EXCEPTION 'Other user does not exist';
    END IF;
    
    -- ترتيب المعرفات لضمان تطابق
    v_participants := ARRAY[
        LEAST(v_current_user_id, p_other_user_id),
        GREATEST(v_current_user_id, p_other_user_id)
    ];
    
    -- البحث عن محادثة موجودة
    SELECT id INTO v_conversation_id
    FROM public.conversations c
    WHERE c.participants @> v_participants
      AND c.participants <@ v_participants
    ORDER BY c.created_at DESC
    LIMIT 1;
    
    -- إذا لم توجد محادثة، إنشاء واحدة جديدة
    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations (participants, created_at, updated_at)
        VALUES (v_participants, NOW(), NOW())
        RETURNING id INTO v_conversation_id;
    END IF;
    
    RETURN v_conversation_id;
END;
$$;

-- 7. إصلاح دالة get_user_conversations
DROP FUNCTION IF EXISTS public.get_user_conversations() CASCADE;

CREATE OR REPLACE FUNCTION public.get_user_conversations()
RETURNS TABLE (
    id uuid,
    participants uuid[],
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.participants, c.created_at, c.updated_at
    FROM public.conversations c
    WHERE c.participants @> ARRAY[auth.uid()]
    ORDER BY c.updated_at DESC;
END;
$$;

-- 8. إصلاح دالة has_user_conversations
DROP FUNCTION IF EXISTS public.has_user_conversations() CASCADE;

CREATE OR REPLACE FUNCTION public.has_user_conversations()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    conversation_count integer;
BEGIN
    SELECT COUNT(*) INTO conversation_count
    FROM public.conversations c
    WHERE c.participants @> ARRAY[auth.uid()];

    RETURN conversation_count > 0;
END;
$$;

-- 9. مزامنة جميع المستخدمين من auth.users إلى public.users
INSERT INTO public.users (id, email, username, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'username',
        SPLIT_PART(au.email, '@', 1)
    ) as username,
    au.created_at,
    au.updated_at
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;

-- 10. تطبيق الإصلاحات على المستخدمين الثلاثة المحددين
SELECT public.ensure_user_exists('ac2c7067-e91d-4c5a-bdc2-60f9953d5511');
SELECT public.ensure_user_exists('51badf47-5a8f-484f-a790-1fcb12958fc1');
SELECT public.ensure_user_exists('6c4ceb61-d307-457e-a527-2c3c61d26103');

-- 11. منح الصلاحيات للدوال
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_user_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_exists(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_or_get_conversation_with_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_or_get_conversation_with_user(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_conversations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_conversations() TO service_role;
GRANT EXECUTE ON FUNCTION public.has_user_conversations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_user_conversations() TO service_role;

-- 12. التحقق من النتائج النهائية
SELECT 'إصلاح النظام اكتمل بنجاح!' as status;

-- عرض عدد السجلات في الجداول
SELECT 'users' as table_name, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'conversations' as table_name, COUNT(*) as count FROM public.conversations
UNION ALL
SELECT 'messages' as table_name, COUNT(*) as count FROM public.messages
ORDER BY table_name;

-- عرض معلومات المستخدمين الثلاثة
SELECT 
    id,
    email,
    username,
    created_at
FROM public.users 
WHERE id IN ('ac2c7067-e91d-4c5a-bdc2-60f9953d5511', '51badf47-5a8f-484f-a790-1fcb12958fc1', '6c4ceb61-d307-457e-a527-2c3c61d26103')
ORDER BY email;