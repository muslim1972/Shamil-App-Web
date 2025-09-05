-- الإصلاح الشامل النهائي لجميع مشكلات قاعدة البيانات
-- هذا السكربت يصلح جميع المشكلات المتبقية

-- 1. إصلاح جدول conversations وإضافة عمود participants
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' AND column_name = 'participants' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.conversations ADD COLUMN participants UUID[] NOT NULL DEFAULT '{}'::UUID[];
    END IF;
END $$;

-- 2. إنشاء جدول conversations إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participants UUID[] NOT NULL DEFAULT '{}'::UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. إنشاء جدول messages إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_forwarded BOOLEAN DEFAULT FALSE,
    original_message_id UUID REFERENCES public.messages(id)
);

-- 4. إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations USING GIN (participants);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at);

-- 5. إصلاح وظيفة ensure_user_exists
DROP FUNCTION IF EXISTS public.ensure_user_exists(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.ensure_user_exists(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION public.ensure_user_exists(user_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- التحقق من وجود المستخدم في auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_uuid) THEN
        RAISE EXCEPTION 'User not found in auth.users';
    END IF;

    -- إدراج أو تحديث المستخدم في public.users
    INSERT INTO public.users (id, email, username, password, created_at, updated_at)
    SELECT 
        au.id,
        au.email,
        COALESCE(
            au.raw_user_meta_data->>'username',
            SPLIT_PART(au.email, '@', 1)
        ) as username,
        '123456' as password,
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

-- 6. إصلاح وظيفة check_user_exists
DROP FUNCTION IF EXISTS public.check_user_exists(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.check_user_exists(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION public.check_user_exists(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (SELECT 1 FROM public.users WHERE id = user_uuid);
$$;

-- 7. إصلاح وظيفة create_or_get_conversation_with_user
DROP FUNCTION IF EXISTS public.create_or_get_conversation_with_user(UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.create_or_get_conversation_with_user(p_other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_user_id UUID;
    v_conversation_id UUID;
    v_participants UUID[];
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

-- 8. منح الصلاحيات اللازمة
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_exists(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_or_get_conversation_with_user(UUID) TO authenticated;
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.conversations TO anon;
GRANT ALL ON public.messages TO anon;

-- 9. التحقق من وجود المستخدمين الثلاثة وتزامنهم
SELECT 'التحقق النهائي من المستخدمين:' as final_check;
SELECT 
    u.id,
    u.email,
    u.username,
    au.raw_user_meta_data->>'username' as auth_username,
    CASE 
        WHEN au.id IS NOT NULL THEN 'موجود في auth.users'
        ELSE 'غير موجود في auth.users'
    END as auth_status
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email IN ('muslimalmulali@gmail.com', 'muslimakkeel@gmail.com', 'lumaalbahadli@gmail.com')
ORDER BY u.email;

-- 10. إعادة تشغيل وظيفة ensure_user_exists للمستخدمين الثلاثة
SELECT public.ensure_user_exists('ac2c7067-e91d-4c5a-bdc2-60f9953d5511');
SELECT public.ensure_user_exists('51badf47-5a8f-484f-a790-1fcb12958fc1');
SELECT public.ensure_user_exists('6c4ceb61-d307-457e-a527-2c3c61d26103');

-- 11. التحقق من عدد السجلات في النهاية
SELECT 'عدد السجلات بعد الإصلاح:' as final_count;
SELECT 'users' as table_name, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'conversations' as table_name, COUNT(*) as count FROM public.conversations
UNION ALL
SELECT 'messages' as table_name, COUNT(*) as count FROM public.messages;