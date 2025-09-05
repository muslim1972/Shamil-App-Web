-- سكربت إصلاح للجداول الموجودة بدون حذفها
-- هذا السكربت يصلح البنية الحالية بدون إعادة إنشاء الجداول

-- 1. التحقق من وجود الجداول وإصلاحها إذا لزم الأمر
DO $$
BEGIN
    -- إصلاح جدول users إذا كان موجوداً
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        -- التحقق من وجود الأعمدة المطلوبة
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id') THEN
            ALTER TABLE public.users ADD COLUMN id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'username') THEN
            ALTER TABLE public.users ADD COLUMN username text;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
            ALTER TABLE public.users ADD COLUMN email text UNIQUE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
            ALTER TABLE public.users ADD COLUMN created_at timestamptz DEFAULT NOW();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
            ALTER TABLE public.users ADD COLUMN updated_at timestamptz DEFAULT NOW();
        END IF;
    END IF;

    -- إصلاح جدول conversations إذا كان موجوداً
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations' AND table_schema = 'public') THEN
        -- التحقق من وجود الأعمدة المطلوبة
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'participants') THEN
            ALTER TABLE public.conversations ADD COLUMN participants uuid[] NOT NULL DEFAULT '{}';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'created_at') THEN
            ALTER TABLE public.conversations ADD COLUMN created_at timestamptz DEFAULT NOW();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'updated_at') THEN
            ALTER TABLE public.conversations ADD COLUMN updated_at timestamptz DEFAULT NOW();
        END IF;
    END IF;

    -- إصلاح جدول messages إذا كان موجوداً
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') THEN
        -- التحقق من وجود الأعمدة المطلوبة
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'conversation_id') THEN
            ALTER TABLE public.messages ADD COLUMN conversation_id uuid;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'user_id') THEN
            ALTER TABLE public.messages ADD COLUMN user_id uuid;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'content') THEN
            ALTER TABLE public.messages ADD COLUMN content text NOT NULL DEFAULT '';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'created_at') THEN
            ALTER TABLE public.messages ADD COLUMN created_at timestamptz DEFAULT NOW();
        END IF;
    END IF;
END $$;

-- 2. إنشاء الفهارس المفقودة
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations USING GIN (participants);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages (user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at);

-- 3. إصلاح الدوال المطلوبة (DROP IF EXISTS ثم CREATE)
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

-- 4. إصلاح باقي الدوال
DROP FUNCTION IF EXISTS public.check_user_exists(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.check_user_exists(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (SELECT 1 FROM public.users WHERE id = user_uuid);
$$;

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

-- 4. مزامنة المستخدمين المفقودين
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
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 5. منح الصلاحيات
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

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

-- 6. التحقق من النتائج النهائية
SELECT 'إصلاح الجداول الموجودة اكتمل بنجاح!' as status;

-- عرض عدد السجلات في الجداول
SELECT 'users' as table_name, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'conversations' as table_name, COUNT(*) as count FROM public.conversations
UNION ALL
SELECT 'messages' as table_name, COUNT(*) as count FROM public.messages
ORDER BY table_name;