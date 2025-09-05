-- هذا السكربت يقوم بإعداد قاعدة بيانات Supabase لمشروع CallApp من الصفر.
-- يرجى تنفيذه في محرر SQL الخاص بمشروع Supabase الجديد.

-- 1. حذف جميع الجداول والدوال والمحفزات والسياسات الموجودة لضمان بداية نظيفة
-- (تجاهل الأخطاء إذا لم تكن موجودة)

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_new_message_trigger ON public.messages CASCADE;

DROP FUNCTION IF EXISTS public.is_conversation_member(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.ensure_user_exists() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_conversations() CASCADE;
DROP FUNCTION IF EXISTS public.get_archived_conversations() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_new_message() CASCADE;

DROP TABLE IF EXISTS public.message_reads CASCADE;
DROP TABLE IF EXISTS public.hidden_messages CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversation_members CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.push_tokens CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. تمكين إضافة pg_net (ضروري لاستدعاء دوال Edge Functions)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 3. إنشاء الجداول
CREATE TABLE public.users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    username character varying(255) NOT NULL UNIQUE,
    email character varying(255) NOT NULL UNIQUE,
    password_hash character varying(255),
    display_name character varying(255),
    avatar_url text,
    is_online boolean DEFAULT false,
    last_seen timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    push_token text
);

CREATE TABLE public.conversations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name character varying(255),
    is_group boolean DEFAULT false,
    created_by uuid REFERENCES public.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    type text
);

CREATE TABLE public.conversation_members (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at timestamp with time zone DEFAULT now(),
    is_admin boolean DEFAULT false,
    is_hidden boolean DEFAULT false,
    is_archived boolean DEFAULT false,
    cleared_at timestamp with time zone,
    last_read_at timestamp with time zone,
    UNIQUE (conversation_id, user_id)
);

CREATE TABLE public.messages (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    message_type text NOT NULL,
    file_url text,
    file_name text,
    file_size bigint,
    reply_to uuid REFERENCES public.messages(id) ON DELETE SET NULL,
    is_edited boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_hidden boolean DEFAULT false,
    deleted_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    deleted_for_all boolean DEFAULT false,
    file_metadata jsonb,
    forwarded_from_message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
    caption text,
    media_metadata jsonb
);

CREATE TABLE public.message_reads (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    read_at timestamp with time zone DEFAULT now(),
    UNIQUE (message_id, user_id)
);

CREATE TABLE public.hidden_messages (
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, message_id)
);

