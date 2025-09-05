-- الخطوة 1: تفعيل RLS على الجداول إذا لم تكن مفعلة
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- الخطوة 2: حذف أي سياسات قديمة قد تكون موجودة لتجنب التعارضات
DROP POLICY IF EXISTS "Allow read access to own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow read access to own conversation members" ON public.conversation_members;
DROP POLICY IF EXISTS "Allow read access to messages in user's conversations" ON public.messages;
DROP POLICY IF EXISTS "Allow insert access for conversation members" ON public.messages;

-- الخطوة 3: إنشاء سياسات جديدة للسماح بالقراءة والإضافة

-- السياسة 1: السماح للمستخدم بقراءة المحادثات التي هو عضو فيها
CREATE POLICY "Allow read access to own conversations"
ON public.conversations FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM conversation_members WHERE conversation_id = id));

-- السياسة 2: السماح للمستخدم بقراءة بيانات الأعضاء في المحادثات التي هو عضو فيها
CREATE POLICY "Allow read access to own conversation members"
ON public.conversation_members FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM conversation_members cm WHERE cm.conversation_id = conversation_members.conversation_id));

-- السياسة 3: السماح للمستخدم بقراءة الرسائل في المحادثات التي هو عضو فيها
CREATE POLICY "Allow read access to messages in user's conversations"
ON public.messages FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM conversation_members WHERE conversation_id = messages.conversation_id));

-- السياسة 4: السماح للمستخدم بإرسال رسائل في المحادثات التي هو عضو فيها
CREATE POLICY "Allow insert access for conversation members"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() IN (SELECT user_id FROM conversation_members WHERE conversation_id = messages.conversation_id));

-- رسالة تأكيد
SELECT 'تم إنشاء سياسات RLS بنجاح!' AS result;
