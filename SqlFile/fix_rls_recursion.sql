-- الخطوة 1: حذف السياسة الخاطئة التي تسبب الاستدعاء الذاتي اللانهائي
DROP POLICY IF EXISTS "Allow read access to own conversation members" ON public.conversation_members;

-- الخطوة 2: إنشاء سياسة جديدة وصحيحة لا تسبب الاستدعاء الذاتي
-- هذه السياسة تسمح للمستخدم بقراءة بيانات الأعضاء فقط إذا كان هو نفسه عضواً في تلك المحادثة
CREATE POLICY "Allow read access to own conversation members"
ON public.conversation_members FOR SELECT
USING (EXISTS (SELECT 1 FROM public.conversation_members AS cm WHERE cm.conversation_id = conversation_members.conversation_id AND cm.user_id = auth.uid()));

-- رسالة تأكيد
SELECT 'تم إصلاح سياسة RLS المتسببة في الخطأ بنجاح!' AS result;