CREATE TABLE public.push_tokens (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    token text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. إنشاء الدوال

-- دالة مساعدة لسياسات RLS
CREATE OR REPLACE FUNCTION public.is_conversation_member(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_members
    WHERE conversation_id = p_conversation_id AND user_id = auth.uid()
  );
$$;

-- دالة ensure_user_exists (من ملف maintenance.md)
CREATE OR REPLACE FUNCTION public.ensure_user_exists()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'username')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- دالة get_user_conversations (من ملف maintenance.md)
CREATE OR REPLACE FUNCTION public.get_user_conversations()
RETURNS TABLE (
    id uuid,
    name character varying,
    is_group boolean,
    created_by uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    type text,
    last_message_content text,
    last_message_created_at timestamp with time zone,
    unread_count bigint,
    other_user_id uuid,
    other_username character varying,
    other_avatar_url text
)
LANGUAGE plpgsql
AS $$
DECLARE
    current_user_id uuid := auth.uid();
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        CASE
            WHEN c.is_group THEN c.name
            ELSE (SELECT u.username FROM public.users u JOIN public.conversation_members cm_other ON u.id = cm_other.user_id WHERE cm_other.conversation_id = c.id AND cm_other.user_id != current_user_id LIMIT 1)
        END AS name,
        c.is_group,
        c.created_by,
        c.created_at,
        c.updated_at,
        c.type,
        (SELECT m.content FROM public.messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_content,
        (SELECT m.created_at FROM public.messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_created_at,
        (SELECT COUNT(m.id) FROM public.messages m JOIN public.conversation_members cm ON m.conversation_id = cm.conversation_id WHERE m.conversation_id = c.id AND m.created_at > cm.last_read_at AND m.sender_id != current_user_id AND cm.user_id = current_user_id) AS unread_count,
        (SELECT u.id FROM public.users u JOIN public.conversation_members cm_other ON u.id = cm_other.user_id WHERE cm_other.conversation_id = c.id AND cm_other.user_id != current_user_id LIMIT 1) AS other_user_id,
        (SELECT u.username FROM public.users u JOIN public.conversation_members cm_other ON u.id = cm_other.user_id WHERE cm_other.conversation_id = c.id AND cm_other.user_id != current_user_id LIMIT 1) AS other_username,
        (SELECT u.avatar_url FROM public.users u JOIN public.conversation_members cm_other ON u.id = cm_other.user_id WHERE cm_other.conversation_id = c.id AND cm_other.user_id != current_user_id LIMIT 1) AS other_avatar_url
    FROM
        public.conversations c
    JOIN
        public.conversation_members cm ON c.id = cm.conversation_id
    WHERE
        cm.user_id = current_user_id
    ORDER BY
        last_message_created_at DESC NULLS LAST;
END;
$$;

-- دالة get_archived_conversations (من ملف maintenance.md)
CREATE OR REPLACE FUNCTION public.get_archived_conversations()
RETURNS TABLE (
    id uuid,
    name character varying,
    is_group boolean,
    created_by uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    type text,
    last_message_content text,
    last_message_created_at timestamp with time zone,
    unread_count bigint,
    other_user_id uuid,
    other_username character varying,
    other_avatar_url text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        CASE
            WHEN c.is_group THEN c.name
            ELSE (SELECT u.username FROM public.users u JOIN public.conversation_members cm_other ON u.id = cm_other.user_id WHERE cm_other.conversation_id = c.id AND cm_other.user_id != auth.uid() LIMIT 1)
        END AS name,
        c.is_group,
        c.created_by,
        c.created_at,
        c.updated_at,
        c.type,
        (SELECT m.content FROM public.messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_content,
        (SELECT m.created_at FROM public.messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_created_at,
        (SELECT COUNT(m.id) FROM public.messages m JOIN public.conversation_members cm ON m.conversation_id = cm.conversation_id WHERE m.conversation_id = c.id AND m.created_at > cm.cleared_at AND m.sender_id != auth.uid() AND cm.user_id = auth.uid()) AS unread_count,
        (SELECT u.id FROM public.users u JOIN public.conversation_members cm_other ON u.id = cm_other.user_id WHERE cm_other.conversation_id = c.id AND cm_other.user_id != auth.uid() LIMIT 1) AS other_user_id,
        (SELECT u.username FROM public.users u JOIN public.conversation_members cm_other ON u.id = cm_other.user_id WHERE cm_other.conversation_id = c.id AND cm_other.user_id != auth.uid() LIMIT 1) AS other_username,
        (SELECT u.avatar_url FROM public.users u JOIN public.conversation_members cm_other ON u.id = cm_other.user_id WHERE cm_other.conversation_id = c.id AND cm_other.user_id != auth.uid() LIMIT 1) AS other_avatar_url
    FROM
        public.conversations c
    JOIN
        public.conversation_members cm ON c.id = cm.conversation_id
    WHERE
        cm.user_id = auth.uid() AND cm.is_archived = TRUE
    ORDER BY
        last_message_created_at DESC NULLS LAST;
END;
$$;

-- 5. إنشاء المحفزات

-- محفز لإنشاء مستخدم جديد في جدول public.users عند تسجيل الدخول
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.ensure_user_exists();

-- محفز لإرسال إشعارات عند إضافة رسالة جديدة
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://vrsuvebfqubzejpmoqqe.supabase.co/functions/v1/send-push-notification',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyc3V2ZWJmcXViemVqcG1vcXFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDUyMTM4MiwiZXhwIjoyMDcwMDk3MzgyfQ.QaM0x1PIcPDUDTVvxEx9D-wiDaCZKxQUEcYIS-DhoQU"}'::jsonb,
    body := jsonb_build_object('record', NEW)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_message_trigger
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_message();

-- 6. سياسات RLS

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- سياسات جدول users
CREATE POLICY "Allow public read access to users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow users to update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- سياسات جدول conversations
CREATE POLICY "Allow read access to own conversations" ON public.conversations FOR SELECT USING (public.is_conversation_member(id));
CREATE POLICY "Allow insert for conversation members" ON public.conversations FOR INSERT WITH CHECK (public.is_conversation_member(id));

-- سياسات جدول conversation_members
CREATE POLICY "Allow read access to own conversation members" ON public.conversation_members FOR SELECT USING (public.is_conversation_member(conversation_id));
CREATE POLICY "Allow insert for conversation members" ON public.conversation_members FOR INSERT WITH CHECK (public.is_conversation_member(conversation_id));

-- سياسات جدول messages
CREATE POLICY "Allow read access to messages in user's conversations" ON public.messages FOR SELECT USING (public.is_conversation_member(conversation_id));
CREATE POLICY "Allow insert access for conversation members" ON public.messages FOR INSERT WITH CHECK (public.is_conversation_member(conversation_id));

-- سياسات جدول message_reads
CREATE POLICY "Allow read access to own message reads" ON public.message_reads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow insert for own message reads" ON public.message_reads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- سياسات جدول hidden_messages
CREATE POLICY "Allow read access to own hidden messages" ON public.hidden_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow insert for own hidden messages" ON public.hidden_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- سياسات جدول push_tokens
CREATE POLICY "Allow read access to own push tokens" ON public.push_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow insert for own push tokens" ON public.push_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow update for own push tokens" ON public.push_tokens FOR UPDATE USING (auth.uid() = user_id);

-- رسالة تأكيد نهائية
SELECT 'تم إعداد قاعدة البيانات الجديدة بنجاح!' AS result;
