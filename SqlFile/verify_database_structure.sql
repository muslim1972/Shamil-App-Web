-- التحقق من بنية قاعدة البيانات وإنشاء الجداول المفقودة

-- 1. التحقق من وجود جدول users
SELECT 'جدول users:' as table_check;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. التحقق من وجود جدول conversations
SELECT 'جدول conversations:' as table_check;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'conversations' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. إنشاء جدول conversations إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participants UUID[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. إنشاء جدول messages إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_forwarded BOOLEAN DEFAULT FALSE,
    original_message_id UUID REFERENCES public.messages(id)
);

-- 5. إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations USING GIN (participants);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at);

-- 6. منح الصلاحيات اللازمة
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.conversations TO anon;
GRANT ALL ON public.messages TO anon;

-- 7. التحقق من وجود جميع الجداول
SELECT 'جميع الجداول:' as tables_check;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 8. التحقق من عدد السجلات في كل جدول
SELECT 'عدد السجلات:' as count_check;
SELECT 'users' as table_name, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'conversations' as table_name, COUNT(*) as count FROM public.conversations
UNION ALL
SELECT 'messages' as table_name, COUNT(*) as count FROM public.messages;