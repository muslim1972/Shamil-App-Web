-- إصلاح مشكلة الجداول في قاعدة البيانات Supabase

-- 1. التحقق من وجود الجداول الأساسية وإنشائها إذا لم تكن موجودة

-- جدول المستخدمين
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR NOT NULL UNIQUE,
    email VARCHAR NOT NULL UNIQUE,
    password_hash VARCHAR,
    display_name VARCHAR,
    avatar_url TEXT,
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    push_token TEXT
);

-- جدول الملفات الشخصية
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- جدول المحادثات
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR,
    is_group BOOLEAN DEFAULT false NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    type TEXT DEFAULT 'regular'
);

-- جدول أعضاء المحادثة
CREATE TABLE IF NOT EXISTS public.conversation_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    is_admin BOOLEAN DEFAULT false NOT NULL,
    is_hidden BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    cleared_at TIMESTAMP WITH TIME ZONE,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (conversation_id, user_id)
);

-- جدول الرسائل
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    content TEXT,
    message_type TEXT DEFAULT 'text' NOT NULL,
    file_url TEXT,
    file_name TEXT,
    file_size BIGINT,
    reply_to UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT false NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    is_hidden BOOLEAN DEFAULT false,
    deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_for_all BOOLEAN DEFAULT false,
    file_metadata JSONB,
    forwarded_from_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    caption TEXT,
    media_metadata JSONB
);

-- جدول قراءة الرسائل
CREATE TABLE IF NOT EXISTS public.message_reads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (message_id, user_id)
);

-- جدول الرسائل المخفية
CREATE TABLE IF NOT EXISTS public.hidden_messages (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (user_id, message_id)
);

-- جدول رموز الإشعارات
CREATE TABLE IF NOT EXISTS public.push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. إنشاء الفهارس لتحسين الأداء

-- فهرس على عمود conversation_id في جدول messages
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages (conversation_id);

-- فهرس على عمود sender_id في جدول messages
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages (sender_id);

-- فهرس على عمود created_at في جدول messages
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages (created_at);

-- فهرس على عمود user_id في جدول conversation_members
CREATE INDEX IF NOT EXISTS conversation_members_user_id_idx ON public.conversation_members (user_id);

-- فهرس على عمود conversation_id في جدول conversation_members
CREATE INDEX IF NOT EXISTS conversation_members_conversation_id_idx ON public.conversation_members (conversation_id);

-- 3. إنشاء الدوال المساعدة

-- دالة لجلب تفاصيل المحادثة
CREATE OR REPLACE FUNCTION public.get_conversation_details(p_conversation_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    is_group BOOLEAN,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.name, c.is_group, c.created_by, c.created_at, c.updated_at, c.type
    FROM public.conversations c
    WHERE c.id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. إنشاء المحفزات (Triggers)

-- محفز لتحديث وقت التحديث في جدول المحادثات
CREATE OR REPLACE FUNCTION public.update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET updated_at = now()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_conversation_updated_at_trigger ON public.messages;
CREATE TRIGGER update_conversation_updated_at_trigger
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_conversation_updated_at();

-- 5. إنشاء سياسات الأمان (RLS)

-- تفعيل RLS على جميع الجداول
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لجدول المستخدمين
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
CREATE POLICY "Users can view all users"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can update their own user" ON public.users;
CREATE POLICY "Users can update their own user"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- سياسات الأمان لجدول المحادثات
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations"
    ON public.conversations
    FOR SELECT
    TO authenticated
    USING (
        id IN (
            SELECT conversation_id
            FROM public.conversation_members
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert conversations" ON public.conversations;
CREATE POLICY "Users can insert conversations"
    ON public.conversations
    FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

-- سياسات الأمان لجدول أعضاء المحادثة
DROP POLICY IF EXISTS "Users can view their conversation members" ON public.conversation_members;
CREATE POLICY "Users can view their conversation members"
    ON public.conversation_members
    FOR SELECT
    TO authenticated
    USING (
        conversation_id IN (
            SELECT conversation_id
            FROM public.conversation_members
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert conversation members" ON public.conversation_members;
CREATE POLICY "Users can insert conversation members"
    ON public.conversation_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        conversation_id IN (
            SELECT conversation_id
            FROM public.conversation_members
            WHERE user_id = auth.uid() AND is_admin = true
        ) OR
        conversation_id IN (
            SELECT id
            FROM public.conversations
            WHERE created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their own conversation member" ON public.conversation_members;
CREATE POLICY "Users can update their own conversation member"
    ON public.conversation_members
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- سياسات الأمان لجدول الرسائل
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations"
    ON public.messages
    FOR SELECT
    TO authenticated
    USING (
        conversation_id IN (
            SELECT conversation_id
            FROM public.conversation_members
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
CREATE POLICY "Users can insert messages"
    ON public.messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        conversation_id IN (
            SELECT conversation_id
            FROM public.conversation_members
            WHERE user_id = auth.uid()
        ) AND sender_id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages"
    ON public.messages
    FOR UPDATE
    TO authenticated
    USING (sender_id = auth.uid());

-- 6. إنشاء الوظائف المساعدة للتطبيق

-- دالة لإنشاء محادثة جديدة
CREATE OR REPLACE FUNCTION public.create_conversation(p_name VARCHAR, p_is_group BOOLEAN, p_members UUID[])
RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
    v_member UUID;
BEGIN
    -- إنشاء المحادثة
    INSERT INTO public.conversations (name, is_group, created_by)
    VALUES (p_name, p_is_group, auth.uid())
    RETURNING id INTO v_conversation_id;

    -- إضافة المنشئ كعضو وكمسؤول
    INSERT INTO public.conversation_members (conversation_id, user_id, is_admin)
    VALUES (v_conversation_id, auth.uid(), true);

    -- إضافة الأعضاء الآخرين
    FOREACH v_member IN ARRAY p_members
    LOOP
        IF v_member <> auth.uid() THEN
            INSERT INTO public.conversation_members (conversation_id, user_id, is_admin)
            VALUES (v_conversation_id, v_member, false);
        END IF;
    END LOOP;

    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. إصلاح أي جداول تم إضافتها بشكل خاطئ

-- حذف أي جداول تم إضافتها بشكل خاطئ (يمكن تعديل هذا حسب الحاجة)
-- DROP TABLE IF EXISTS public.calls;
-- DROP TABLE IF EXISTS public.call_participants;

-- 8. تحديث البيانات الموجودة

-- تحديث حقل updated_at في جدول المحادثات
UPDATE public.conversations
SET updated_at = (
    SELECT MAX(created_at)
    FROM public.messages
    WHERE conversation_id = conversations.id
)
WHERE id IN (
    SELECT DISTINCT conversation_id
    FROM public.messages
);