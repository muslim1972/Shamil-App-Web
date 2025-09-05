
-- ملف للتحقق من وجود الجداول والأعمدة وإصلاح المشاكل

-- أولاً، دعنا نتحقق من وجود الجداول
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- التحقق من وجود جدول المستخدمين
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
    ) INTO table_exists;

    IF NOT table_exists THEN
        RAISE NOTICE 'جدول المستخدمين غير موجود، جاري إنشاؤه';
        CREATE TABLE public.users (
            id UUID REFERENCES auth.users(id) PRIMARY KEY,
            username TEXT,
            avatar_url TEXT,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            CONSTRAINT username_length CHECK (char_length(username) >= 3)
        );
    ELSE
        RAISE NOTICE 'جدول المستخدمين موجود بالفعل';
    END IF;

    -- التحقق من وجود جدول المحادثات
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'conversations'
    ) INTO table_exists;

    IF NOT table_exists THEN
        RAISE NOTICE 'جدول المحادثات غير موجود، جاري إنشاؤه';
        CREATE TABLE public.conversations (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
    ELSE
        RAISE NOTICE 'جدول المحادثات موجود بالفعل';
    END IF;

    -- التحقق من وجود جدول أعضاء المحادثات
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'conversation_members'
    ) INTO table_exists;

    IF NOT table_exists THEN
        RAISE NOTICE 'جدول أعضاء المحادثات غير موجود، جاري إنشاؤه';
        CREATE TABLE public.conversation_members (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            UNIQUE(conversation_id, user_id)
        );
    ELSE
        RAISE NOTICE 'جدول أعضاء المحادثات موجود بالفعل';
    END IF;

    -- التحقق من وجود جدول الرسائل
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'messages'
    ) INTO table_exists;

    IF NOT table_exists THEN
        RAISE NOTICE 'جدول الرسائل غير موجود، جاري إنشاؤه';
        CREATE TABLE public.messages (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            content TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
    ELSE
        RAISE NOTICE 'جدول الرسائل موجود بالفعل';
    END IF;

    -- التحقق من وجود جدول الرموز المميزة للإشعارات
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'push_tokens'
    ) INTO table_exists;

    IF NOT table_exists THEN
        RAISE NOTICE 'جدول الرموز المميزة للإشعارات غير موجود، جاري إنشاؤه';
        CREATE TABLE public.push_tokens (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            token TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            UNIQUE(token)
        );
    ELSE
        RAISE NOTICE 'جدول الرموز المميزة للإشعارات موجود بالفعل';
    END IF;

    -- التحقق من وجود جدول الرسائل المخفية
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'hidden_messages'
    ) INTO table_exists;

    IF NOT table_exists THEN
        RAISE NOTICE 'جدول الرسائل المخفية غير موجود، جاري إنشاؤه';
        CREATE TABLE public.hidden_messages (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            UNIQUE(user_id, message_id)
        );
    ELSE
        RAISE NOTICE 'جدول الرسائل المخفية موجود بالفعل';
    END IF;

    -- التحقق من وجود جدول قراءة الرسائل
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'message_reads'
    ) INTO table_exists;

    IF NOT table_exists THEN
        RAISE NOTICE 'جدول قراءة الرسائل غير موجود، جاري إنشاؤه';
        CREATE TABLE public.message_reads (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
            read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            UNIQUE(user_id, message_id)
        );
    ELSE
        RAISE NOTICE 'جدول قراءة الرسائل موجود بالفعل';
    END IF;
END $$;

-- ثانياً، دعنا نتحقق من تفعيل Row Level Security
DO $$
BEGIN
    -- تفعيل Row Level Security لجميع الجداول
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.hidden_messages ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

    RAISE NOTICE 'تم تفعيل Row Level Security لجميع الجداول';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'حدث خطأ أثناء تفعيل Row Level Security: %', SQLERRM;
END $$;
