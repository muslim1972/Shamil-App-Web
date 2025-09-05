
-- حل مشكلة جلب المحادثات (مصحح)

-- 1. التحقق من وجود جدول conversation_members وتحديثه إذا لزم الأمر
DO $$
BEGIN
    -- التحقق من وجود جدول conversation_members
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversation_members') THEN
        RAISE NOTICE 'جدول conversation_members موجود بالفعل';

        -- التحقق من وجود عمود user_id في جدول conversation_members
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversation_members' AND column_name = 'user_id') THEN
            ALTER TABLE public.conversation_members ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
            RAISE NOTICE 'تمت إضافة عمود user_id لجدول conversation_members';
        END IF;
    END IF;
END $$;

-- 2. التحقق من جدول conversations وتحديثه إذا لزم الأمر
DO $$
BEGIN
    -- التحقق من وجود جدول conversations
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
        RAISE NOTICE 'جدول conversations موجود بالفعل';

        -- التحقق من وجود الأعمدة المطلوبة
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'name') THEN
            ALTER TABLE public.conversations ADD COLUMN name VARCHAR DEFAULT 'محادثة جديدة';
            RAISE NOTICE 'تمت إضافة عمود name لجدول conversations';
        END IF;

        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'created_at') THEN
            ALTER TABLE public.conversations ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
            RAISE NOTICE 'تمت إضافة عمود created_at لجدول conversations';
        END IF;

        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'updated_at') THEN
            ALTER TABLE public.conversations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
            RAISE NOTICE 'تمت إضافة عمود updated_at لجدول conversations';
        END IF;
    END IF;
END $$;

-- 3. حذف الدوال القديمة إذا كانت موجودة
DROP FUNCTION IF EXISTS public.get_user_conversations();
DROP FUNCTION IF EXISTS public.has_user_conversations();

-- 4. إنشاء دالة لجلب محادثات المستخدم (مصححة)
CREATE OR REPLACE FUNCTION public.get_user_conversations()
RETURNS TABLE (
    id UUID,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.name, c.created_at, c.updated_at
    FROM public.conversations c
    JOIN public.conversation_members cm ON c.id = cm.conversation_id
    WHERE cm.user_id = auth.uid()
    ORDER BY c.updated_at DESC;
END;
$$;

-- 5. إنشاء دالة للتحقق من وجود محادثات للمستخدم (مصححة)
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
