
-- استعلامات أساسية لتطبيق الدردشة
-- يجب تنفيذ هذه الاستعلامات بالترتيب في محرر SQL في Supabase

-- 1. إنشاء جدول المستخدمين
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- 2. إنشاء جدول المحادثات
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. إنشاء جدول أعضاء المحادثات
CREATE TABLE IF NOT EXISTS public.conversation_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(conversation_id, user_id)
);

-- 4. إنشاء جدول الرسائل
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. إنشاء جدول الرموز المميزة للإشعارات
CREATE TABLE IF NOT EXISTS public.push_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(token)
);

-- 6. إنشاء جدول الرسائل المخفية
CREATE TABLE IF NOT EXISTS public.hidden_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, message_id)
);

-- 7. إنشاء جدول قراءة الرسائل
CREATE TABLE IF NOT EXISTS public.message_reads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, message_id)
);

-- 8. إنشاء سياسات الأمان (RLS) للجداول

-- تفعيل Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- سياسات جدول المستخدمين
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- سياسات جدول المحادثات
CREATE POLICY "Users can view conversations they are members of" ON public.conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_members
            WHERE conversation_members.conversation_id = conversations.id
            AND conversation_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert conversations they are members of" ON public.conversations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversation_members
            WHERE conversation_members.conversation_id = conversations.id
            AND conversation_members.user_id = auth.uid()
        )
    );

-- سياسات جدول أعضاء المحادثات
CREATE POLICY "Users can view conversation members" ON public.conversation_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_members
            WHERE conversation_members.conversation_id = conversation_members.conversation_id
            AND conversation_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert conversation members" ON public.conversation_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete themselves from conversations" ON public.conversation_members
    FOR DELETE USING (auth.uid() = user_id);

-- سياسات جدول الرسائل
CREATE POLICY "Users can view messages in conversations they are members of" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_members
            WHERE conversation_members.conversation_id = messages.conversation_id
            AND conversation_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in conversations they are members of" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" ON public.messages
    FOR DELETE USING (auth.uid() = user_id);

-- سياسات جدول الرموز المميزة للإشعارات
CREATE POLICY "Users can view their own push tokens" ON public.push_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push tokens" ON public.push_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push tokens" ON public.push_tokens
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push tokens" ON public.push_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- سياسات جدول الرسائل المخفية
CREATE POLICY "Users can view their own hidden messages" ON public.hidden_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hidden messages" ON public.hidden_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hidden messages" ON public.hidden_messages
    FOR DELETE USING (auth.uid() = user_id);

-- سياسات جدول قراءة الرسائل
CREATE POLICY "Users can view message reads" ON public.message_reads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_members
            WHERE conversation_members.conversation_id = (
                SELECT messages.conversation_id FROM public.messages
                WHERE messages.id = message_reads.message_id
            )
            AND conversation_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own message reads" ON public.message_reads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own message reads" ON public.message_reads
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own message reads" ON public.message_reads
    FOR DELETE USING (auth.uid() = user_id);

-- 9. إنشاء الدوال اللازمة للتطبيق

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

-- دالة للحصول على محادثات المستخدم
CREATE OR REPLACE FUNCTION public.get_user_conversations()
RETURNS TABLE(
    id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    other_user_id UUID,
    other_username TEXT,
    other_avatar_url TEXT,
    last_message_content TEXT,
    last_message_created_at TIMESTAMP WITH TIME ZONE,
    unread_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        c.id,
        c.created_at,
        c.updated_at,
        CASE 
            WHEN cm1.user_id = auth.uid() THEN cm2.user_id
            ELSE cm1.user_id
        END AS other_user_id,
        CASE 
            WHEN cm1.user_id = auth.uid() THEN u2.username
            ELSE u1.username
        END AS other_username,
        CASE 
            WHEN cm1.user_id = auth.uid() THEN u2.avatar_url
            ELSE u1.avatar_url
        END AS other_avatar_url,
        (
            SELECT m.content
            FROM public.messages m
            WHERE m.conversation_id = c.id
            ORDER BY m.created_at DESC
            LIMIT 1
        ) AS last_message_content,
        (
            SELECT m.created_at
            FROM public.messages m
            WHERE m.conversation_id = c.id
            ORDER BY m.created_at DESC
            LIMIT 1
        ) AS last_message_created_at,
        (
            SELECT COUNT(*)
            FROM public.messages m
            LEFT JOIN public.message_reads mr ON m.id = mr.message_id AND mr.user_id = auth.uid()
            WHERE m.conversation_id = c.id
            AND m.user_id != auth.uid()
            AND mr.message_id IS NULL
        ) AS unread_count
    FROM public.conversations c
    JOIN public.conversation_members cm1 ON c.id = cm1.conversation_id AND cm1.user_id = auth.uid()
    JOIN public.conversation_members cm2 ON c.id = cm2.conversation_id AND cm2.user_id != auth.uid()
    LEFT JOIN public.users u1 ON cm1.user_id = u1.id
    LEFT JOIN public.users u2 ON cm2.user_id = u2.id
    ORDER BY last_message_created_at DESC NULLS LAST;
END;
$$;

-- دالة للحصول على رسائل محادثة معينة
CREATE OR REPLACE FUNCTION public.get_conversation_messages(p_conversation_id UUID)
RETURNS TABLE(
    id UUID,
    conversation_id UUID,
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.conversation_id,
        m.user_id,
        u.username,
        u.avatar_url,
        m.content,
        m.created_at,
        m.updated_at
    FROM public.messages m
    JOIN public.users u ON m.user_id = u.id
    WHERE m.conversation_id = p_conversation_id
    AND EXISTS (
        SELECT 1 FROM public.conversation_members
        WHERE conversation_id = p_conversation_id
        AND user_id = auth.uid()
    )
    ORDER BY m.created_at ASC;
END;
$$;

-- دالة للحصول على رسائل المحادثة مع التحقق من قراءتها
CREATE OR REPLACE FUNCTION public.get_conversation_messages_with_read_status(p_conversation_id UUID)
RETURNS TABLE(
    id UUID,
    conversation_id UUID,
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    is_read BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.conversation_id,
        m.user_id,
        u.username,
        u.avatar_url,
        m.content,
        m.created_at,
        m.updated_at,
        CASE WHEN mr.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_read
    FROM public.messages m
    JOIN public.users u ON m.user_id = u.id
    LEFT JOIN public.message_reads mr ON m.id = mr.message_id AND mr.user_id = auth.uid()
    WHERE m.conversation_id = p_conversation_id
    AND EXISTS (
        SELECT 1 FROM public.conversation_members
        WHERE conversation_id = p_conversation_id
        AND user_id = auth.uid()
    )
    ORDER BY m.created_at ASC;
END;
$$;

-- دالة لتسجيل قراءة الرسائل
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(p_conversation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- إدراج سجلات قراءة للرسائل غير المقروءة
    INSERT INTO public.message_reads (user_id, message_id, read_at)
    SELECT 
        auth.uid(),
        m.id,
        now()
    FROM public.messages m
    LEFT JOIN public.message_reads mr ON m.id = mr.message_id AND mr.user_id = auth.uid()
    WHERE m.conversation_id = p_conversation_id
    AND m.user_id != auth.uid()
    AND mr.message_id IS NULL;
END;
$$;
