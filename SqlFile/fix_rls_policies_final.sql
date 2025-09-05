-- الخطوة 1: إنشاء دالة مساعدة لتجاوز مشكلة الاستدعاء الذاتي في سياسات RLS
-- هذه الدالة تعمل بصلاحيات المُنشئ (SECURITY DEFINER) وبالتالي لا تخضع لسياسات RLS عند الاستعلام داخلها
CREATE OR REPLACE FUNCTION public.is_conversation_member(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
-- تحديد مسار البحث بشكل صريح لزيادة الأمان ومنع استغلال الثغرات
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_members
    WHERE conversation_id = p_conversation_id AND user_id = auth.uid()
  );
$$;

-- الخطوة 2: حذف السياسات القديمة لتجنب أي تعارضات
DROP POLICY IF EXISTS "Allow read access to own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow read access to own conversation members" ON public.conversation_members;
DROP POLICY IF EXISTS "Allow read access to messages in user's conversations" ON public.messages;
DROP POLICY IF EXISTS "Allow insert access for conversation members" ON public.messages;

-- الخطوة 3: إعادة إنشاء جميع السياسات باستخدام الدالة المساعدة الجديدة

-- السياسة 1: السماح للمستخدم بقراءة المحادثات التي هو عضو فيها
CREATE POLICY "Allow read access to own conversations"
ON public.conversations FOR SELECT
USING (public.is_conversation_member(id));

-- السياسة 2: السماح للمستخدم بقراءة بيانات الأعضاء في المحادثات التي هو عضو فيها
CREATE POLICY "Allow read access to own conversation members"
ON public.conversation_members FOR SELECT
USING (public.is_conversation_member(conversation_id));

-- السياسة 3: السماح للمستخدم بقراءة الرسائل في المحادثات التي هو عضو فيها
CREATE POLICY "Allow read access to messages in user's conversations"
ON public.messages FOR SELECT
USING (public.is_conversation_member(conversation_id));

-- السياسة 4: السماح للمستخدم بإرسال رسائل في المحادثات التي هو عضو فيها
CREATE POLICY "Allow insert access for conversation members"
ON public.messages FOR INSERT
WITH CHECK (public.is_conversation_member(conversation_id));

-- رسالة تأكيد
SELECT 'تم إصلاح جميع سياسات RLS بنجاح باستخدام دالة مساعدة!' AS result;
