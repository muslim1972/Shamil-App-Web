
-- حل مشكلة جلب المحادثات

-- 1. التحقق من وجود جدول conversations_members وإنشائه إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations_members') THEN
        CREATE TABLE public.conversations_members (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            UNIQUE(conversation_id, user_id)
        );

        RAISE NOTICE 'تم إنشاء جدول conversations_members';
    ELSE
        RAISE NOTICE 'جدول conversations_members موجود بالفعل';

        -- التحقق من وجود عمود user_id في جدول conversations_members
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations_members' AND column_name = 'user_id') THEN
            ALTER TABLE public.conversations_members ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
            RAISE NOTICE 'تمت إضافة عمود user_id لجدول conversations_members';
        END IF;
    END IF;
END $$;

-- 2. إضافة سياسات الأمان لجدول conversations_members
ALTER TABLE public.conversations_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own conversation memberships" ON public.conversations_members;
CREATE POLICY "Users can view their own conversation memberships" ON public.conversations_members
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own conversation memberships" ON public.conversations_members;
CREATE POLICY "Users can insert their own conversation memberships" ON public.conversations_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own conversation memberships" ON public.conversations_members;
CREATE POLICY "Users can delete their own conversation memberships" ON public.conversations_members
    FOR DELETE USING (auth.uid() = user_id);

-- 3. إنشاء دالة لجلب محادثات المستخدم
CREATE OR REPLACE FUNCTION public.get_user_conversations()
RETURNS TABLE (
    id UUID,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.title, c.created_at, c.updated_at
    FROM public.conversations c
    JOIN public.conversations_members cm ON c.id = cm.conversation_id
    WHERE cm.user_id = auth.uid()
    ORDER BY c.updated_at DESC;
END;
$$;

-- 4. إنشاء دالة للتحقق من وجود محادثات للمستخدم
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
    JOIN public.conversations_members cm ON c.id = cm.conversation_id
    WHERE cm.user_id = auth.uid();

    RETURN conversation_count > 0;
END;
$$;
